import Anthropic from "@anthropic-ai/sdk";
import type { Transcript } from "../parsers/types.js";
import {
  ExtractionResultSchema,
  RawFactsSchema,
  type ExtractionResult,
  type RawFacts,
} from "./schema.js";
import { formatTranscriptForPrompt } from "./prompt.js";
import { chunkTranscript } from "./chunk.js";
import { ExtractionError } from "./claude.js";
import { EXTRACTION_TOOL, RAW_FACTS_TOOL } from "./tools.js";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 4096;

export type ProgressStage = "extracting" | "synthesising";

export type MultiPassOptions = {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  onProgress?: (stage: ProgressStage) => void;
};

const PASS_1_SYSTEM = `You analyse meeting transcript chunks and extract raw facts.

You will be given several CHUNKS of a single meeting's transcript, delimited by chunk boundaries.
Across all chunks, identify:
- Every task or action item mentioned
- Every decision made
- Every question raised but not resolved
- Every speaker who appeared

Respond ONLY by calling the record_raw_facts tool with combined arrays across all chunks.
Do not deduplicate yet — that happens in a later pass.`;

const PASS_2_SYSTEM = `You synthesise raw meeting facts into a structured extraction.

You will be given raw facts (tasks, decisions, questions, speakers) collected from across a meeting.
Your job: deduplicate, structure, and produce the final extraction.

For each action_item, infer owner / due / priority from the task wording when possible.
For each decision, attribute made_by from the wording when possible.
Write a one-paragraph summary covering the main outcomes.
For attendees, estimate per-person word_count proportionally and list the topics each owned.

Respond ONLY by calling the record_extraction tool.`;

function formatChunksForPass1(chunks: Transcript[]): string {
  return chunks
    .map((chunk, i) => `--- Chunk ${i + 1} of ${chunks.length} ---\n${formatTranscriptForPrompt(chunk)}`)
    .join("\n\n");
}

function formatRawFactsForPass2(facts: RawFacts): string {
  return [
    "Tasks mentioned:",
    ...facts.tasks_mentioned.map((t) => `- ${t}`),
    "",
    "Decisions mentioned:",
    ...facts.decisions_mentioned.map((d) => `- ${d}`),
    "",
    "Questions raised:",
    ...facts.questions_raised.map((q) => `- ${q}`),
    "",
    "Speakers seen:",
    ...facts.speakers_seen.map((s) => `- ${s}`),
  ].join("\n");
}

export async function extractStructuredMultiPass(
  transcript: Transcript,
  opts: MultiPassOptions,
): Promise<ExtractionResult> {
  if (!opts.apiKey || opts.apiKey.trim() === "") {
    throw new ExtractionError(
      "Anthropic apiKey is required — set it in the extension settings.",
    );
  }

  const client = new Anthropic({ apiKey: opts.apiKey });
  const model = opts.model ?? DEFAULT_MODEL;
  const maxTokens = opts.maxTokens ?? DEFAULT_MAX_TOKENS;

  opts.onProgress?.("extracting");

  const chunks = chunkTranscript(transcript);

  let pass1Response;
  try {
    pass1Response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: PASS_1_SYSTEM,
      tools: [RAW_FACTS_TOOL],
      tool_choice: { type: "tool", name: "record_raw_facts" },
      messages: [{ role: "user", content: formatChunksForPass1(chunks) }],
    });
  } catch (err) {
    throw new ExtractionError(
      `Claude pass-1 call failed: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  }

  const pass1Tool = pass1Response.content.find(
    (b): b is Extract<typeof b, { type: "tool_use" }> => b.type === "tool_use",
  );
  if (!pass1Tool) {
    throw new ExtractionError("Pass 1: Claude response did not contain a tool_use block");
  }
  const rawFacts = RawFactsSchema.safeParse(pass1Tool.input);
  if (!rawFacts.success) {
    throw new ExtractionError(
      `Pass 1 raw-facts response failed schema validation: ${rawFacts.error.message}`,
      rawFacts.error,
    );
  }

  opts.onProgress?.("synthesising");

  let pass2Response;
  try {
    pass2Response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: PASS_2_SYSTEM,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: "tool", name: "record_extraction" },
      messages: [{ role: "user", content: formatRawFactsForPass2(rawFacts.data) }],
    });
  } catch (err) {
    throw new ExtractionError(
      `Claude pass-2 call failed: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  }

  const pass2Tool = pass2Response.content.find(
    (b): b is Extract<typeof b, { type: "tool_use" }> => b.type === "tool_use",
  );
  if (!pass2Tool) {
    throw new ExtractionError("Pass 2: Claude response did not contain a tool_use block");
  }
  const finalParsed = ExtractionResultSchema.safeParse(pass2Tool.input);
  if (!finalParsed.success) {
    throw new ExtractionError(
      `Pass 2 extraction response failed schema validation: ${finalParsed.error.message}`,
      finalParsed.error,
    );
  }
  return finalParsed.data;
}

import Anthropic from "@anthropic-ai/sdk";
import type { Transcript } from "../parsers/types.js";
import { ExtractionResultSchema, type ExtractionResult } from "./schema.js";
import { SYSTEM_PROMPT, formatTranscriptForPrompt } from "./prompt.js";
import { EXTRACTION_TOOL } from "./tools.js";
import { countWords, MULTIPASS_THRESHOLD } from "./chunk.js";
import { extractStructuredMultiPass, type ProgressStage } from "./multipass.js";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 4096;

export type ExtractionOptions = {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  onProgress?: (stage: ProgressStage) => void;
};

export class ExtractionError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
    this.name = "ExtractionError";
  }
}

export async function extractStructured(
  transcript: Transcript,
  opts: ExtractionOptions,
): Promise<ExtractionResult> {
  if (!opts.apiKey || opts.apiKey.trim() === "") {
    throw new ExtractionError(
      "Anthropic apiKey is required — set it in the extension settings.",
    );
  }

  if (countWords(transcript) > MULTIPASS_THRESHOLD) {
    return extractStructuredMultiPass(transcript, opts);
  }

  const client = new Anthropic({ apiKey: opts.apiKey });

  let response;
  try {
    response = await client.messages.create({
      model: opts.model ?? DEFAULT_MODEL,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: "tool", name: "record_extraction" },
      messages: [
        {
          role: "user",
          content: formatTranscriptForPrompt(transcript),
        },
      ],
    });
  } catch (err) {
    throw new ExtractionError(
      `Claude API call failed: ${err instanceof Error ? err.message : String(err)}`,
      err,
    );
  }

  const toolUse = response.content.find(
    (block): block is Extract<typeof block, { type: "tool_use" }> =>
      block.type === "tool_use",
  );
  if (!toolUse) {
    throw new ExtractionError("Claude response did not contain a tool_use block");
  }

  const parsed = ExtractionResultSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new ExtractionError(
      `Claude response failed schema validation: ${parsed.error.message}`,
      parsed.error,
    );
  }
  return parsed.data;
}

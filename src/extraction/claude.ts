import Anthropic from "@anthropic-ai/sdk";
import type { Transcript } from "../parsers/types.js";
import { ExtractionResultSchema, type ExtractionResult } from "./schema.js";
import { SYSTEM_PROMPT, formatTranscriptForPrompt } from "./prompt.js";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 4096;

export type ExtractionOptions = {
  apiKey: string;
  model?: string;
  maxTokens?: number;
};

export class ExtractionError extends Error {
  constructor(message: string, public override readonly cause?: unknown) {
    super(message);
    this.name = "ExtractionError";
  }
}

const EXTRACTION_TOOL = {
  name: "record_extraction",
  description: "Records the structured extraction of a meeting transcript.",
  input_schema: {
    type: "object" as const,
    properties: {
      action_items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            task: { type: "string" },
            owner: { type: ["string", "null"] },
            due: { type: ["string", "null"] },
            priority: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["task", "owner", "due", "priority"],
        },
      },
      decisions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            decision: { type: "string" },
            made_by: { type: ["string", "null"] },
          },
          required: ["decision", "made_by"],
        },
      },
      open_questions: { type: "array", items: { type: "string" } },
      summary: { type: "string" },
      attendees: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            topics: { type: "array", items: { type: "string" } },
            word_count: { type: "number" },
          },
          required: ["name", "topics", "word_count"],
        },
      },
    },
    required: ["action_items", "decisions", "open_questions", "summary", "attendees"],
  },
};

export async function extractStructured(
  transcript: Transcript,
  opts: ExtractionOptions,
): Promise<ExtractionResult> {
  if (!opts.apiKey || opts.apiKey.trim() === "") {
    throw new ExtractionError(
      "Anthropic apiKey is required — set it in the extension settings.",
    );
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

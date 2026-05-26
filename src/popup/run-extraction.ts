import type { Transcript } from "../parsers/types.js";
import type { ExtractionResult } from "../extraction/schema.js";
import { runPasteExtraction } from "./run-paste-extraction.js";
import { runFromTranscript } from "./run-from-transcript.js";

export type ExtractInput = string | Transcript;

export async function runExtraction(input: ExtractInput): Promise<ExtractionResult> {
  if (typeof input === "string") {
    return runPasteExtraction(input);
  }
  return runFromTranscript(input);
}

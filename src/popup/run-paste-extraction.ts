import { parseTxt } from "../parsers/txt.js";
import { runFromTranscript } from "./run-from-transcript.js";
import type { ExtractionResult } from "../extraction/schema.js";

export async function runPasteExtraction(input: string): Promise<ExtractionResult> {
  const parsed = parseTxt(input);
  return runFromTranscript(parsed);
}

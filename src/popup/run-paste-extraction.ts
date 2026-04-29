import { parseTxt } from "../parsers/txt.js";
import { mergeAdjacentSameSpeaker } from "../transcript/diarisation.js";
import { extractStructured } from "../extraction/claude.js";
import { getSettings } from "../storage/settings.js";
import type { ExtractionResult } from "../extraction/schema.js";

export async function runPasteExtraction(input: string): Promise<ExtractionResult> {
  const settings = await getSettings();
  if (!settings.apiKey || settings.apiKey.trim() === "") {
    throw new Error(
      "Anthropic API key is not set. Open the extension settings and paste your key.",
    );
  }

  const parsed = parseTxt(input);
  const cleaned = mergeAdjacentSameSpeaker(parsed);

  return extractStructured(cleaned, { apiKey: settings.apiKey });
}

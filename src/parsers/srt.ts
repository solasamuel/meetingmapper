import { ParseError, type Transcript, type TranscriptEntry } from "./types.js";
import { extractSpeaker } from "./speaker.js";

const CUE_INDEX = /^\d+$/;
const TIMESTAMP_LINE = /^(\d{2}:\d{2}:\d{2})[.,]\d{3}\s*-->/;

export function parseSrt(input: string): Transcript {
  if (input.trim() === "") {
    throw new ParseError("empty transcript");
  }

  const lines = input.split(/\r?\n/);
  const entries: TranscriptEntry[] = [];

  let currentText: string[] = [];
  let currentTimestamp: string | null = null;

  const flush = () => {
    if (currentText.length > 0) {
      const { speaker, text } = extractSpeaker(currentText.join(" "));
      entries.push({ speaker, text, timestamp: currentTimestamp });
      currentText = [];
      currentTimestamp = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.trim() === "") {
      flush();
      continue;
    }
    if (CUE_INDEX.test(line.trim())) continue;
    const tsMatch = TIMESTAMP_LINE.exec(line);
    if (tsMatch) {
      currentTimestamp = tsMatch[1] ?? null;
      continue;
    }
    currentText.push(line.trim());
  }
  flush();

  return entries;
}

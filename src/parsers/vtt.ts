import { ParseError, type Transcript, type TranscriptEntry } from "./types.js";

const TIMESTAMP_LINE = /^(\d{2}:\d{2}:\d{2})[.,]\d{3}\s*-->/;
const SPEAKER_PREFIX = /^([A-Za-z][\w .'-]{0,48}?):\s+(.*)$/;

function extractSpeaker(text: string): { speaker: string | null; text: string } {
  const match = SPEAKER_PREFIX.exec(text);
  if (!match) return { speaker: null, text };
  return { speaker: match[1]!.trim(), text: match[2]! };
}

export function parseVtt(input: string): Transcript {
  if (input.trim() === "") {
    throw new ParseError("empty transcript");
  }

  const lines = input.split(/\r?\n/);
  const entries: TranscriptEntry[] = [];

  let i = 0;
  if (lines[0]?.startsWith("WEBVTT")) {
    i = 1;
  } else {
    throw new ParseError("missing WEBVTT header", 1);
  }

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

  for (; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.trim() === "") {
      flush();
      continue;
    }
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

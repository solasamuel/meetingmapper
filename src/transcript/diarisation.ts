import type { Transcript, TranscriptEntry } from "../parsers/types.js";

export function mergeAdjacentSameSpeaker(entries: Transcript): Transcript {
  const result: TranscriptEntry[] = [];

  for (const entry of entries) {
    const last = result.at(-1);
    if (last && entry.speaker !== null && last.speaker === entry.speaker) {
      last.text = `${last.text} ${entry.text}`;
      continue;
    }
    result.push({ ...entry });
  }

  return result;
}

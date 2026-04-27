import type { Transcript, TranscriptEntry } from "../parsers/types.js";

export const WORDS_PER_CHUNK = 1500;
export const MULTIPASS_THRESHOLD = 3000;

export function countWords(transcript: Transcript): number {
  return transcript.reduce((sum, e) => sum + e.text.trim().split(/\s+/).filter(Boolean).length, 0);
}

export function chunkTranscript(transcript: Transcript): Transcript[] {
  if (transcript.length === 0) return [];

  const chunks: TranscriptEntry[][] = [];
  let current: TranscriptEntry[] = [];
  let currentWords = 0;

  for (const entry of transcript) {
    const entryWords = entry.text.trim().split(/\s+/).filter(Boolean).length;
    if (current.length > 0 && currentWords + entryWords > WORDS_PER_CHUNK) {
      chunks.push(current);
      current = [];
      currentWords = 0;
    }
    current.push(entry);
    currentWords += entryWords;
  }
  if (current.length > 0) chunks.push(current);

  return chunks;
}

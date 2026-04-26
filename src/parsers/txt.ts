import { ParseError, type Transcript } from "./types.js";
import { extractSpeaker } from "./speaker.js";

export function parseTxt(input: string): Transcript {
  if (input.trim() === "") {
    throw new ParseError("empty transcript");
  }

  const lines = input.split(/\r?\n/).filter((line) => line.trim() !== "");

  const parsed = lines.map((line) => extractSpeaker(line.trim()));
  const anyLabelled = parsed.some((p) => p.speaker !== null);

  if (!anyLabelled) {
    return [{ speaker: null, text: lines.map((l) => l.trim()).join(" "), timestamp: null }];
  }

  return parsed.map(({ speaker, text }) => ({ speaker, text, timestamp: null }));
}

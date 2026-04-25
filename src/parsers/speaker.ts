const SPEAKER_PREFIX = /^([A-Za-z][\w .'-]{0,48}?):\s+(.*)$/;

export function extractSpeaker(text: string): { speaker: string | null; text: string } {
  const match = SPEAKER_PREFIX.exec(text);
  if (!match) return { speaker: null, text };
  return { speaker: match[1]!.trim(), text: match[2]! };
}

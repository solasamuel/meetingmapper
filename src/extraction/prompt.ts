import type { Transcript } from "../parsers/types.js";

export const SYSTEM_PROMPT = `You analyse meeting transcripts and extract structured outputs.

You will be given a transcript of a meeting. Identify:
- Action items (tasks to be done, with owner if mentioned, due date if mentioned, priority)
- Decisions made during the meeting
- Open questions raised but not resolved
- A one-paragraph summary
- Per-attendee word counts and the topics they spoke about

Respond ONLY by calling the record_extraction tool with the structured data.
Never include free-form prose in your response — the tool call is the entire output.`;

export function formatTranscriptForPrompt(transcript: Transcript): string {
  if (transcript.length === 0) return "(empty transcript)";
  return transcript
    .map((entry) => {
      const speaker = entry.speaker ?? "Unknown";
      const ts = entry.timestamp ? `[${entry.timestamp}] ` : "";
      return `${ts}${speaker}: ${entry.text}`;
    })
    .join("\n");
}

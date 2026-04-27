import type { ExtractionResult } from "../extraction/schema.js";

const MAX_SUBJECT_LENGTH = 80;

export type EmailExport = {
  subject: string;
  body: string;
};

function deriveSubject(summary: string): string {
  const firstSentence = summary.split(/(?<=[.!?])\s/)[0] ?? summary;
  if (firstSentence.length <= MAX_SUBJECT_LENGTH) {
    return firstSentence.trim();
  }
  return firstSentence.slice(0, MAX_SUBJECT_LENGTH - 1).trimEnd() + "…";
}

function renderActionItems(items: ExtractionResult["action_items"]): string[] {
  if (items.length === 0) return ["(none)"];
  return items.map((item) => {
    const owner = item.owner ?? "Unassigned";
    const due = item.due ?? "No due date";
    return `- ${item.task} — ${owner}, due ${due}, priority ${item.priority}`;
  });
}

function renderDecisions(decisions: ExtractionResult["decisions"]): string[] {
  if (decisions.length === 0) return ["(none)"];
  return decisions.map((d) => {
    const by = d.made_by ? ` (${d.made_by})` : "";
    return `- ${d.decision}${by}`;
  });
}

function renderQuestions(questions: string[]): string[] {
  if (questions.length === 0) return ["(none)"];
  return questions.map((q) => `- ${q}`);
}

function renderAttendees(attendees: ExtractionResult["attendees"]): string[] {
  if (attendees.length === 0) return ["(none)"];
  return attendees.map(
    (a) => `- ${a.name} (${a.word_count} words): ${a.topics.join(", ")}`,
  );
}

export function formatEmail(result: ExtractionResult): EmailExport {
  const sections = [
    "ACTION ITEMS",
    ...renderActionItems(result.action_items),
    "",
    "DECISIONS",
    ...renderDecisions(result.decisions),
    "",
    "OPEN QUESTIONS",
    ...renderQuestions(result.open_questions),
    "",
    "SUMMARY",
    result.summary,
    "",
    "ATTENDEES",
    ...renderAttendees(result.attendees),
  ];

  return {
    subject: deriveSubject(result.summary),
    body: sections.join("\n"),
  };
}

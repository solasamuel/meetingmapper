import type { ExtractionResult } from "../extraction/schema.js";

export const SLACK_MESSAGE_LIMIT = 40000;
const TRUNCATION_NOTICE = "\n\n_…output truncated to fit Slack's message limit._";

function renderActionItems(items: ExtractionResult["action_items"]): string {
  if (items.length === 0) return "_None_";
  return items
    .map((item) => {
      const owner = item.owner ?? "Unassigned";
      const due = item.due ?? "No due date";
      return `• ${item.task} — ${owner} · ${due} · ${item.priority}`;
    })
    .join("\n");
}

function renderDecisions(decisions: ExtractionResult["decisions"]): string {
  if (decisions.length === 0) return "_None_";
  return decisions
    .map((d) => {
      const by = d.made_by ? ` (${d.made_by})` : "";
      return `• ${d.decision}${by}`;
    })
    .join("\n");
}

function renderQuestions(questions: string[]): string {
  if (questions.length === 0) return "_None_";
  return questions.map((q) => `• ${q}`).join("\n");
}

function renderAttendees(attendees: ExtractionResult["attendees"]): string {
  if (attendees.length === 0) return "_None_";
  return attendees
    .map((a) => `• ${a.name} (${a.word_count} words): ${a.topics.join(", ")}`)
    .join("\n");
}

export function formatSlack(result: ExtractionResult): string {
  const body = [
    "*Action Items*",
    renderActionItems(result.action_items),
    "",
    "*Decisions*",
    renderDecisions(result.decisions),
    "",
    "*Open Questions*",
    renderQuestions(result.open_questions),
    "",
    "*Summary*",
    result.summary,
    "",
    "*Attendees*",
    renderAttendees(result.attendees),
  ].join("\n");

  if (body.length <= SLACK_MESSAGE_LIMIT) return body;

  const budget = SLACK_MESSAGE_LIMIT - TRUNCATION_NOTICE.length;
  return body.slice(0, budget) + TRUNCATION_NOTICE;
}

import type { ExtractionResult } from "../extraction/schema.js";

function renderActionItems(items: ExtractionResult["action_items"]): string {
  if (items.length === 0) return "_None_";
  return items
    .map((item) => {
      const owner = item.owner ?? "Unassigned";
      const due = item.due ?? "No due date";
      return `- [ ] ${item.task} — ${owner} · ${due} · ${item.priority}`;
    })
    .join("\n");
}

function renderDecisions(decisions: ExtractionResult["decisions"]): string {
  if (decisions.length === 0) return "_None_";
  return decisions
    .map((d) => {
      const by = d.made_by ? ` (${d.made_by})` : "";
      return `- ${d.decision}${by}`;
    })
    .join("\n");
}

function renderQuestions(questions: string[]): string {
  if (questions.length === 0) return "_None_";
  return questions.map((q) => `- ${q}`).join("\n");
}

function renderAttendees(attendees: ExtractionResult["attendees"]): string {
  if (attendees.length === 0) return "_None_";
  return attendees
    .map((a) => `- **${a.name}** (${a.word_count} words): ${a.topics.join(", ")}`)
    .join("\n");
}

export function formatNotion(result: ExtractionResult): string {
  return [
    "# Meeting Notes",
    "",
    "## Action Items",
    renderActionItems(result.action_items),
    "",
    "## Decisions",
    renderDecisions(result.decisions),
    "",
    "## Open Questions",
    renderQuestions(result.open_questions),
    "",
    "## Summary",
    result.summary,
    "",
    "## Attendees",
    renderAttendees(result.attendees),
  ].join("\n");
}

import type { ExtractionResult } from "../../extraction/schema.js";

export const sampleResult: ExtractionResult = {
  action_items: [
    { task: "Send follow-up email to design team", owner: "Alice", due: "2026-05-01", priority: "high" },
    { task: "Review PR #42", owner: "Bob", due: null, priority: "medium" },
    { task: "Schedule kickoff", owner: null, due: null, priority: "low" },
  ],
  decisions: [
    { decision: "Ship v1 next Friday", made_by: "Bob" },
    { decision: "Drop the Confluence export from v1", made_by: null },
  ],
  open_questions: [
    "Who owns the migration?",
    "Do we need a feature flag for the rollout?",
  ],
  summary:
    "The team aligned on shipping v1 next Friday and deferred two design decisions to a follow-up. Alice will send a recap to the design team while Bob reviews the outstanding PR.",
  attendees: [
    { name: "Alice", topics: ["roadmap", "design recap"], word_count: 412 },
    { name: "Bob", topics: ["release", "PR review"], word_count: 287 },
  ],
};

export const minimalResult: ExtractionResult = {
  action_items: [],
  decisions: [],
  open_questions: [],
  summary: "Brief check-in, nothing to report.",
  attendees: [],
};

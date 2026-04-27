export const EXTRACTION_TOOL = {
  name: "record_extraction",
  description: "Records the structured extraction of a meeting transcript.",
  input_schema: {
    type: "object" as const,
    properties: {
      action_items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            task: { type: "string" },
            owner: { type: ["string", "null"] },
            due: { type: ["string", "null"] },
            priority: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["task", "owner", "due", "priority"],
        },
      },
      decisions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            decision: { type: "string" },
            made_by: { type: ["string", "null"] },
          },
          required: ["decision", "made_by"],
        },
      },
      open_questions: { type: "array", items: { type: "string" } },
      summary: { type: "string" },
      attendees: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            topics: { type: "array", items: { type: "string" } },
            word_count: { type: "number" },
          },
          required: ["name", "topics", "word_count"],
        },
      },
    },
    required: ["action_items", "decisions", "open_questions", "summary", "attendees"],
  },
};

export const RAW_FACTS_TOOL = {
  name: "record_raw_facts",
  description:
    "Records the raw facts (tasks, decisions, questions, speakers) extracted from a meeting transcript. Used for the first pass of multi-pass extraction.",
  input_schema: {
    type: "object" as const,
    properties: {
      tasks_mentioned: { type: "array", items: { type: "string" } },
      decisions_mentioned: { type: "array", items: { type: "string" } },
      questions_raised: { type: "array", items: { type: "string" } },
      speakers_seen: { type: "array", items: { type: "string" } },
    },
    required: ["tasks_mentioned", "decisions_mentioned", "questions_raised", "speakers_seen"],
  },
};

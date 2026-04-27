import { z } from "zod";

export const ActionItemSchema = z.object({
  task: z.string(),
  owner: z.string().nullable(),
  due: z.string().nullable(),
  priority: z.enum(["high", "medium", "low"]),
});

export const DecisionSchema = z.object({
  decision: z.string(),
  made_by: z.string().nullable(),
});

export const AttendeeSchema = z.object({
  name: z.string(),
  topics: z.array(z.string()),
  word_count: z.number(),
});

export const ExtractionResultSchema = z.object({
  action_items: z.array(ActionItemSchema),
  decisions: z.array(DecisionSchema),
  open_questions: z.array(z.string()),
  summary: z.string(),
  attendees: z.array(AttendeeSchema),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
export type ActionItem = z.infer<typeof ActionItemSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type Attendee = z.infer<typeof AttendeeSchema>;

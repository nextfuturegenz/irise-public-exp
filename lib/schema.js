import { z } from "zod";

// The structured shape we force the AI to return.
// This is the "trick" behind reliable AI apps — no messy text parsing.
export const actionItemsSchema = z.object({
  meeting_summary: z
    .string()
    .describe("A single concise sentence summarizing the meeting."),
  action_items: z
    .array(
      z.object({
        task: z.string().describe("Clear description of the task to be done."),
        owner: z
          .string()
          .nullable()
          .describe("Person responsible, or null if not mentioned."),
        deadline: z
          .string()
          .nullable()
          .describe("Date or timeframe, or null if not mentioned."),
        priority: z
          .enum(["high", "medium", "low"])
          .describe("Inferred from urgency and impact."),
      })
    )
    .describe("Every actionable commitment found in the notes."),
});

export const SYSTEM_PROMPT = `You are an expert meeting analyst.
Extract every action item from the meeting notes you are given.
For each action item, identify the task, the owner (the person responsible),
the deadline, and a priority level.
Be thorough — capture every commitment, decision, and follow-up.
Infer priority from urgency and business impact.
If an owner or deadline is not mentioned, use null for that field.`;

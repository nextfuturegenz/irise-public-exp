import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { actionItemsSchema, SYSTEM_PROMPT } from "../../../lib/schema";

export const runtime = "edge";

// ──────────────────────────────────────────────────────────────
//  SWITCH YOUR MODEL HERE
//  - "gemini" → free, uses GOOGLE_GENERATIVE_AI_API_KEY
//  - "claude" → uses ANTHROPIC_API_KEY (great for the live demo)
//  You can also override per-request by sending { model: "claude" }.
// ──────────────────────────────────────────────────────────────
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "gemini";

function pickModel(name) {
  if (name === "claude") {
    return anthropic("claude-3-5-sonnet-latest");
  }
  // default: Gemini (free tier)
  return google("gemini-2.5-flash");
}

export async function POST(req) {
  try {
    const { notes, model } = await req.json();

    if (!notes || !notes.trim()) {
      return Response.json(
        { error: "Please provide some meeting notes." },
        { status: 400 }
      );
    }

    const chosen = model || DEFAULT_MODEL;

    const { object } = await generateObject({
      model: pickModel(chosen),
      schema: actionItemsSchema,
      system: SYSTEM_PROMPT,
      prompt: `Extract the action items from these meeting notes:\n\n${notes}`,
    });

    return Response.json({ ...object, model_used: chosen });
  } catch (err) {
    console.error("Extraction error:", err);
    return Response.json(
      {
        error:
          "Could not extract action items. Check that your API key is set correctly in .env, and that the notes are clear.",
      },
      { status: 500 }
    );
  }
}

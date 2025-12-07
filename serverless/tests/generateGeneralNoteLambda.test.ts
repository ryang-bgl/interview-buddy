import { describe, it, expect } from "vitest";

const SAMPLE_CONTENT = `### Service Blueprint\n- Capture the product vision, target users, and primary success metrics.\n- Identify core system components (data ingestion, processing, delivery).\n- Highlight trade-offs in availability, latency, and cost.\n- Document operational runbooks for incidents and on-call.`;

describe("manual OpenAI prompt exploration", () => {
  const testFn = process.env.OPENAI_API_KEY ? it : it.skip;

  testFn("generates flashcards from a sample note", async () => {
    process.env.USER_NOTES_TABLE_NAME =
      process.env.USER_NOTES_TABLE_NAME ?? "manual-test-user-notes";
    process.env.OPENAI_API_URL =
      process.env.OPENAI_API_URL ?? "https://api.openai.com/v1/chat/completions";
    process.env.OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    const module = await import(
      "../src/functions/notes/createGeneralNoteAnkiStack"
    );
    const helpers = module.__testHelpers as {
      generateOpenAiStack: (input: {
        url: string;
        content: string;
        topic: string | null;
        requirements: string | null;
        metadata?: Record<string, unknown>;
      }) => Promise<{
        topic: string;
        summary: string | null;
        cards: Array<{ front: string; back: string; extra?: string }>;
      }>;
    };

    const url =
      process.env.GENERAL_NOTE_TEST_URL ??
      "https://example.com/interview-prep-guide";
    const topic =
      process.env.GENERAL_NOTE_TEST_TOPIC ??
      "Interview prep blueprint overview";
    const requirements =
      process.env.GENERAL_NOTE_TEST_REQUIREMENTS ??
      "Focus on memorable trade-offs and system behavior";
    const content =
      process.env.GENERAL_NOTE_TEST_CONTENT ?? SAMPLE_CONTENT;

    const stack = await helpers.generateOpenAiStack({
      url,
      content,
      topic,
      requirements,
      metadata: { source: "lambda-test" },
    });

    console.log("Generated topic:", stack.topic);
    console.log("Cards returned:", stack.cards.length);
    stack.cards.slice(0, 3).forEach((card, index) => {
      console.log(`-- Card ${index + 1} front:`, card.front);
      console.log(`   back:`, card.back);
      if (card.extra) {
        console.log(`   extra:`, card.extra);
      }
    });

    expect(Array.isArray(stack.cards)).toBe(true);
  });
});

import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const fixturePath = path.resolve(__dirname, "fixtures", "system-design.txt");
const fallbackContent = `# Behavior Questions\nTell me about a time you had to drive consensus across teams.\n\n# System Design Overview\nDesign a globally distributed log ingestion pipeline.\n\n## Requirements\n- Handle bursty writes.\n- Deliver updates near real-time.\n\n## Trade-offs\nLatency vs durability discussion.\n\n# Incident Response\nDocument the playbook for paging the on-call engineer.\n`;

let testContent = fallbackContent;
try {
  testContent = fs.readFileSync(fixturePath, "utf8");
} catch (error) {
  console.warn(
    "[test] Unable to read fixtures/system-design.txt; using fallback sample",
    error
  );
}

describe("processGeneralNoteJob.generateOpenAiStack", () => {
  const testFn = process.env.OPENAI_API_KEY
    ? (name: string, fn: () => Promise<void>) => it(name, fn, 60_000)
    : it.skip;

  testFn("requests flashcards from OpenAI", async () => {
    process.env.GENERAL_NOTE_JOBS_TABLE_NAME =
      process.env.GENERAL_NOTE_JOBS_TABLE_NAME ?? "test-jobs";
    process.env.USER_NOTES_TABLE_NAME =
      process.env.USER_NOTES_TABLE_NAME ?? "test-notes";
    process.env.OPENAI_API_URL =
      process.env.OPENAI_API_URL ?? "https://api.openai.com/v1/chat/completions";
    process.env.OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    const module = await import("../src/functions/notes/processGeneralNoteJob");
    const helpers = module.__testHelpers as {
      generateOpenAiStack: (input: {
        url: string;
        content: string;
        topic: string | null;
        requirements: string | null;
        metadata?: Record<string, unknown>;
        existingCards?: Array<{ front: string; back: string; extra?: string }>;
        retryCount?: number;
      }) => Promise<{
        topic: string;
        summary: string | null;
        cards: Array<{ front: string; back: string; extra?: string }>;
      }>;
    };

    const jobId = `debug-${Date.now()}`;
    const stack = await helpers.generateOpenAiStack({
      url: "https://example.com/system-design-guide",
      content: testContent,
      topic: "System design & behavior study plan",
      requirements: "Prioritize consensus-building tactics and failure handling",
      metadata: { jobId },
    });

    console.log("[test] Generated topic:", stack.topic);
    console.log("[test] Cards returned:", stack.cards.length);
    stack.cards.slice(0, 3).forEach((card, index) => {
      console.log(`-- Card ${index + 1} front:`, card.front);
      console.log(`   back:`, card.back);
      if (card.extra) {
        console.log(`   extra:`, card.extra);
      }
    });

    const outputRoot = path.resolve(__dirname, "output", "jobs");
    fs.mkdirSync(outputRoot, { recursive: true });
    const filePath = path.join(
      outputRoot,
      `generated-cards-${jobId}.json`
    );
    fs.writeFileSync(
      filePath,
      JSON.stringify({ cards: stack.cards }, null, 2),
      "utf8"
    );
    console.log("[test] Cards saved", { filePath });

    expect(Array.isArray(stack.cards)).toBe(true);
  });

  testFn("supports retry with existing cards", async () => {
    process.env.GENERAL_NOTE_JOBS_TABLE_NAME =
      process.env.GENERAL_NOTE_JOBS_TABLE_NAME ?? "test-jobs";
    process.env.USER_NOTES_TABLE_NAME =
      process.env.USER_NOTES_TABLE_NAME ?? "test-notes";
    process.env.OPENAI_API_URL =
      process.env.OPENAI_API_URL ?? "https://api.openai.com/v1/chat/completions";
    process.env.OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    const module = await import("../src/functions/notes/processGeneralNoteJob");
    const helpers = module.__testHelpers as {
      generateOpenAiStack: (input: {
        url: string;
        content: string;
        topic: string | null;
        requirements: string | null;
        metadata?: Record<string, unknown>;
        existingCards?: Array<{ front: string; back: string; extra?: string }>;
        retryCount?: number;
      }) => Promise<{
        topic: string;
        summary: string | null;
        cards: Array<{ front: string; back: string; extra?: string }>;
      }>;
    };

    const jobId = `retry-test-${Date.now()}`;
    const existingCards = [
      {
        front: "What is system design?",
        back: "System design is the process of defining the architecture, components, modules, interfaces, and data for a system to satisfy specified requirements.",
        extra: "Key skill for technical interviews"
      }
    ];

    const stack = await helpers.generateOpenAiStack({
      url: "https://example.com/system-design-guide",
      content: testContent,
      topic: "System design & behavior study plan",
      requirements: "Prioritize consensus-building tactics and failure handling",
      metadata: { jobId },
      existingCards,
      retryCount: 1,
    });

    console.log("[test] Generated topic:", stack.topic);
    console.log("[test] Total cards returned:", stack.cards.length);
    console.log("[test] New cards added:", stack.cards.length - existingCards.length);

    stack.cards.slice(0, 3).forEach((card, index) => {
      console.log(`-- Card ${index + 1} front:`, card.front);
      console.log(`   back:`, card.back);
      if (card.extra) {
        console.log(`   extra:`, card.extra);
      }
    });

    expect(Array.isArray(stack.cards)).toBe(true);
    expect(stack.cards.length).toBeGreaterThan(existingCards.length);

    // Verify existing cards are preserved
    const foundExistingCard = stack.cards.some(
      card => card.front === existingCards[0].front
    );
    expect(foundExistingCard).toBe(true);
  });
});

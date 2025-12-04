import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { chunkArticleContent } from "../src/shared/noteChunker";

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

describe("processGeneralNoteJob.generateCompleteStack", () => {
  const testFn = process.env.DEEPSEEK_API_KEY
    ? (name: string, fn: () => Promise<void>) => it(name, fn, 30000_000)
    : it.skip;

  testFn("logs chunk metadata and DeepSeek timings", async () => {
    process.env.GENERAL_NOTE_JOBS_TABLE_NAME =
      process.env.GENERAL_NOTE_JOBS_TABLE_NAME ?? "test-jobs";
    process.env.USER_NOTES_TABLE_NAME =
      process.env.USER_NOTES_TABLE_NAME ?? "test-notes";
    process.env.DEEPSEEK_API_URL =
      process.env.DEEPSEEK_API_URL ??
      "https://api.deepseek.com/chat/completions";
    process.env.DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

    const module = await import("../src/functions/notes/processGeneralNoteJob");
    const helpers = module.__testHelpers as {
      generateCompleteStack: (
        input: {
          url: string;
          content: string;
          topic: string | null;
          requirements: string | null;
          initialAnchor?: unknown;
        },
        debugContext?: { jobId?: string }
      ) => Promise<{
        topic: string;
        summary: string | null;
        cards: Array<{ front: string; back: string; extra?: string }>;
      }>;
    };

    const jobId = `debug-${Date.now()}`;
    const chunkStart = Date.now();
    const chunks = chunkArticleContent(testContent, {
      targetSize: 500,
      overlapBlocks: 2,
    });
    const chunkDurationMs = Date.now() - chunkStart;
    console.log("[test] Chunk summary", {
      jobId,
      chunks: chunks.length,
      durationMs: chunkDurationMs,
    });

    const outputRoot = path.resolve(__dirname, "output", "chunks", jobId);
    fs.mkdirSync(outputRoot, { recursive: true });
    chunks.forEach((chunk, index) => {
      const filePath = path.join(
        outputRoot,
        `chunk-${String(index + 1).padStart(3, "0")}.txt`
      );
      fs.writeFileSync(filePath, chunk, "utf8");
      console.log("[test] Chunk saved", {
        jobId,
        chunkIndex: index + 1,
        chars: chunk.length,
        filePath,
      });
    });

    const stack = await helpers.generateCompleteStack(
      {
        url: "https://example.com/system-design-guide",
        content: testContent,
        topic: "System design & behavior study plan",
        requirements:
          "Prioritize consensus-building tactics and failure handling",
      },
      { jobId }
    );

    console.log("[test] Generated topic:", stack.topic);
    console.log("[test] Cards returned:", stack.cards.length);
    stack.cards.slice(0, 2).forEach((card, index) => {
      console.log(`-- Card ${index + 1} front:`, card.front);
      console.log(`   back:`, card.back);
      if (card.extra) {
        console.log(`   extra:`, card.extra);
      }
    });

    expect(Array.isArray(stack.cards)).toBe(true);
  });
});

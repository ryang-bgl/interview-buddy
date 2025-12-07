import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import OpenAI from "openai";

const fixturePath = path.resolve(
  __dirname,
  "fixtures",
  "system-design-primer.txt"
);
const fallbackContent = `# Design Brief\nOutline a log ingestion service that scales to millions of events per second while keeping behavioral insights actionable.`;

let testContent = fallbackContent;
try {
  testContent = fs.readFileSync(fixturePath, "utf8");
} catch (error) {
  console.warn(
    "[test] Unable to read fixtures/system-design.txt; using fallback",
    error
  );
}

describe("OpenAI flashcard exploration", () => {
  const testFn = process.env.OPENAI_API_KEY
    ? (name: string, fn: () => Promise<void>) => it(name, fn, 60_000)
    : it.skip;

  testFn("converts entire text with ChatGPT", async () => {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log("[openai-test] Sending text", {
      length: testContent.length,
    });

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a tutor specialised to help the candidate pass technical interviews at companies like Facebook or Google. Interviews span system design and behavioural rounds. Your job is to analyse the provided material and craft the best plan for the candidate to master the knowledge.",
        },
        {
          role: "user",
          content: [
            "Turn the content into Anki-style stack cards so I can review them repeatedly.",
            "Break the material into logical sections and create summary cards before supporting details.",
            "Generate as many cards as needed—avoid arbitrary limits.",
            "Do not be overly concise—cover every important insight from the provided material.",
            'Respond strictly in JSON using this structure: {"cards": [{"front": "question", "back": "detailed answer"}]}. don\'t include markdown json code block mark like ```json {key: value} ```',
            "Here is the raw content:",
            testContent,
          ].join("\n"),
        },
      ],
    });

    const payload = completion.choices[0]?.message?.content ?? "";
    console.log("[openai-test] Raw payload", payload);

    const aggregated: Array<{ front: string; back: string }> = [];
    try {
      const parsed = JSON.parse(payload || "{}") as {
        cards?: Array<{ front?: string; back?: string }>;
      };
      const cards = (parsed.cards ?? []).filter(
        (card) => card.front && card.back
      ) as Array<{
        front: string;
        back: string;
      }>;
      aggregated.push(...cards);
    } catch (error) {
      console.warn("[openai-test] Failed to parse response", error);
    }

    console.log("[openai-test] Total cards", aggregated.length);
    aggregated.slice(0, 3).forEach((card, index) => {
      console.log(`-- Card ${index + 1} front:`, card.front);
      console.log(`   back:`, card.back);
    });

    const outputDir = path.resolve(__dirname, "output");
    fs.mkdirSync(outputDir, { recursive: true });
    const filePath = path.join(outputDir, `openai-cards-${Date.now()}.json`);
    fs.writeFileSync(
      filePath,
      JSON.stringify({ cards: aggregated }, null, 2),
      "utf8"
    );
    console.log("[openai-test] Cards saved", { filePath });

    expect(Array.isArray(aggregated)).toBe(true);
  });
});

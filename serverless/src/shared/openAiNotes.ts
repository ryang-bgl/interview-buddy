import crypto from "node:crypto";
import type { UserNoteCardRecord } from "./types";

const openAiApiUrl =
  process.env.OPENAI_API_URL ?? "https://api.openai.com/v1/chat/completions";
const openAiModel = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const OPENAI_MAX_TOKENS = 4000;

export interface FlashcardStackResponse {
  topic: string;
  summary: string | null;
  cards: UserNoteCardRecord[];
}

interface GenerateInput {
  url: string;
  content: string;
  topic: string | null;
  requirements: string | null;
  metadata?: Record<string, unknown>;
  existingCards?: UserNoteCardRecord[];
  retryCount?: number;
}

export async function generateOpenAiStack(
  content: string
): Promise<UserNoteCardRecord[]> {
  const openAiApiKey = requireOpenAiKey();
  const systemPrompt =
    "You are a tutor specialised to help the candidate pass technical interviews at companies like Facebook or Google. Interviews span system design and behavioural rounds. Your job is to analyse the provided material and craft the best plan for the candidate to master the knowledge.";

  const userPrompt = [
    "Turn the content into Anki-style stack cards so I can review them repeatedly.",
    "The content is in Markdown format with headings (using # symbols), lists, and structured sections.",
    "IMPORTANT: Create cards for ALL major sections and subsections in the markdown. Do not skip any sections like NoSQL, Caching, Load Balancing, etc.",
    "Break the material into logical sections based on the markdown headings and create at least one card per important idea.",
    "Add summary cards that capture the most critical takeaways for each major section before diving into supporting details.",
    "Generate as many cards as needed, and long-form content should typically yield dozens of cards.",
    "Remember: Create flashcards for ALL main sections and sub sections in this markdown content. The card generated should also summarize the content in that section, don't overly concise",
    "Do not be overly concise—cover every important insight from the provided material.",
    'Respond strictly in JSON using this structure: {"cards": [{"front": "question", "back": "detailed answer", "extra"?: "tips"}]}.',
    "***IMPORTANT*** make sure it is a valid json, if the generated output is exceeding your output limit. then truncate the cards you need to include in the output. make sure it is a valid json",
    "",
    "Here is the markdown content, bounded by triple quotes:",
    '"""',
    content,
    '"""',
  ].join("\n");

  console.info(
    "[openai-notes] Requesting flashcards",
    content.length,
    userPrompt
  );

  const apiStart = Date.now();
  const response = await fetch(openAiApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify({
      model: openAiModel,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: OPENAI_MAX_TOKENS,
    }),
  });

  const body = await safeReadJson(response);
  if (!response.ok) {
    console.error("[openai-notes] API error", response.status, body);
    throw new Error("OpenAI generation failed");
  }

  const aiContent = body?.choices?.[0]?.message?.content;
  if (typeof aiContent !== "string") {
    throw new Error("OpenAI response missing content");
  }

  const newCards = parseStackPayload(aiContent);

  console.info("[openai-notes] Flashcards generated", {
    durationMs: Date.now() - apiStart,
    newCardsCount: newCards.length,
  });
  return newCards;
}

function requireOpenAiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY env var must be set");
  }
  return apiKey;
}

async function safeReadJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch (error) {
    console.error("Failed to parse OpenAI JSON response", error);
    return null;
  }
}

function parseStackPayload(raw: string): UserNoteCardRecord[] {
  const cleaned = raw.replace(/```json|```/gi, "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error("Unable to parse OpenAI payload", { raw });
    throw error;
  }

  const cardsInput: unknown[] = Array.isArray(parsed?.cards)
    ? parsed.cards
    : [];
  const cards: UserNoteCardRecord[] = cardsInput
    .map((card: any) => normalizeCard(card))
    .filter((card): card is UserNoteCardRecord => Boolean(card));

  return cards;
}

function normalizeCard(card: any): UserNoteCardRecord | null {
  const front = optionalText(card?.front);
  const back = optionalText(card?.back);
  if (!front || !back) {
    return null;
  }

  const extra = optionalText(card?.extra);
  const tags = Array.isArray(card?.tags)
    ? card.tags
        .map((tag: unknown) => (typeof tag === "string" ? tag.trim() : ""))
        .filter((tag: string) => Boolean(tag))
    : undefined;

  return {
    id: crypto.randomUUID(),
    front,
    back,
    extra: extra ?? undefined,
    tags: tags && tags.length > 0 ? tags : undefined,
  };
}

function optionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

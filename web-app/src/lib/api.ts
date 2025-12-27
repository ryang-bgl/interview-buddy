import config from "@/config";
import { supabase } from "@/lib/supabaseClient";

const serverOrigin = config.serverOrigin;

async function getAuthHeader(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      return null;
    }
    return `Bearer ${token}`;
  } catch (error) {
    console.warn("[leetstack] Unable to read Supabase session", error);
    return null;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!serverOrigin) {
    throw new Error("Missing API server origin environment variable");
  }

  const url = `${serverOrigin}${path}`;
  const headers = new Headers(init.headers);

  // Only set Content-Type for requests with a body
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Always add Authorization if available (this is a simple header)
  const authHeader = await getAuthHeader();
  if (authHeader && !headers.has("Authorization")) {
    headers.set("Authorization", authHeader);
  }

  // Use mode: 'cors' explicitly for better browser behavior
  const response = await fetch(url, {
    ...init,
    headers,
    mode: 'cors',
    credentials: 'omit' // We're sending auth via header, not cookies
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body && typeof body.message === "string") {
        message = body.message;
      }
    } catch (error) {
      console.warn("[leetstack] Failed to parse error response", error);
    }
    throw new Error(message);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export interface UserPrincipal {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  leetstackUsername: string | null;
  createdDate: string | null;
  lastUpdatedDate: string | null;
}

export interface DsaQuestion {
  id: string;
  userId: string;
  questionIndex: string;
  title: string;
  titleSlug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  solution: string | null;
  idealSolutionCode: string | null;
  note: string | null;
  tags?: string[] | null;
  topicTags?: string[] | null;
  lastReviewedAt?: string | null;
  lastReviewStatus?: "easy" | "good" | "hard" | null;
  reviewIntervalSeconds?: number | null;
  reviewEaseFactor?: number | null;
  reviewRepetitions?: number | null;
  nextReviewDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlashcardNoteSummary {
  noteId: string;
  url: string;
  topic: string | null;
  summary: string | null;
  createdAt: string;
  lastReviewedAt: string | null;
  lastReviewStatus: "easy" | "good" | "hard" | null;
  cardCount: number | null;
  tags: string[];
  reviewIntervalSeconds?: number | null;
  reviewEaseFactor?: number | null;
  reviewRepetitions?: number | null;
  nextReviewDate?: string | null;
}

export interface FlashcardCardRecord {
  id?: string;
  front: string;
  back: string;
  extra?: string | null;
  tags?: string[];
}

export interface FlashcardNoteRecord {
  noteId: string;
  url: string;
  topic: string | null;
  summary: string | null;
  cards: FlashcardCardRecord[];
  createdAt: string;
  lastReviewedAt: string | null;
  lastReviewStatus: "easy" | "good" | "hard" | null;
  reviewIntervalSeconds?: number | null;
  reviewEaseFactor?: number | null;
  reviewRepetitions?: number | null;
  nextReviewDate?: string | null;
}

export interface UpdateGeneralNoteCardPayload {
  front: string;
  back: string;
  extra?: string | null;
}

export interface UpdateGeneralNoteCardResponse {
  noteId: string;
  card: FlashcardCardRecord;
  cards?: FlashcardCardRecord[];
}

export interface SubmitFeedbackPayload {
  message: string;
  category?: "bug" | "idea" | "other";
  pageUrl?: string | null;
}

export async function getCurrentUser() {
  return request<UserPrincipal>("/api/users/me");
}

export async function listDsaQuestions() {
  return request<DsaQuestion[]>("/api/dsa/questions");
}

export async function updateQuestionReview(
  questionIndex: string,
  payload: {
    lastReviewedAt: string;
    lastReviewStatus?: "easy" | "good" | "hard";
    nextReviewDate: string;
    reviewIntervalSeconds?: number | null;
    reviewEaseFactor?: number | null;
    reviewRepetitions?: number | null;
  }
) {
  return request<DsaQuestion>(
    `/api/dsa/questions/${encodeURIComponent(questionIndex)}/review`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateNoteReview(
  noteId: string,
  payload: {
    lastReviewedAt: string;
    lastReviewStatus?: "easy" | "good" | "hard";
    nextReviewDate: string;
    reviewIntervalSeconds?: number | null;
    reviewEaseFactor?: number | null;
    reviewRepetitions?: number | null;
  }
) {
  return request<FlashcardNoteRecord>(
    `/api/general-note/notes/${encodeURIComponent(noteId)}/review`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function listGeneralNotes() {
  return request<{ notes: FlashcardNoteSummary[] }>("/api/general-note/notes");
}

export async function getGeneralNoteByUrl(url: string) {
  const encoded = encodeURIComponent(url);
  return request<FlashcardNoteRecord>(`/api/general-note/note?url=${encoded}`);
}

export async function getGeneralNoteById(noteId: string) {
  const encoded = encodeURIComponent(noteId);
  return request<FlashcardNoteRecord>(`/api/general-note/notes/${encoded}`);
}

export async function updateGeneralNoteCard(
  noteId: string,
  cardId: string,
  payload: UpdateGeneralNoteCardPayload
) {
  const encodedNoteId = encodeURIComponent(noteId);
  const encodedCardId = encodeURIComponent(cardId);
  return request<UpdateGeneralNoteCardResponse>(
    `/api/ai/general-note/notes/${encodedNoteId}/cards/${encodedCardId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function submitFeedback(payload: SubmitFeedbackPayload) {
  return request<{ feedbackId: string }>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

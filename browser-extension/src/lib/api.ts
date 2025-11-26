import config from "@/config";
import { supabase } from "@/lib/supabaseClient";

async function getAuthHeader(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      return null;
    }
    console.debug(
      "[leetstack] Sending Supabase access token to /api/users/me:",
      token
    );
    return `Bearer ${token}`;
  } catch (error) {
    console.warn("[leetstack] Failed to fetch Supabase session token", error);
    return null;
  }
}

async function request(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = `${config.serverOrigin}${path}`;
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Authorization")) {
    const authHeader = await getAuthHeader();
    if (authHeader) {
      headers.set("Authorization", authHeader);
    }
  }

  return fetch(url, {
    credentials: "omit",
    ...init,
    headers,
  });
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

export async function checkSession(): Promise<UserPrincipal | null> {
  try {
    const response = await request("/api/users/me", { method: "GET" });
    if (response.ok) {
      return (await response.json()) as UserPrincipal;
    }

    if (response.status === 401 || response.status === 403) {
      return null;
    }

    throw new Error(`Unexpected session status: ${response.status}`);
  } catch (error) {
    console.warn("[leetstack] Failed to verify session", error);
    throw error;
  }
}

export interface CreateUserDsaQuestionRequest {
  questionIndex: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  isPaidOnly: boolean;
  description: string;
  solution?: string | null;
  idealSolutionCode?: string | null;
  note?: string | null;
  exampleTestcases?: string | null;
}

export interface UserDsaQuestionResponse {
  id: number;
  userId: string;
  questionIndex: string;
  index: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  isPaidOnly: boolean;
  description: string;
  solution: string | null;
  idealSolutionCode: string | null;
  note: string | null;
  exampleTestcases: string | null;
}

export async function saveUserDsaQuestion(
  payload: CreateUserDsaQuestionRequest
): Promise<UserDsaQuestionResponse> {
  const response = await request("/api/dsa/questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return (await response.json()) as UserDsaQuestionResponse;
  }

  let message = "Failed to save problem";
  try {
    const body = await response.json();
    if (body && typeof body.message === "string") {
      message = body.message;
    }
  } catch (error) {
    console.warn("[leetstack] Unable to parse save error response", error);
  }

  throw new Error(message);
}

export interface FlashCardPayload {
  id?: string | null;
  front: string;
  back: string;
  extra?: string | null;
  tags?: string[] | null;
}

export interface AddGeneralNoteCardRequest extends FlashCardPayload {
  insertAfterCardId?: string | null;
}

export interface CreateGeneralNoteJobRequest {
  url: string;
  payload: string;
  topic?: string | null;
  requirements?: string | null;
}

export interface CreateGeneralNoteJobResponse {
  jobId: string;
}

export type GeneralNoteJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface GeneralNoteJobResult {
  noteId: string | null;
  topic: string | null;
  summary: string | null;
  cards: FlashCardPayload[];
}

export interface GeneralNoteJobStatusResponse {
  jobId: string;
  status: GeneralNoteJobStatus;
  url: string;
  topic: string | null;
  requirements: string | null;
  createdAt: string;
  updatedAt: string;
  errorMessage: string | null;
  result?: GeneralNoteJobResult;
}

export interface GeneralNoteNoteResponse {
  noteId: string;
  url: string;
  topic: string | null;
  summary: string | null;
  cards: FlashCardPayload[];
  createdAt: string;
  lastReviewedAt: string | null;
  lastReviewStatus: string | null;
}

export interface UpdateGeneralNoteCardsResponse {
  noteId: string;
  cards: FlashCardPayload[];
  card?: FlashCardPayload;
}

export async function createGeneralNoteJob(
  payload: CreateGeneralNoteJobRequest
): Promise<CreateGeneralNoteJobResponse> {
  const response = await request("/api/ai/general-note/anki-stack", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return (await response.json()) as CreateGeneralNoteJobResponse;
  }

  let message = "Failed to queue review job";
  try {
    const body = await response.json();
    if (body && typeof body.message === "string") {
      message = body.message;
    }
  } catch (error) {
    console.warn("[leetstack] Unable to parse job creation error", error);
  }

  throw new Error(message);
}

export async function getGeneralNoteJob(
  jobId: string
): Promise<GeneralNoteJobStatusResponse> {
  const response = await request(`/api/ai/general-note/jobs/${jobId}`, {
    method: "GET",
  });

  if (response.ok) {
    return (await response.json()) as GeneralNoteJobStatusResponse;
  }

  let message = "Failed to load job status";
  try {
    const body = await response.json();
    if (body && typeof body.message === "string") {
      message = body.message;
    }
  } catch (error) {
    console.warn("[leetstack] Unable to parse job status error", error);
  }

  throw new Error(message);
}

export async function getExistingGeneralNote(
  url: string
): Promise<GeneralNoteNoteResponse | null> {
  const encodedUrl = encodeURIComponent(url);
  const response = await request(`/api/general-note/note?url=${encodedUrl}`, {
    method: "GET",
  });

  if (response.ok) {
    return (await response.json()) as GeneralNoteNoteResponse;
  }

  if (response.status === 404) {
    return null;
  }

  let message = "Failed to load saved cards";
  try {
    const body = await response.json();
    if (body && typeof body.message === "string") {
      message = body.message;
    }
  } catch (error) {
    console.warn("[leetstack] Unable to parse note lookup error", error);
  }

  throw new Error(message);
}

export async function addGeneralNoteCard(
  noteId: string,
  payload: AddGeneralNoteCardRequest
): Promise<UpdateGeneralNoteCardsResponse> {
  const response = await request(`/api/ai/general-note/notes/${noteId}/cards`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return (await response.json()) as UpdateGeneralNoteCardsResponse;
  }

  let message = "Failed to add card";
  try {
    const body = await response.json();
    if (body && typeof body.message === "string") {
      message = body.message;
    }
  } catch (error) {
    console.warn("[leetstack] Unable to parse add-card error", error);
  }

  throw new Error(message);
}

export async function deleteGeneralNoteCard(
  noteId: string,
  cardId: string
): Promise<UpdateGeneralNoteCardsResponse> {
  const response = await request(
    `/api/ai/general-note/notes/${noteId}/cards/${cardId}`,
    {
      method: "DELETE",
    }
  );

  if (response.ok) {
    return (await response.json()) as UpdateGeneralNoteCardsResponse;
  }

  let message = "Failed to delete card";
  try {
    const body = await response.json();
    if (body && typeof body.message === "string") {
      message = body.message;
    }
  } catch (error) {
    console.warn("[leetstack] Unable to parse delete-card error", error);
  }

  throw new Error(message);
}

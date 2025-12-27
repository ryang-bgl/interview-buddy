import { makeAutoObservable, runInAction } from "mobx";
import {
  getGeneralNoteById,
  updateGeneralNoteCard,
  type FlashcardCardRecord,
  type FlashcardNoteRecord,
} from "@/lib/api";

type NotebookFlashcard = FlashcardCardRecord & {
  id: string;
  originalFront: string;
  originalBack: string;
  originalExtra: string;
  hasPendingChanges: boolean;
  isSaving: boolean;
  saveError: string | null;
};

type NoteDetail = Omit<FlashcardNoteRecord, "cards"> & {
  cards: NotebookFlashcard[];
};

const createNotebookFlashcard = (
  noteId: string,
  card: FlashcardCardRecord,
  index: number
): NotebookFlashcard => {
  const id = card.id ?? `${noteId}-${index}`;
  const extra = typeof card.extra === "string" ? card.extra : "";
  return {
    ...card,
    id,
    tags: card.tags ?? [],
    extra,
    originalFront: card.front,
    originalBack: card.back,
    originalExtra: extra,
    hasPendingChanges: false,
    isSaving: false,
    saveError: null,
  };
};

export class NoteDetailStore {
  note: NoteDetail | null = null;
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  async loadNoteDetail(noteId: string): Promise<void> {
    // If already loading this note, skip
    if (this.isLoading) {
      return;
    }

    // If the same note is already loaded with cards, skip
    if (this.note?.noteId === noteId && this.note.cards.length > 0) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    try {
      const detail = await getGeneralNoteById(noteId);
      runInAction(() => {
        this.note = {
          ...detail,
          cards: detail.cards.map((card, index) =>
            createNotebookFlashcard(noteId, card, index)
          ),
        };
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load note";
      runInAction(() => {
        this.error = message;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  updateFlashcard(cardId: string, partial: Partial<FlashcardCardRecord>) {
    if (!this.note) return;

    const flashcard = this.note.cards.find((card) => card.id === cardId);
    if (!flashcard) return;

    if (partial.front !== undefined) {
      flashcard.front = partial.front;
    }
    if (partial.back !== undefined) {
      flashcard.back = partial.back;
    }
    if (partial.extra !== undefined) {
      flashcard.extra = this.normalizeCardExtra(partial.extra);
    }
    flashcard.hasPendingChanges = this.hasFlashcardChanged(flashcard);
    flashcard.saveError = null;
  }

  async saveFlashcard(cardId: string) {
    if (!this.note) return;

    const flashcard = this.note.cards.find((card) => card.id === cardId);
    if (!flashcard || !flashcard.hasPendingChanges || flashcard.isSaving) {
      return;
    }

    flashcard.isSaving = true;
    flashcard.saveError = null;
    const pendingFront = flashcard.front;
    const pendingBack = flashcard.back;
    const pendingExtra = this.normalizeCardExtra(flashcard.extra);

    try {
      await updateGeneralNoteCard(this.note.noteId, cardId, {
        front: pendingFront,
        back: pendingBack,
        extra: pendingExtra.length ? pendingExtra : null,
      });
      runInAction(() => {
        flashcard.originalFront = pendingFront;
        flashcard.originalBack = pendingBack;
        flashcard.originalExtra = pendingExtra;
        flashcard.hasPendingChanges = this.hasFlashcardChanged(flashcard);
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save flashcard";
      runInAction(() => {
        flashcard.saveError = message;
      });
    } finally {
      runInAction(() => {
        flashcard.isSaving = false;
      });
    }
  }

  private normalizeCardExtra(value: string | null | undefined) {
    return typeof value === "string" ? value : "";
  }

  private hasFlashcardChanged(card: NotebookFlashcard) {
    const currentExtra = this.normalizeCardExtra(card.extra);
    return (
      card.front !== card.originalFront ||
      card.back !== card.originalBack ||
      currentExtra !== card.originalExtra
    );
  }

  reset() {
    this.note = null;
    this.isLoading = false;
    this.error = null;
  }
}

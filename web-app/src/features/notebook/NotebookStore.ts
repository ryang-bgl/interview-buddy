import { makeAutoObservable, runInAction } from 'mobx'
import {
  getGeneralNoteByUrl,
  listDsaQuestions,
  listGeneralNotes,
  type DsaQuestion,
  type FlashcardCardRecord,
  type FlashcardNoteRecord,
  type FlashcardNoteSummary,
  updateNoteReview,
  updateQuestionReview,
} from '@/lib/api'
import {
  createInitialReviewState,
  spacedRepetitionScheduler,
  type ReviewState,
} from '@/lib/spacedRepetition'
import { loadReviewStates, persistReviewStates } from '@/utils/reviewStateStorage'

export type ReviewSource = 'all' | 'problems' | 'notes'

type ReviewCard = {
  id: string
  prompt: string
  answer: string
  extra?: string | null
  tags: string[]
  streak: number
  due: string
  sourceType: 'problem' | 'note'
  sourceId: string
  sourceTitle: string
  questionIndex?: string
}

interface NotebookNote extends FlashcardNoteRecord {
  tags: string[]
  cardCount: number
}

type RemoteReviewSnapshot = {
  nextReviewDate?: string | null
  lastReviewedAt?: string | null
  reviewIntervalSeconds?: number | null
  reviewEaseFactor?: number | null
  reviewRepetitions?: number | null
}

const ensureCardId = (noteId: string, card: FlashcardCardRecord, index: number) => ({
  ...card,
  id: card.id ?? `${noteId}-${index}`,
  tags: card.tags ?? [],
})

export class NotebookStore {
  problems: DsaQuestion[] = []
  notes: NotebookNote[] = []

  problemsError: string | null = null
  notesError: string | null = null
  isLoadingProblems = false
  isLoadingNotes = false
  hasLoadedProblems = false
  hasLoadedNotes = false

  searchQuery = ''
  difficultyFilter: DsaQuestion['difficulty'] | 'All' = 'All'
  tagFilters = new Set<string>()

  noteSearchQuery = ''
  noteTagFilters = new Set<string>()

  reviewSource: ReviewSource = 'all'
  reviewTagFilters = new Set<string>()

  private reviewCards = new Map<string, ReviewCard>()
  private reviewStates = loadReviewStates()

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  async refreshAll(force = false) {
    await Promise.all([this.loadProblems(force), this.loadNotes(force)])
  }

  async loadProblems(force = false) {
    if (this.isLoadingProblems || (!force && this.hasLoadedProblems)) {
      return
    }
    this.isLoadingProblems = true
    this.problemsError = null
    try {
      const problems = await listDsaQuestions()
      runInAction(() => {
        this.problems = problems.map((problem) => ({
          ...problem,
          tags: problem.tags ?? problem.topicTags ?? [],
        }))
        this.hasLoadedProblems = true
      })
      this.rebuildReviewCards()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load problems'
      runInAction(() => {
        this.problemsError = message
      })
    } finally {
      runInAction(() => {
        this.isLoadingProblems = false
      })
    }
  }

  async loadNotes(force = false) {
    if (this.isLoadingNotes || (!force && this.hasLoadedNotes)) {
      return
    }
    this.isLoadingNotes = true
    this.notesError = null
    try {
      const { notes: summaries } = await listGeneralNotes()
      const summaryMap = new Map<string, FlashcardNoteSummary>(
        summaries.map((summary) => [summary.noteId, summary]),
      )
      const detailed = await Promise.all(
        summaries.map(async (summary) => {
          try {
            return await getGeneralNoteByUrl(summary.url)
          } catch (error) {
            console.warn('[leetstack] Failed to load note detail', summary.url, error)
            return null
          }
        }),
      )
      const normalized: NotebookNote[] = detailed
        .filter((note): note is FlashcardNoteRecord => Boolean(note))
        .map((note) => {
          const summary = summaryMap.get(note.noteId)
          return {
            ...note,
            summary: note.summary ?? summary?.summary ?? null,
            tags: summary?.tags ?? [],
            cardCount: summary?.cardCount ?? note.cards.length,
            cards: note.cards.map((card, index) => ensureCardId(note.noteId, card, index)),
          }
        })
      runInAction(() => {
        this.notes = normalized
        this.hasLoadedNotes = true
      })
      this.rebuildReviewCards()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load notes'
      runInAction(() => {
        this.notesError = message
      })
    } finally {
      runInAction(() => {
        this.isLoadingNotes = false
      })
    }
  }

  ensureProblemsLoaded() {
    void this.loadProblems()
  }

  ensureNotesLoaded() {
    void this.loadNotes()
  }

  private rebuildReviewCards() {
    const previous = new Map(this.reviewCards)
    const validIds = new Set<string>()
    this.reviewCards.clear()

    this.problems.forEach((problem) => {
      const id = `problem-${problem.id}`
      const existing = previous.get(id)
      const baseTags = problem.tags ?? []
      const state = this.ensureReviewState(id, {
        nextReviewDate: problem.nextReviewDate ?? problem.lastReviewedAt ?? null,
        lastReviewedAt: problem.lastReviewedAt ?? null,
        reviewIntervalSeconds: problem.reviewIntervalSeconds ?? null,
        reviewEaseFactor: problem.reviewEaseFactor ?? null,
        reviewRepetitions: problem.reviewRepetitions ?? null,
      })
      this.reviewCards.set(id, {
        id,
        prompt: `${problem.title} · explain the optimal approach`,
        answer: problem.solution ?? 'Add your solution in the Chrome extension.',
        extra: problem.note ?? problem.description,
        tags: baseTags,
        streak: existing?.streak ?? 0,
        due: state.nextReviewDate,
        sourceType: 'problem',
        sourceId: problem.id,
        sourceTitle: problem.title,
        questionIndex: problem.questionIndex ?? problem.id,
      })
      validIds.add(id)
    })

    this.notes.forEach((note) => {
      note.cards.forEach((card, index) => {
        const id = `note-${note.noteId}-${card.id ?? index}`
        const existing = previous.get(id)
        const state = this.ensureReviewState(id, {
          nextReviewDate: note.nextReviewDate ?? note.lastReviewedAt ?? null,
          lastReviewedAt: note.lastReviewedAt ?? null,
          reviewIntervalSeconds: note.reviewIntervalSeconds ?? null,
          reviewEaseFactor: note.reviewEaseFactor ?? null,
          reviewRepetitions: note.reviewRepetitions ?? null,
        })
        this.reviewCards.set(id, {
          id,
          prompt: card.front,
          answer: card.back,
          extra: card.extra,
          tags: card.tags ?? [],
          streak: existing?.streak ?? 0,
          due: state.nextReviewDate,
          sourceType: 'note',
          sourceId: note.noteId,
          sourceTitle: note.topic ?? note.summary ?? note.url,
        })
        validIds.add(id)
      })
    })

    for (const key of Array.from(this.reviewStates.keys())) {
      if (!validIds.has(key)) {
        this.reviewStates.delete(key)
      }
    }
    this.persistReviewStates()
  }

  get problemTags() {
    return Array.from(
      new Set(
        this.problems.flatMap((problem) => problem.tags ?? problem.topicTags ?? []),
      ),
    )
  }

  get noteTags() {
    return Array.from(new Set(this.notes.flatMap((note) => note.tags ?? [])))
  }

  get filteredProblems() {
    return this.problems.filter((problem) => {
      const matchesDifficulty =
        this.difficultyFilter === 'All' || problem.difficulty === this.difficultyFilter
      const matchesTags =
        this.tagFilters.size === 0 ||
        Array.from(this.tagFilters).every((tag) => (problem.tags ?? []).includes(tag))
      const query = this.searchQuery.trim().toLowerCase()
      const matchesQuery =
        !query ||
        problem.title.toLowerCase().includes(query) ||
        problem.questionIndex.toLowerCase().includes(query)
      return matchesDifficulty && matchesTags && matchesQuery
    })
  }

  get filteredNotes() {
    return this.notes.filter((note) => {
      const matchesTags =
        this.noteTagFilters.size === 0 ||
        Array.from(this.noteTagFilters).every((tag) => note.tags.includes(tag))
      const query = this.noteSearchQuery.trim().toLowerCase()
      const matchesQuery =
        !query ||
        note.topic?.toLowerCase().includes(query) ||
        note.summary?.toLowerCase().includes(query) ||
        note.url.toLowerCase().includes(query)
      return matchesTags && matchesQuery
    })
  }

  get reviewCardList() {
    return Array.from(this.reviewCards.values()).sort(
      (a, b) => new Date(a.due).getTime() - new Date(b.due).getTime(),
    )
  }

  get filteredReviewCards() {
    return this.reviewCardList.filter((card) => {
      const matchesSource =
        this.reviewSource === 'all' ||
        (this.reviewSource === 'problems' && card.sourceType === 'problem') ||
        (this.reviewSource === 'notes' && card.sourceType === 'note')
      const matchesTags =
        this.reviewTagFilters.size === 0 ||
        Array.from(this.reviewTagFilters).every((tag) => card.tags.includes(tag))
      return matchesSource && matchesTags
    })
  }

  get nextReviewCard() {
    const now = Date.now()
    const dueFirst = this.filteredReviewCards.filter(
      (card) => new Date(card.due).getTime() <= now,
    )
    if (dueFirst.length > 0) {
      return dueFirst[0]
    }
    return this.filteredReviewCards[0] ?? null
  }

  setSearchQuery(value: string) {
    this.searchQuery = value
  }

  setDifficultyFilter(value: DsaQuestion['difficulty'] | 'All') {
    this.difficultyFilter = value
  }

  toggleTagFilter(tag: string) {
    if (this.tagFilters.has(tag)) {
      this.tagFilters.delete(tag)
    } else {
      this.tagFilters.add(tag)
    }
  }

  setNoteSearchQuery(value: string) {
    this.noteSearchQuery = value
  }

  toggleNoteTag(tag: string) {
    if (this.noteTagFilters.has(tag)) {
      this.noteTagFilters.delete(tag)
    } else {
      this.noteTagFilters.add(tag)
    }
  }

  setReviewSource(source: ReviewSource) {
    this.reviewSource = source
  }

  toggleReviewTag(tag: string) {
    if (this.reviewTagFilters.has(tag)) {
      this.reviewTagFilters.delete(tag)
    } else {
      this.reviewTagFilters.add(tag)
    }
  }

  getProblemById(id: string) {
    return this.problems.find((problem) => problem.id === id || problem.questionIndex === id) ?? null
  }

  get dueProblemCount() {
    const now = Date.now()
    return this.reviewCardList.filter(
      (card) => card.sourceType === 'problem' && new Date(card.due).getTime() <= now,
    ).length
  }

  get dueNoteCount() {
    const now = Date.now()
    const dueNotes = this.reviewCardList.filter(
      (card) => card.sourceType === 'note' && new Date(card.due).getTime() <= now,
    )
    const ids = new Set(dueNotes.map((card) => card.sourceId))
    return ids.size
  }

  get flashcardCount() {
    return this.notes.reduce((count, note) => count + note.cards.length, 0)
  }

  getAverageMastery() {
    const states = this.problems.map((problem) =>
      this.ensureReviewState(`problem-${problem.id}`),
    )
    if (!states.length) return 0
    const total = states.reduce((sum, state) => sum + (state.repetitions ?? 0), 0)
    return Math.min(100, Math.round((total / (states.length * 5)) * 100))
  }

  getDayStreak() {
    const dates = new Set(
      Array.from(this.reviewStates.values())
        .map((state) => state.lastReviewedAt?.slice(0, 10))
        .filter((value): value is string => Boolean(value)),
    )
    let streak = 0
    const today = new Date()
    for (let offset = 0; offset < 30; offset += 1) {
      const date = new Date(today)
      date.setDate(today.getDate() - offset)
      const iso = date.toISOString().slice(0, 10)
      if (dates.has(iso)) {
        streak += 1
      } else {
        break
      }
    }
    return streak || 1
  }

  updateProblemNotes(id: string, value: string) {
    const problem = this.getProblemById(id)
    if (problem) {
      problem.note = value
      this.syncProblemReviewCard(problem)
    }
  }

  updateProblemUserSolution(id: string, value: string) {
    const problem = this.getProblemById(id)
    if (problem) {
      problem.solution = value
      this.syncProblemReviewCard(problem)
    }
  }

  updateProblemAiSolution(id: string, value: string) {
    const problem = this.getProblemById(id)
    if (problem) {
      problem.idealSolutionCode = value
      this.syncProblemReviewCard(problem)
    }
  }

  getNoteById(id: string) {
    return this.notes.find((note) => note.noteId === id) ?? null
  }

  getProblemReviewCard(problemId: string) {
    const problem = this.getProblemById(problemId)
    if (!problem) return null
    return this.reviewCards.get(`problem-${problem.id}`) ?? null
  }

  getReviewCardById(cardId: string) {
    return this.reviewCards.get(cardId) ?? null
  }

  getProblemMastery(problemId: string) {
    const state = this.ensureReviewState(`problem-${problemId}`)
    const reps = state.repetitions ?? 0
    return Math.min(100, Math.round(((reps + 1) / 6) * 100))
  }

  getProblemNextReviewDate(problemId: string) {
    const state = this.ensureReviewState(`problem-${problemId}`)
    return state.nextReviewDate
  }

  getProblemReviewCount(problemId: string) {
    const state = this.ensureReviewState(`problem-${problemId}`)
    return state.repetitions ?? 0
  }

  updateNoteSummary(id: string, value: string) {
    const note = this.getNoteById(id)
    if (note) {
      note.summary = value
    }
  }

  updateFlashcard(noteId: string, cardId: string, partial: Partial<FlashcardCardRecord>) {
    const note = this.getNoteById(noteId)
    if (!note) return
    const flashcard = note.cards.find((card) => card.id === cardId)
    if (!flashcard) return
    Object.assign(flashcard, partial)
    this.syncNoteReviewCard(note, flashcard)
  }

  gradeReviewCard(cardId: string, grade: 'hard' | 'good' | 'easy') {
    const card = this.reviewCards.get(cardId)
    if (!card) return
    const state = this.ensureReviewState(cardId)
    const snapshot = {
      easeFactor: state.easeFactor,
      interval: state.interval,
      repetitions: state.repetitions,
    }
    const result = spacedRepetitionScheduler.schedule(snapshot, grade)
    const updatedState: ReviewState = {
      easeFactor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      nextReviewDate: result.nextReviewDate.toISOString(),
      lastReviewedAt: result.lastReviewedAt.toISOString(),
    }
    this.reviewStates.set(cardId, updatedState)
    this.persistReviewStates()

    const newStreak = grade === 'hard' ? 0 : card.streak + 1
    const updated = { ...card, streak: newStreak, due: updatedState.nextReviewDate }
    this.reviewCards.set(cardId, updated)

    const syncPayload = {
      lastReviewedAt: updatedState.lastReviewedAt ?? result.lastReviewedAt.toISOString(),
      lastReviewStatus: grade,
      nextReviewDate: updatedState.nextReviewDate,
      reviewIntervalSeconds: updatedState.interval,
      reviewEaseFactor: updatedState.easeFactor,
      reviewRepetitions: updatedState.repetitions,
    }

    if (card.sourceType === 'problem' && card.questionIndex) {
      updateQuestionReview(card.questionIndex, syncPayload).catch((error) =>
        console.warn('[leetstack] Failed to sync problem review', error),
      )
    }

    if (card.sourceType === 'note') {
      updateNoteReview(card.sourceId, syncPayload).catch((error) =>
        console.warn('[leetstack] Failed to sync note review', error),
      )
    }
  }

  private syncProblemReviewCard(problem: DsaQuestion) {
    const id = `problem-${problem.id}`
    const existing = this.reviewCards.get(id)
    if (!existing) return
    this.reviewCards.set(id, {
      ...existing,
      prompt: `${problem.title} · explain the optimal approach`,
      answer: problem.solution ?? existing.answer,
      extra: problem.note ?? problem.description,
      tags: problem.tags ?? [],
    })
  }

  private syncNoteReviewCard(note: NotebookNote, flashcard: FlashcardCardRecord) {
    const id = `note-${note.noteId}-${flashcard.id}`
    const existing = this.reviewCards.get(id)
    if (!existing) return
    this.reviewCards.set(id, {
      ...existing,
      prompt: flashcard.front,
      answer: flashcard.back,
      extra: flashcard.extra,
      tags: flashcard.tags ?? [],
    })
  }

  getStats() {
    const totalProblems = this.problems.length
    const perDifficulty = ['Easy', 'Medium', 'Hard'].reduce<Record<string, number>>(
      (acc, difficulty) => {
        acc[difficulty] = this.problems.filter((p) => p.difficulty === difficulty).length
        return acc
      },
      {},
    )
    return {
      totalProblems,
      perDifficulty,
      noteCount: this.notes.length,
      flashcards: this.flashcardCount,
      avgMastery: this.getAverageMastery(),
      dayStreak: this.getDayStreak(),
    }
  }

  private ensureReviewState(cardId: string, fallback?: RemoteReviewSnapshot): ReviewState {
    const existing = this.reviewStates.get(cardId)

    if (!fallback) {
      if (existing) {
        return existing
      }
      const initial = createInitialReviewState()
      this.reviewStates.set(cardId, initial)
      this.persistReviewStates()
      return initial
    }

    const initial =
      existing ??
      createInitialReviewState(fallback.nextReviewDate ?? fallback.lastReviewedAt ?? undefined)

    const normalized: ReviewState = {
      easeFactor:
        fallback.reviewEaseFactor ?? existing?.easeFactor ?? initial.easeFactor,
      interval: fallback.reviewIntervalSeconds ?? existing?.interval ?? initial.interval,
      repetitions:
        fallback.reviewRepetitions ?? existing?.repetitions ?? initial.repetitions,
      nextReviewDate:
        fallback.nextReviewDate ?? existing?.nextReviewDate ?? initial.nextReviewDate,
      lastReviewedAt:
        fallback.lastReviewedAt ?? existing?.lastReviewedAt ?? initial.lastReviewedAt ?? null,
    }

    const hasChanged =
      !existing ||
      existing.easeFactor !== normalized.easeFactor ||
      existing.interval !== normalized.interval ||
      existing.repetitions !== normalized.repetitions ||
      existing.nextReviewDate !== normalized.nextReviewDate ||
      existing.lastReviewedAt !== normalized.lastReviewedAt

    if (hasChanged) {
      this.reviewStates.set(cardId, normalized)
      this.persistReviewStates()
    }

    return normalized
  }

  private persistReviewStates() {
    persistReviewStates(this.reviewStates)
  }
}

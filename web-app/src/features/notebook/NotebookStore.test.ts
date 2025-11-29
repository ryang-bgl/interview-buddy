import { describe, expect, it, beforeEach, vi } from 'vitest'
import { NotebookStore } from './NotebookStore'
import type { DsaQuestion } from '@/lib/api'
import { updateQuestionReview } from '@/lib/api'
import { persistReviewStates } from '@/utils/reviewStateStorage'

vi.mock('@/lib/api', () => ({
  getGeneralNoteByUrl: vi.fn(),
  listDsaQuestions: vi.fn(),
  listGeneralNotes: vi.fn(),
  updateNoteReview: vi.fn().mockResolvedValue(null),
  updateQuestionReview: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/utils/reviewStateStorage', () => ({
  loadReviewStates: vi.fn(() => new Map()),
  persistReviewStates: vi.fn(),
}))

let questionCounter = 0

const buildQuestion = (overrides: Partial<DsaQuestion> = {}): DsaQuestion => ({
  id: overrides.id ?? `question-${questionCounter += 1}`,
  userId: overrides.userId ?? 'user-1',
  questionIndex: overrides.questionIndex ?? overrides.id ?? '1',
  title: overrides.title ?? 'Sample Problem',
  titleSlug: overrides.titleSlug ?? 'sample-problem',
  difficulty: overrides.difficulty ?? 'Easy',
  description: overrides.description ?? 'desc',
  solution: overrides.solution ?? null,
  idealSolutionCode: overrides.idealSolutionCode ?? null,
  note: overrides.note ?? null,
  tags: overrides.tags ?? [],
  lastReviewedAt: overrides.lastReviewedAt ?? null,
  lastReviewStatus: overrides.lastReviewStatus ?? null,
  reviewIntervalSeconds: overrides.reviewIntervalSeconds ?? null,
  reviewEaseFactor: overrides.reviewEaseFactor ?? null,
  reviewRepetitions: overrides.reviewRepetitions ?? null,
  nextReviewDate: overrides.nextReviewDate ?? null,
  createdAt: overrides.createdAt ?? new Date().toISOString(),
  updatedAt: overrides.updatedAt ?? new Date().toISOString(),
})

describe('NotebookStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('orders filtered problems by upcoming review date', () => {
    const store = new NotebookStore()
    const now = Date.now()
    store.problems = [
      buildQuestion({ id: 'late', nextReviewDate: new Date(now + 86_400_000).toISOString() }),
      buildQuestion({ id: 'soon', nextReviewDate: new Date(now - 86_400_000).toISOString() }),
      buildQuestion({ id: 'none', nextReviewDate: null }),
    ]

    const ids = store.filteredProblems.map((problem) => problem.id)

    expect(ids).toEqual(['soon', 'none', 'late'])
  })

  it('updates review state and syncs when grading a problem card', () => {
    const store = new NotebookStore()
    const problem = buildQuestion({ id: 'prob-1', questionIndex: 'LC-1', nextReviewDate: new Date().toISOString() })
    store.problems = [problem]

    const reviewCards = (store as any).reviewCards as Map<string, any>
    reviewCards.set('problem-prob-1', {
      id: 'problem-prob-1',
      prompt: 'Prompt',
      answer: 'Answer',
      extra: null,
      tags: [],
      streak: 0,
      due: new Date().toISOString(),
      sourceType: 'problem',
      sourceId: 'prob-1',
      sourceTitle: problem.title,
      questionIndex: problem.questionIndex,
    })

    store.gradeReviewCard('problem-prob-1', 'good')

    expect(updateQuestionReview).toHaveBeenCalledWith(
      'LC-1',
      expect.objectContaining({ lastReviewStatus: 'good' }),
    )

    const reviewStates = (store as any).reviewStates as Map<string, any>
    const state = reviewStates.get('problem-prob-1')
    expect(state).toBeTruthy()
    expect(state.repetitions).toBeGreaterThan(0)
    expect(persistReviewStates).toHaveBeenCalled()
  })
})

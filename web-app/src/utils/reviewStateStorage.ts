import type { ReviewState } from '@/lib/spacedRepetition'

const STORAGE_KEY = 'leetstack-review-states'

type ReviewStateMap = Map<string, ReviewState>

declare global {
  interface Window {
    __REVIEW_STATE_INIT__?: boolean
  }
}

export function loadReviewStates(): ReviewStateMap {
  if (typeof window === 'undefined') {
    return new Map()
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return new Map()
    }
    const parsed = JSON.parse(raw) as Record<string, ReviewState>
    return new Map(Object.entries(parsed))
  } catch (error) {
    console.warn('[leetstack] Unable to load review states', error)
    return new Map()
  }
}

export function persistReviewStates(map: ReviewStateMap) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    const payload: Record<string, ReviewState> = {}
    map.forEach((state, id) => {
      payload[id] = state
    })
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.warn('[leetstack] Unable to persist review states', error)
  }
}

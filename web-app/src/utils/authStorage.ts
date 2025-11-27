const KEY = 'leetstack-pending-email'

export function storePendingAuthEmail(email: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY, email)
}

export function readPendingAuthEmail(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(KEY)
}

export function clearPendingAuthEmail() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(KEY)
}

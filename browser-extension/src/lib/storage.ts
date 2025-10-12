const API_KEY_STORAGE_KEY = 'interviewBuddy.apiKey'

function getChromeStorage(): typeof chrome.storage.local | null {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    return null
  }
  return chrome.storage.local
}

export async function readStoredApiKey(): Promise<string | null> {
  const storage = getChromeStorage()
  if (!storage) {
    return null
  }

  return new Promise((resolve) => {
    storage.get(API_KEY_STORAGE_KEY, (result) => {
      if (chrome.runtime?.lastError) {
        console.warn('[interview-buddy] Failed to read API key', chrome.runtime.lastError)
        resolve(null)
        return
      }

      const value = result?.[API_KEY_STORAGE_KEY]
      resolve(typeof value === 'string' ? value : null)
    })
  })
}

export async function storeApiKey(apiKey: string): Promise<void> {
  const storage = getChromeStorage()
  if (!storage) {
    return
  }

  return new Promise((resolve) => {
    storage.set({ [API_KEY_STORAGE_KEY]: apiKey }, () => {
      if (chrome.runtime?.lastError) {
        console.warn('[interview-buddy] Failed to persist API key', chrome.runtime.lastError)
      }
      resolve()
    })
  })
}

export async function clearStoredApiKey(): Promise<void> {
  const storage = getChromeStorage()
  if (!storage) {
    return
  }

  return new Promise((resolve) => {
    storage.remove(API_KEY_STORAGE_KEY, () => {
      if (chrome.runtime?.lastError) {
        console.warn('[interview-buddy] Failed to clear API key', chrome.runtime.lastError)
      }
      resolve()
    })
  })
}

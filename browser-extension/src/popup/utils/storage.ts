import type { PopupStorageMap } from "../types";

const STORAGE_KEY = "leetstack.leetPopupState";
const PENDING_EMAIL_STORAGE_KEY = "leetstack.pendingAuthEmail";

export function readStoredMap(): Promise<PopupStorageMap> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return Promise.resolve({});
  }

  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (chrome.runtime.lastError) {
        console.warn(
          "[leetstack] Failed to read popup storage",
          chrome.runtime.lastError
        );
        resolve({});
        return;
      }

      const map = result[STORAGE_KEY];
      if (map && typeof map === "object") {
        resolve(map as PopupStorageMap);
      } else {
        resolve({});
      }
    });
  });
}

export function writeStoredMap(map: PopupStorageMap): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: map }, () => {
      if (chrome.runtime.lastError) {
        console.warn(
          "[leetstack] Failed to persist popup storage",
          chrome.runtime.lastError
        );
      }
      resolve();
    });
  });
}

export function readPendingAuthEmail(): Promise<string | null> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    chrome.storage.local.get(PENDING_EMAIL_STORAGE_KEY, (result) => {
      if (chrome.runtime.lastError) {
        console.warn(
          "[leetstack] Failed to read pending auth email",
          chrome.runtime.lastError
        );
        resolve(null);
        return;
      }

      const value = result?.[PENDING_EMAIL_STORAGE_KEY];
      resolve(typeof value === "string" ? value : null);
    });
  });
}

export function storePendingAuthEmail(email: string): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ [PENDING_EMAIL_STORAGE_KEY]: email }, () => {
      if (chrome.runtime.lastError) {
        console.warn(
          "[leetstack] Failed to persist pending auth email",
          chrome.runtime.lastError
        );
      }
      resolve();
    });
  });
}

export function clearPendingAuthEmail(): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    chrome.storage.local.remove(PENDING_EMAIL_STORAGE_KEY, () => {
      if (chrome.runtime.lastError) {
        console.warn(
          "[leetstack] Failed to clear pending auth email",
          chrome.runtime.lastError
        );
      }
      resolve();
    });
  });
}

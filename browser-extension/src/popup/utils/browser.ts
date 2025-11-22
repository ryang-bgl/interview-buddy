export function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.warn(
          "[leetstack] Failed to query active tab",
          chrome.runtime.lastError
        );
        resolve(null);
        return;
      }

      resolve(tabs[0] ?? null);
    });
  });
}

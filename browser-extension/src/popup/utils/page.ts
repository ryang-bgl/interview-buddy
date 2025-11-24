export interface PageContentSnapshot {
  title: string;
  text: string;
}

export async function captureActivePageContent(
  tabId: number
): Promise<PageContentSnapshot | null> {
  if (typeof chrome === "undefined" || !chrome.scripting?.executeScript) {
    return null;
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const doc = document;
        const body = doc.body;
        const textContent = body?.innerText ?? body?.textContent ?? "";
        return {
          title: doc.title ?? "",
          text: textContent,
        };
      },
    });

    return (result?.result ?? null) as PageContentSnapshot | null;
  } catch (error) {
    console.warn("[leetstack] Failed to capture active page content", error);
    return null;
  }
}

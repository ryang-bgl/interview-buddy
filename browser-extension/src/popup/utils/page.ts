export interface PageContentSnapshot {
  title: string;
  text: string;
}

export interface PageHtmlSnapshot {
  title: string;
  html: string;
}

export interface ElementSelectionResult {
  title: string;
  text: string;
  html?: string;
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
      world: "MAIN",
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

export async function selectPageElementContent(
  tabId: number
): Promise<ElementSelectionResult | null> {
  if (typeof chrome === "undefined" || !chrome.scripting?.executeScript) {
    return null;
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      func: elementSelectorScript,
    });

    return (result?.result ?? null) as ElementSelectionResult | null;
  } catch (error) {
    console.warn("[leetstack] Failed to capture selected element", error);
    return null;
  }
}

export async function captureActivePageHtml(
  tabId: number
): Promise<PageHtmlSnapshot | null> {
  if (typeof chrome === "undefined" || !chrome.scripting?.executeScript) {
    return null;
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const doc = document;
        return {
          title: doc.title ?? "",
          html: doc.body?.innerHTML ?? doc.documentElement?.innerHTML ?? "",
        };
      },
    });

    return (result?.result ?? null) as PageHtmlSnapshot | null;
  } catch (error) {
    console.warn("[leetstack] Failed to capture page HTML", error);
    return null;
  }
}

function elementSelectorScript(): Promise<ElementSelectionResult | null> {
  const OVERLAY_ID = "__leetstack-element-overlay";
  const LABEL_ID = "__leetstack-element-overlay-label";

  return new Promise((resolve) => {
    const removeElementById = (id: string) => {
      const existing = document.getElementById(id);
      if (existing && existing.parentElement) {
        existing.parentElement.removeChild(existing);
      }
    };

    const buildOverlay = (id: string) => {
      removeElementById(id);
      const overlay = document.createElement("div");
      overlay.id = id;
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "0";
      overlay.style.height = "0";
      overlay.style.pointerEvents = "none";
      overlay.style.border = "2px solid #8b5cf6";
      overlay.style.boxShadow = "0 0 0 9999px rgba(15, 23, 42, 0.35)";
      overlay.style.borderRadius = "6px";
      overlay.style.zIndex = "2147483647";
      overlay.style.transition = "all 0.08s ease-out";
      overlay.style.display = "none";
      document.body.appendChild(overlay);
      return overlay;
    };

    const buildLabel = (id: string) => {
      removeElementById(id);
      const label = document.createElement("div");
      label.id = id;
      label.textContent = "Click any element to capture it. Press Esc to cancel.";
      label.style.position = "fixed";
      label.style.top = "12px";
      label.style.left = "50%";
      label.style.transform = "translateX(-50%)";
      label.style.background = "rgba(15, 23, 42, 0.9)";
      label.style.color = "#fff";
      label.style.fontSize = "14px";
      label.style.borderRadius = "999px";
      label.style.padding = "8px 18px";
      label.style.zIndex = "2147483647";
      label.style.pointerEvents = "none";
      label.style.boxShadow = "0 10px 25px rgba(15, 23, 42, 0.3)";
      document.body.appendChild(label);
      return label;
    };

    const extractElementText = (target: Element | null) => {
      if (!target) {
        return "";
      }
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return target.value ?? target.innerText ?? target.textContent ?? "";
      }
      return target.textContent?.trim() ?? "";
    };

    const extractElementHtml = (target: Element | null) => {
      if (!target) {
        return "";
      }
      if (target instanceof HTMLElement) {
        return target.innerHTML || target.outerHTML || "";
      }
      return target.outerHTML ?? target.textContent ?? "";
    };

    const cleanup = () => {
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mousedown", stopAndPrevent, true);
      document.removeEventListener("mouseup", stopAndPrevent, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("touchstart", stopAndPrevent, true);
      document.removeEventListener("touchend", stopAndPrevent, true);
      removeElementById(OVERLAY_ID);
      removeElementById(LABEL_ID);
    };

    const finish = (result: ElementSelectionResult | null) => {
      cleanup();
      resolve(result);
    };

    const overlay = buildOverlay(OVERLAY_ID);
    const label = buildLabel(LABEL_ID);

    let activeElement: Element | null = null;

    const updateOverlayRect = (target: Element | null) => {
      if (!target || !(target instanceof Element)) {
        overlay.style.display = "none";
        return;
      }
      if (target.id === OVERLAY_ID || target.id === LABEL_ID) {
        return;
      }
      const rect = target.getBoundingClientRect();
      overlay.style.display = "block";
      overlay.style.top = `${rect.top}px`;
      overlay.style.left = `${rect.left}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
    };

    const onMouseMove = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target || label.contains(target)) {
        return;
      }
      activeElement = target;
      updateOverlayRect(target);
    };

    const onScroll = () => {
      if (activeElement) {
        updateOverlayRect(activeElement);
      }
    };

    const stopAndPrevent = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    const onClick = (event: MouseEvent) => {
      stopAndPrevent(event);
      const target = event.target as Element | null;
      if (!target || target.id === OVERLAY_ID) {
        finish(null);
        return;
      }
      const text = extractElementText(target);
      const html = extractElementHtml(target);
      finish(
        text
          ? {
              text,
              title: document.title ?? "",
              html,
            }
          : null
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(null);
      }
    };

    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("scroll", onScroll, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("mousedown", stopAndPrevent, true);
    document.addEventListener("mouseup", stopAndPrevent, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("touchstart", stopAndPrevent, true);
    document.addEventListener("touchend", stopAndPrevent, true);
  });
}

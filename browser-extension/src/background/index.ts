const sidePanelApi = (chrome as typeof chrome & { sidePanel?: any }).sidePanel;

chrome.runtime.onInstalled.addListener(() => {
  if (!sidePanelApi?.setPanelBehavior) {
    return;
  }
  sidePanelApi
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error: unknown) => {
      console.warn("[leetstack] Failed to set side panel behavior", error);
    });
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !sidePanelApi?.open || !sidePanelApi?.setOptions) {
    return;
  }
  try {
    await sidePanelApi.setOptions({
      tabId: tab.id,
      path: "src/popup/index.html",
    });
    await sidePanelApi.open({ tabId: tab.id });
  } catch (error) {
    console.warn("[leetstack] Unable to open side panel", error);
  }
});

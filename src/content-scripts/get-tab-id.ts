export async function getTabId(): Promise<number> {
  const response = (await chrome.runtime.sendMessage({ type: "get-tab-id" })) as
    | { tabId?: number }
    | undefined;
  if (!response || typeof response.tabId !== "number") {
    throw new Error("getTabId: background did not return a tabId");
  }
  return response.tabId;
}

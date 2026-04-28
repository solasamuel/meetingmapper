type GetTabIdRequest = { type: "get-tab-id" };
type ExtensionMessage = GetTabIdRequest;

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    if (message.type === "get-tab-id") {
      sendResponse({ tabId: sender.tab?.id });
      return false;
    }
    return false;
  },
);

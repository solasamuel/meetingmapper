import { findCaptionContainer, isMeetHost, createMeetCaptureObserver } from "../capture/meet.js";
import { ChromeSessionCaptionBuffer } from "../storage/session-buffer.js";
import { waitForElement } from "./wait-for-element.js";
import { getTabId } from "./get-tab-id.js";

declare global {
  interface Window {
    __meetingmapperMeetAttached?: boolean;
  }
}

async function bootstrap(): Promise<void> {
  if (window.__meetingmapperMeetAttached) return;
  window.__meetingmapperMeetAttached = true;

  if (!isMeetHost(window.location.hostname)) return;

  const tabId = await getTabId();
  const buffer = new ChromeSessionCaptionBuffer(tabId);
  await buffer.hydrate();

  const root = await waitForElement(findCaptionContainer);
  const observer = createMeetCaptureObserver({ root, buffer });
  observer.start();

  console.info("[meetingmapper] Meet capture attached");
}

bootstrap().catch((err) => {
  console.error("[meetingmapper] Meet bootstrap failed:", err);
});

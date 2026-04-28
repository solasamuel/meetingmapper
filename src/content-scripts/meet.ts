import {
  findCaptionContainer,
  isMeetHost,
  createMeetCaptureObserver,
  type MeetCaptureObserver,
} from "../capture/meet.js";
import { ChromeSessionCaptionBuffer } from "../storage/session-buffer.js";
import { watchForElement } from "./watch-for-element.js";
import { getTabId } from "./get-tab-id.js";

declare global {
  // eslint-disable-next-line no-var
  var __meetingmapperMeetAttached: boolean | undefined;
}

// Content scripts are bundled as IIFE, which does not support top-level
// await. Wrap the bootstrap in an async IIFE and report failures via
// .catch — SonarLint S7785's "prefer top-level await" advice does not
// apply to extension content scripts.
async function bootstrap(): Promise<void> {
  if (globalThis.__meetingmapperMeetAttached) return;
  globalThis.__meetingmapperMeetAttached = true;

  if (!isMeetHost(globalThis.location.hostname)) return;

  const tabId = await getTabId();
  const buffer = new ChromeSessionCaptionBuffer(tabId);
  await buffer.hydrate();

  let observer: MeetCaptureObserver | null = null;

  watchForElement(findCaptionContainer, {
    onAppear: (root) => {
      observer = createMeetCaptureObserver({ root, buffer });
      observer.start();
      console.info("[meetingmapper] Meet capture attached");
    },
    onDisappear: () => {
      observer?.stop();
      observer = null;
      console.info("[meetingmapper] Meet caption container removed; capture paused");
    },
  });
}

bootstrap().catch((err: unknown) => {
  console.error("[meetingmapper] Meet bootstrap failed:", err);
});

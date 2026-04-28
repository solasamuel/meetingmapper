import {
  findTeamsCaptionContainer,
  isTeamsHost,
  createTeamsCaptureObserver,
  type TeamsCaptureObserver,
} from "../capture/teams.js";
import { ChromeSessionCaptionBuffer } from "../storage/session-buffer.js";
import { watchForElement } from "./watch-for-element.js";
import { getTabId } from "./get-tab-id.js";

declare global {
  // eslint-disable-next-line no-var
  var __meetingmapperTeamsAttached: boolean | undefined;
}

// Content scripts are bundled as IIFE; see meet.ts for note on
// SonarLint S7785's "top-level await" advice not applying here.
async function bootstrap(): Promise<void> {
  if (globalThis.__meetingmapperTeamsAttached) return;
  globalThis.__meetingmapperTeamsAttached = true;

  if (!isTeamsHost(globalThis.location.hostname)) return;

  const tabId = await getTabId();
  const buffer = new ChromeSessionCaptionBuffer(tabId);
  await buffer.hydrate();

  let observer: TeamsCaptureObserver | null = null;

  watchForElement(findTeamsCaptionContainer, {
    onAppear: (root) => {
      observer = createTeamsCaptureObserver({ root, buffer });
      observer.start();
      console.info("[meetingmapper] Teams capture attached");
    },
    onDisappear: () => {
      observer?.stop();
      observer = null;
      console.info("[meetingmapper] Teams caption container removed; capture paused");
    },
  });
}

bootstrap().catch((err: unknown) => {
  console.error("[meetingmapper] Teams bootstrap failed:", err);
});

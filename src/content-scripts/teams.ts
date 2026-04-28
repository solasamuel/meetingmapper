import {
  findTeamsCaptionContainer,
  isTeamsHost,
  createTeamsCaptureObserver,
} from "../capture/teams.js";
import { ChromeSessionCaptionBuffer } from "../storage/session-buffer.js";
import { waitForElement } from "./wait-for-element.js";
import { getTabId } from "./get-tab-id.js";

declare global {
  interface Window {
    __meetingmapperTeamsAttached?: boolean;
  }
}

async function bootstrap(): Promise<void> {
  if (window.__meetingmapperTeamsAttached) return;
  window.__meetingmapperTeamsAttached = true;

  if (!isTeamsHost(window.location.hostname)) return;

  const tabId = await getTabId();
  const buffer = new ChromeSessionCaptionBuffer(tabId);
  await buffer.hydrate();

  const root = await waitForElement(findTeamsCaptionContainer);
  const observer = createTeamsCaptureObserver({ root, buffer });
  observer.start();

  console.info("[meetingmapper] Teams capture attached");
}

bootstrap().catch((err) => {
  console.error("[meetingmapper] Teams bootstrap failed:", err);
});

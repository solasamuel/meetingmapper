import type { CaptionBuffer } from "./buffer.js";
import {
  createCaptureObserver,
  makeSpeakerExtractor,
  type CaptureObserver,
} from "./observer.js";

const TEAMS_HOST = "teams.microsoft.com";

export function isTeamsHost(hostname: string): boolean {
  return hostname === TEAMS_HOST;
}

export function findTeamsCaptionContainer(doc: Document = document): Element | null {
  const tids = doc.querySelectorAll<HTMLElement>("[data-tid]");
  for (const el of tids) {
    const tid = el.dataset.tid ?? "";
    if (/caption/i.test(tid)) return el;
  }
  return null;
}

export type TeamsCaptureOptions = {
  root: Element;
  buffer: CaptionBuffer;
};

export type TeamsCaptureObserver = CaptureObserver;

const teamsExtract = makeSpeakerExtractor('[data-tid="author"]');

export function createTeamsCaptureObserver(opts: TeamsCaptureOptions): TeamsCaptureObserver {
  return createCaptureObserver({ ...opts, extract: teamsExtract });
}

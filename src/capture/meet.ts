import type { CaptionBuffer } from "./buffer.js";
import {
  createCaptureObserver,
  makeSpeakerExtractor,
  type CaptureObserver,
} from "./observer.js";

const MEET_HOST = "meet.google.com";

export function isMeetHost(hostname: string): boolean {
  return hostname === MEET_HOST;
}

export function findCaptionContainer(doc: Document = document): Element | null {
  const regions = doc.querySelectorAll('[role="region"]');
  for (const region of regions) {
    const label = region.getAttribute("aria-label") ?? "";
    if (/caption/i.test(label)) return region;
  }
  return doc.querySelector("[aria-live]");
}

export type MeetCaptureOptions = {
  root: Element;
  buffer: CaptionBuffer;
};

export type MeetCaptureObserver = CaptureObserver;

const meetExtract = makeSpeakerExtractor("[data-speaker]");

export function createMeetCaptureObserver(opts: MeetCaptureOptions): MeetCaptureObserver {
  return createCaptureObserver({ ...opts, extract: meetExtract });
}

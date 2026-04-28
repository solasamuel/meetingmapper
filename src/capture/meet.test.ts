// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  createMeetCaptureObserver,
  findCaptionContainer,
  isMeetHost,
} from "./meet.js";
import { InMemoryCaptionBuffer } from "./buffer.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

function makeCaptionRoot(): HTMLElement {
  // Mimics Meet's caption container — a [role="region"] with aria-label
  // mentioning "captions". The test's structural assumption: Meet labels
  // its caption region this way. Class names are deliberately omitted —
  // capture must work without them.
  const root = document.createElement("div");
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", "Captions");
  document.body.appendChild(root);
  return root;
}

function makeCaptionLine(text: string, speaker?: string): HTMLElement {
  const li = document.createElement("div");
  if (speaker) {
    const speakerEl = document.createElement("div");
    speakerEl.dataset.speaker = "";
    speakerEl.textContent = speaker;
    li.appendChild(speakerEl);
  }
  const textEl = document.createElement("span");
  textEl.textContent = text;
  li.appendChild(textEl);
  return li;
}

async function flushMutations(): Promise<void> {
  // MutationObserver callbacks queue as microtasks
  await Promise.resolve();
  await Promise.resolve();
}

describe("createMeetCaptureObserver — AC3 buffers added nodes", () => {
  it("appends a CaptionEntry when a non-empty caption line is added to the root", async () => {
    const root = makeCaptionRoot();
    const buffer = new InMemoryCaptionBuffer();
    const observer = createMeetCaptureObserver({ root, buffer });
    observer.start();

    root.appendChild(makeCaptionLine("Hello everyone."));
    await flushMutations();

    const entries = buffer.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.text).toBe("Hello everyone.");

    observer.stop();
  });

  it("does not append entries for nodes with empty / whitespace-only text", async () => {
    const root = makeCaptionRoot();
    const buffer = new InMemoryCaptionBuffer();
    const observer = createMeetCaptureObserver({ root, buffer });
    observer.start();

    const empty = document.createElement("div");
    empty.textContent = "   ";
    root.appendChild(empty);
    await flushMutations();

    expect(buffer.getAll()).toEqual([]);

    observer.stop();
  });

  it("appends multiple entries in order as new lines are added", async () => {
    const root = makeCaptionRoot();
    const buffer = new InMemoryCaptionBuffer();
    const observer = createMeetCaptureObserver({ root, buffer });
    observer.start();

    root.appendChild(makeCaptionLine("First line"));
    root.appendChild(makeCaptionLine("Second line"));
    root.appendChild(makeCaptionLine("Third line"));
    await flushMutations();

    expect(buffer.getAll().map((e) => e.text)).toEqual([
      "First line",
      "Second line",
      "Third line",
    ]);

    observer.stop();
  });
});

describe("createMeetCaptureObserver — AC4 speaker extraction", () => {
  it("captures the speaker from a [data-speaker] sibling and strips it from text", async () => {
    const root = makeCaptionRoot();
    const buffer = new InMemoryCaptionBuffer();
    const observer = createMeetCaptureObserver({ root, buffer });
    observer.start();

    root.appendChild(makeCaptionLine("Hello team.", "Alice"));
    await flushMutations();

    const entries = buffer.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.speaker).toBe("Alice");
    expect(entries[0]?.text).toBe("Hello team.");

    observer.stop();
  });

  it("leaves speaker null when no [data-speaker] sibling is present", async () => {
    const root = makeCaptionRoot();
    const buffer = new InMemoryCaptionBuffer();
    const observer = createMeetCaptureObserver({ root, buffer });
    observer.start();

    root.appendChild(makeCaptionLine("Anonymous speech."));
    await flushMutations();

    expect(buffer.getAll()[0]).toMatchObject({ speaker: null, text: "Anonymous speech." });

    observer.stop();
  });

  it("captures speaker for multiple lines independently", async () => {
    const root = makeCaptionRoot();
    const buffer = new InMemoryCaptionBuffer();
    const observer = createMeetCaptureObserver({ root, buffer });
    observer.start();

    root.appendChild(makeCaptionLine("First.", "Alice"));
    root.appendChild(makeCaptionLine("Second.", "Bob"));
    await flushMutations();

    const entries = buffer.getAll();
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ speaker: "Alice", text: "First." });
    expect(entries[1]).toMatchObject({ speaker: "Bob", text: "Second." });

    observer.stop();
  });
});

describe("createMeetCaptureObserver — stop()", () => {
  it("detaches the observer so subsequent mutations are not buffered", async () => {
    const root = makeCaptionRoot();
    const buffer = new InMemoryCaptionBuffer();
    const observer = createMeetCaptureObserver({ root, buffer });
    observer.start();

    root.appendChild(makeCaptionLine("Before stop."));
    await flushMutations();
    expect(buffer.getAll()).toHaveLength(1);

    observer.stop();

    root.appendChild(makeCaptionLine("After stop."));
    await flushMutations();
    expect(buffer.getAll()).toHaveLength(1);
  });

  it("start() after stop() resumes capturing", async () => {
    const root = makeCaptionRoot();
    const buffer = new InMemoryCaptionBuffer();
    const observer = createMeetCaptureObserver({ root, buffer });

    observer.start();
    observer.stop();
    observer.start();

    root.appendChild(makeCaptionLine("Resumed."));
    await flushMutations();

    expect(buffer.getAll()).toHaveLength(1);
    expect(buffer.getAll()[0]?.text).toBe("Resumed.");

    observer.stop();
  });
});

describe("findCaptionContainer — AC2 structural selector / ARIA role", () => {
  it("locates [role=region] with aria-label mentioning 'captions'", () => {
    const root = document.createElement("div");
    root.setAttribute("role", "region");
    root.setAttribute("aria-label", "Captions");
    document.body.appendChild(root);

    expect(findCaptionContainer(document)).toBe(root);
  });

  it("matches aria-label case-insensitively", () => {
    const root = document.createElement("div");
    root.setAttribute("role", "region");
    root.setAttribute("aria-label", "LIVE CAPTIONS");
    document.body.appendChild(root);

    expect(findCaptionContainer(document)).toBe(root);
  });

  it("falls back to an aria-live region when no role=region+caption-label is found", () => {
    const root = document.createElement("div");
    root.setAttribute("aria-live", "polite");
    document.body.appendChild(root);

    expect(findCaptionContainer(document)).toBe(root);
  });

  it("returns null when no caption-shaped element is present", () => {
    document.body.innerHTML = "<div><p>nothing here</p></div>";
    expect(findCaptionContainer(document)).toBeNull();
  });

  it("does NOT match by class name (cross-format guard)", () => {
    document.body.innerHTML = '<div class="meet-caption-region">x</div>';
    expect(findCaptionContainer(document)).toBeNull();
  });

  it("prefers the role=region+captions match over a generic aria-live region", () => {
    const live = document.createElement("div");
    live.setAttribute("aria-live", "polite");
    live.id = "live-only";
    document.body.appendChild(live);

    const captionRegion = document.createElement("div");
    captionRegion.setAttribute("role", "region");
    captionRegion.setAttribute("aria-label", "Captions");
    captionRegion.id = "caption-region";
    document.body.appendChild(captionRegion);

    expect(findCaptionContainer(document)?.id).toBe("caption-region");
  });
});

describe("isMeetHost — AC1 domain guard", () => {
  it("returns true for the canonical Meet hostname", () => {
    expect(isMeetHost("meet.google.com")).toBe(true);
  });

  it("returns false for example.com", () => {
    expect(isMeetHost("example.com")).toBe(false);
  });

  it("returns false for teams.microsoft.com (cross-platform guard)", () => {
    expect(isMeetHost("teams.microsoft.com")).toBe(false);
  });

  it("returns false for a phishing-style lookalike", () => {
    expect(isMeetHost("meet.google.com.evil.com")).toBe(false);
    expect(isMeetHost("evil-meet.google.com")).toBe(false);
    expect(isMeetHost("meet.google.com.attacker.io")).toBe(false);
  });

  it("returns false for empty / missing input", () => {
    expect(isMeetHost("")).toBe(false);
  });
});

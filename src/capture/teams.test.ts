// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  createTeamsCaptureObserver,
  findTeamsCaptionContainer,
  isTeamsHost,
} from "./teams.js";
import { InMemoryCaptionBuffer } from "./buffer.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

// Teams' caption container is not in our test environment, so the
// fixture mimics the structural shape we target: a [data-tid] element
// whose value contains 'caption'. data-tid is a stable Teams attribute
// (telemetry id) — class names rotate the same way Meet's do.
function makeTeamsCaptionRoot(): HTMLElement {
  const root = document.createElement("div");
  root.setAttribute("data-tid", "closed-captions-renderer");
  document.body.appendChild(root);
  return root;
}

function makeTeamsCaptionLine(text: string, author?: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-tid", "closed-caption-text");
  if (author) {
    const authorEl = document.createElement("span");
    authorEl.setAttribute("data-tid", "author");
    authorEl.textContent = author;
    wrapper.appendChild(authorEl);
  }
  const textEl = document.createElement("span");
  textEl.setAttribute("data-tid", "text");
  textEl.textContent = text;
  wrapper.appendChild(textEl);
  return wrapper;
}

async function flushMutations(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe("isTeamsHost — AC1 domain guard", () => {
  it("returns true for the canonical Teams hostname", () => {
    expect(isTeamsHost("teams.microsoft.com")).toBe(true);
  });

  it("returns false for example.com", () => {
    expect(isTeamsHost("example.com")).toBe(false);
  });

  it("returns false for meet.google.com (cross-platform guard)", () => {
    expect(isTeamsHost("meet.google.com")).toBe(false);
  });

  it("returns false for phishing-style lookalikes", () => {
    expect(isTeamsHost("teams.microsoft.com.evil.com")).toBe(false);
    expect(isTeamsHost("evil-teams.microsoft.com")).toBe(false);
  });

  it("returns false for empty input", () => {
    expect(isTeamsHost("")).toBe(false);
  });
});

describe("findTeamsCaptionContainer — AC2 Teams-specific selector", () => {
  it("locates an element by data-tid containing 'caption'", () => {
    const root = makeTeamsCaptionRoot();
    expect(findTeamsCaptionContainer(document)).toBe(root);
  });

  it("matches data-tid case-insensitively", () => {
    const root = document.createElement("div");
    root.setAttribute("data-tid", "CLOSED-CAPTIONS-RENDERER");
    document.body.appendChild(root);
    expect(findTeamsCaptionContainer(document)).toBe(root);
  });

  it("returns null when no caption-shaped element is present", () => {
    document.body.innerHTML = "<div><p>nothing here</p></div>";
    expect(findTeamsCaptionContainer(document)).toBeNull();
  });

  it("does NOT match by class name (cross-format guard)", () => {
    document.body.innerHTML = '<div class="teams-captions">x</div>';
    expect(findTeamsCaptionContainer(document)).toBeNull();
  });

  it("does NOT match the Meet ARIA-region pattern (selector isolation)", () => {
    const meetShape = document.createElement("div");
    meetShape.setAttribute("role", "region");
    meetShape.setAttribute("aria-label", "Captions");
    document.body.appendChild(meetShape);
    expect(findTeamsCaptionContainer(document)).toBeNull();
  });
});

describe("createTeamsCaptureObserver — AC3 buffer shape parity with Meet", () => {
  it("appends a CaptionEntry when a non-empty caption line is added", async () => {
    const root = makeTeamsCaptionRoot();
    const buffer = new InMemoryCaptionBuffer();
    const observer = createTeamsCaptureObserver({ root, buffer });
    observer.start();

    root.appendChild(makeTeamsCaptionLine("Hello team."));
    await flushMutations();

    const entries = buffer.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.text).toBe("Hello team.");

    observer.stop();
  });

  it("captures speaker from the [data-tid='author'] descendant", async () => {
    const root = makeTeamsCaptionRoot();
    const buffer = new InMemoryCaptionBuffer();
    const observer = createTeamsCaptureObserver({ root, buffer });
    observer.start();

    root.appendChild(makeTeamsCaptionLine("Hello team.", "Alice"));
    await flushMutations();

    const entries = buffer.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ speaker: "Alice", text: "Hello team." });

    observer.stop();
  });

  it("output shape matches Meet capture exactly: { speaker, text, timestamp } only", async () => {
    const root = makeTeamsCaptionRoot();
    const buffer = new InMemoryCaptionBuffer();
    const observer = createTeamsCaptureObserver({ root, buffer });
    observer.start();

    root.appendChild(makeTeamsCaptionLine("Test.", "Bob"));
    await flushMutations();

    const entry = buffer.getAll()[0];
    expect(entry).toBeDefined();
    expect(Object.keys(entry!).sort((a, b) => a.localeCompare(b))).toEqual([
      "speaker",
      "text",
      "timestamp",
    ]);
    expect(entry!.timestamp).toBeNull();

    observer.stop();
  });

  it("ignores whitespace-only nodes (parity with Meet)", async () => {
    const root = makeTeamsCaptionRoot();
    const buffer = new InMemoryCaptionBuffer();
    const observer = createTeamsCaptureObserver({ root, buffer });
    observer.start();

    const empty = document.createElement("div");
    empty.textContent = "   ";
    root.appendChild(empty);
    await flushMutations();

    expect(buffer.getAll()).toEqual([]);

    observer.stop();
  });

  it("stop() detaches the observer", async () => {
    const root = makeTeamsCaptionRoot();
    const buffer = new InMemoryCaptionBuffer();
    const observer = createTeamsCaptureObserver({ root, buffer });
    observer.start();
    root.appendChild(makeTeamsCaptionLine("Before."));
    await flushMutations();
    observer.stop();
    root.appendChild(makeTeamsCaptionLine("After."));
    await flushMutations();
    expect(buffer.getAll()).toHaveLength(1);
  });
});

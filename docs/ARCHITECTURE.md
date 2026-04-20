# MeetingMapper — Solution Architecture

**Version:** 1.0 &nbsp;·&nbsp; **Date:** 2026-04-20 &nbsp;·&nbsp; **Author:** Sola Samuel / Spearhead Finance Ltd

MeetingMapper is a cross-browser extension (Chrome, Edge, Firefox) that turns meeting transcripts — live-captured, pasted, or uploaded — into structured action items, decisions, open questions, a summary, and an attendee map, then exports them in Notion / Confluence / Slack / plain-email formats.

---

## 1. High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                         Browser Extension                             │
│                                                                       │
│  ┌─────────────────────┐     ┌─────────────────────┐                  │
│  │ Content Script      │     │ Content Script      │                  │
│  │ meet.google.com     │     │ teams.microsoft.com │                  │
│  │                     │     │                     │                  │
│  │ MutationObserver    │     │ MutationObserver    │                  │
│  │ → caption buffer    │     │ → caption buffer    │                  │
│  └──────────┬──────────┘     └──────────┬──────────┘                  │
│             │                           │                             │
│             ▼                           ▼                             │
│        ┌───────────────────────────────────────┐                      │
│        │       chrome.storage.session          │                      │
│        │    (per-tab caption buffer)           │                      │
│        └───────────────┬───────────────────────┘                      │
│                        │                                              │
│  ┌─────────────────┐   │   ┌──────────────────────────────────────┐   │
│  │ Popup (React)   │◄──┴──►│  Background Service Worker           │   │
│  │                 │       │                                      │   │
│  │ • Paste box     │ msg   │ • VTT / SRT / TXT parsers            │   │
│  │ • File upload   │◄─────►│ • Normaliser + diarisation cleanup   │   │
│  │ • Tabbed views  │       │ • Chunker (10-min windows)           │   │
│  │ • Export btns   │       │ • Claude API client (multi-pass)     │   │
│  └─────────────────┘       └──────────────┬───────────────────────┘   │
│                                           │                           │
└───────────────────────────────────────────┼───────────────────────────┘
                                            │ HTTPS
                                            ▼
                                ┌──────────────────────┐
                                │   api.anthropic.com  │
                                └──────────────────────┘
```

All transcript processing happens in the background service worker. The popup is a thin React UI; content scripts are thin DOM watchers. The Claude API is the only external dependency.

---

## 2. Component Responsibilities

| Component | Responsibility |
|---|---|
| **Content Script — Meet** | `MutationObserver` on caption container; speaker label from sibling element; buffer to `chrome.storage.session` keyed by tab id |
| **Content Script — Teams** | Same pattern; Teams-specific selector isolated in its own module |
| **Popup (React)** | "Process current meeting" button, paste textarea, file upload, five tabs (Action Items / Decisions / Open Questions / Summary / Attendee Map), export buttons per format, settings screen |
| **Background Service Worker** | Transcript parsing (VTT / SRT / TXT), normalisation, diarisation cleanup, chunking, Claude API calls, export formatting |
| **Storage** | `chrome.storage.session` for per-tab caption buffers; `chrome.storage.local` for API key and user preferences |

---

## 3. Data Model

### 3.1 Normalised Transcript

Every input source converges on this shape before anything else happens:

```ts
type TranscriptEntry = {
  speaker: string | null;   // null when no label inferred
  text: string;
  timestamp: string | null; // ISO-like HH:MM:SS; null for plain text
};

type Transcript = TranscriptEntry[];
```

### 3.2 Claude Output Schema

```ts
type ExtractionResult = {
  action_items: Array<{
    task: string;
    owner: string | null;
    due: string | null;
    priority: "high" | "medium" | "low";
  }>;
  decisions: Array<{ decision: string; made_by: string | null }>;
  open_questions: string[];
  summary: string;
  attendees: Array<{ name: string; topics: string[]; word_count: number }>;
};
```

The schema is enforced via a Zod validator in the background worker. Schema-invalid responses surface a user-visible error rather than a half-rendered UI.

---

## 4. Key Flows

### 4.1 Paste / Upload Flow

1. User pastes text or selects a `.txt` / `.vtt` / `.srt` file in the popup.
2. File extension + content sniff picks the parser.
3. Parser emits a `Transcript`.
4. Diarisation cleanup merges adjacent same-speaker entries.
5. Router picks single-pass or multi-pass (§4.3) based on word count.
6. `ExtractionResult` is rendered into the five tabs.

### 4.2 Live Meet / Teams Flow

1. Content script attaches a `MutationObserver` to the caption container, located by **structural selector + ARIA role**, not class names — Google ships obfuscated class names that change with deployments.
2. Added nodes with non-empty `textContent` are pushed to a buffer; speaker label is pulled from a sibling element.
3. Buffer is persisted to `chrome.storage.session` keyed by `tabId` so it survives popup close/reopen.
4. User clicks **Process current meeting** → background worker reads the buffer and runs the same pipeline as §4.1.

### 4.3 Multi-Pass Chunking (Long Meetings)

A 2-hour transcript can be 15,000–20,000 words — too much for a single high-quality pass. Strategy:

- **Pass 1 — Extract.** Split transcript into ~10-minute windows. For each chunk, ask Claude to extract raw facts as JSON arrays (tasks mentioned, decisions, questions, speakers).
- **Pass 2 — Synthesise.** Send the combined raw-facts list back to Claude for deduplication and synthesis into the final `ExtractionResult`.

This is **two Claude calls total** (one multiplexed extract, one synthesise) — not one-per-chunk. Cost and latency stay bounded; quality beats single-pass on truncated input.

UI shows: `Extracting facts…` → `Synthesising output…`.

---

## 5. Engineering Challenges & Mitigations

### 5.1 Meet Caption DOM is Hostile

**Problem:** Google Meet uses dynamically added children with obfuscated class names that rotate with deployments.

**Mitigation:** Never select by class name. Use structural selectors (role hierarchy, ARIA live-region roles, stable attribute patterns). A regression test loads a recorded Meet DOM fixture to guard the selector.

### 5.2 Notion Clipboard Format

**Problem:** Notion expects specific clipboard HTML conventions for its block types, not standard markdown.

**Mitigation:** Ship GitHub-Flavored Markdown with `- [ ] item` checkboxes — Notion renders these as native to-dos when pasted. Defer richer clipboard-HTML work unless users complain. Verified manually per release (T-EXP-02).

### 5.3 Teams DOM Differs from Meet

**Problem:** Same problem shape, different selectors.

**Mitigation:** Isolate Meet and Teams selector logic in separate modules behind a shared `CaptionCapture` interface. Output shape is identical, so downstream code is unaware of the source.

### 5.4 Firefox Compatibility

**Problem:** `chrome.*` vs `browser.*` API differences; Firefox quirks around content-script injection timing.

**Mitigation:** Thin polyfill that picks `browser` when present and falls back to `chrome`. `web-ext lint` in CI.

---

## 6. Tech Stack

| Concern | Choice |
|---|---|
| Language | TypeScript (strict) |
| UI | React + Vite |
| Extension target | Manifest V3 (Chrome/Edge); Firefox via `browser_specific_settings` |
| State | React local state + `chrome.storage` |
| Validation | Zod (for Claude output schema) |
| API client | Anthropic TypeScript SDK |
| Tests | Vitest, React Testing Library, Playwright |

---

## 7. Security & Privacy

- **API key** stored in `chrome.storage.local` (never `.sync` — we don't want it on Google's sync servers). Input masked in settings UI.
- **Host permissions** restricted to `meet.google.com`, `teams.microsoft.com`, and `api.anthropic.com`.
- **No analytics** on transcript content. Any telemetry (if added later) is opt-in and scrubbed of transcript text.
- **No `innerHTML`** on any untrusted content — all UI rendering goes through React.
- **Local-only storage.** Transcripts and caption buffers never leave the extension except as the payload of a Claude API request.

---

## 8. Build Plan (3 Evenings)

| Evening | Scope |
|---|---|
| **1** | Parsers (VTT / SRT / TXT) + normaliser; paste textarea; file upload; popup shell with all five tabs |
| **2** | Background worker + Claude structured-JSON client; multi-pass chunking; all four export formatters |
| **3** | Meet live capture via `MutationObserver`; Teams capture; Firefox compatibility + polyfill; settings popup; real-meeting E2E; publish |

---

## 9. Open Questions

- **Per-workspace Notion integration via OAuth** — rich blocks instead of clipboard markdown. Out of scope for v1; parking for v1.1.
- **Team plan billing model** — £5/user/month is the mooted price point; no infra for this in v1.
- **Offline / self-hosted Claude** — not in scope; single-tenant API-key model only.

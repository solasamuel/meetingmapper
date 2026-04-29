import { useState } from "react";
import type { ExtractionResult } from "../../extraction/schema.js";
import type { ExportFormat } from "../../storage/settings.js";

const TOAST_DURATION_MS = 1500;

export type Formatters = {
  notion: (result: ExtractionResult) => string;
  confluence: (result: ExtractionResult) => string;
  slack: (result: ExtractionResult) => string;
  email: (result: ExtractionResult) => { subject: string; body: string };
};

export type ExportBarProps = {
  readonly result: ExtractionResult;
  readonly formatters: Formatters;
  readonly copy: (text: string) => Promise<void>;
  readonly defaultFormat?: ExportFormat;
};

const BUTTONS: ReadonlyArray<{ format: ExportFormat; label: string }> = [
  { format: "notion", label: "Notion" },
  { format: "confluence", label: "Confluence" },
  { format: "slack", label: "Slack" },
  { format: "email", label: "Email" },
];

export function ExportBar({
  result,
  formatters,
  copy,
  defaultFormat,
}: Readonly<ExportBarProps>) {
  const [copied, setCopied] = useState(false);

  const handleClick = (format: ExportFormat) => {
    let text: string;
    switch (format) {
      case "notion":
        text = formatters.notion(result);
        break;
      case "confluence":
        text = formatters.confluence(result);
        break;
      case "slack":
        text = formatters.slack(result);
        break;
      case "email":
        text = formatters.email(result).body;
        break;
    }
    copy(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), TOAST_DURATION_MS);
      })
      .catch((err: unknown) => {
        console.error("[meetingmapper] copy failed:", err);
      });
  };

  return (
    <div className="export-bar">
      {BUTTONS.map((btn) => (
        <button
          key={btn.format}
          type="button"
          className="export-button"
          aria-pressed={btn.format === defaultFormat}
          onClick={() => handleClick(btn.format)}
        >
          {btn.label}
        </button>
      ))}
      {copied && (
        <span className="copied-toast" role="status">
          Copied!
        </span>
      )}
    </div>
  );
}

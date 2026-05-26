import { useId, useState } from "react";

export type PasteInputProps = {
  readonly onSubmit: (text: string) => void;
  readonly busy?: boolean;
};

export function PasteInput({ onSubmit, busy = false }: Readonly<PasteInputProps>) {
  const inputId = useId();
  const [text, setText] = useState("");

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0 && !busy;

  return (
    <div className="paste-input">
      <label htmlFor={inputId} className="paste-input-label">
        Paste transcript
      </label>
      <textarea
        id={inputId}
        className="paste-input-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a meeting transcript here…"
        rows={8}
        disabled={busy}
      />
      <button
        type="button"
        className="paste-input-submit"
        disabled={!canSubmit}
        onClick={() => onSubmit(text)}
      >
        {busy ? "Processing…" : "Process transcript"}
      </button>
    </div>
  );
}

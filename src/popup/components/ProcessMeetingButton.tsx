import type { CaptionEntry } from "../../capture/buffer.js";

export type ProcessMeetingButtonProps = {
  readonly entries: CaptionEntry[];
  readonly onClick: () => void;
  readonly busy?: boolean;
};

export function ProcessMeetingButton({
  entries,
  onClick,
  busy = false,
}: Readonly<ProcessMeetingButtonProps>) {
  const empty = entries.length === 0;
  const canClick = !empty && !busy;

  return (
    <div className="process-meeting">
      <button
        type="button"
        className="process-meeting-button"
        disabled={!canClick}
        onClick={onClick}
      >
        {busy ? "Processing…" : "Process current meeting"}
      </button>
      {!empty && (
        <span className="process-meeting-count">
          {entries.length === 1
            ? "1 caption captured"
            : `${entries.length} captions captured`}
        </span>
      )}
    </div>
  );
}

import type { Attendee } from "../../extraction/schema.js";

export type AttendeeMapViewProps = {
  attendees: Attendee[];
};

export function AttendeeMapView({ attendees }: AttendeeMapViewProps) {
  if (attendees.length === 0) {
    return <p className="empty-state">No attendees captured.</p>;
  }

  const maxWords = Math.max(...attendees.map((a) => a.word_count), 1);

  return (
    <ul className="attendee-map">
      {attendees.map((attendee, index) => {
        const widthPct = (attendee.word_count / maxWords) * 100;
        return (
          <li key={index} className="attendee">
            <div className="attendee-header">
              <span className="attendee-name">{attendee.name}</span>
              <span className="attendee-words">{attendee.word_count} words</span>
            </div>
            <div
              className="word-count-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={maxWords}
              aria-valuenow={attendee.word_count}
              aria-label={`${attendee.name} spoke ${attendee.word_count} words`}
            >
              <div className="word-count-bar-fill" style={{ width: `${widthPct}%` }} />
            </div>
            {attendee.topics.length > 0 && (
              <div className="attendee-topics">{attendee.topics.join(", ")}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

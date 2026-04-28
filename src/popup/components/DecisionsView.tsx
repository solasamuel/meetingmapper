import type { Decision } from "../../extraction/schema.js";

export type DecisionsViewProps = {
  decisions: Decision[];
};

export function DecisionsView({ decisions }: DecisionsViewProps) {
  if (decisions.length === 0) {
    return <p className="empty-state">No decisions captured.</p>;
  }
  return (
    <ul className="decisions">
      {decisions.map((d, index) => (
        <li key={index} className="decision">
          <span className="decision-text">{d.decision}</span>
          {d.made_by && <span className="decision-by"> — {d.made_by}</span>}
        </li>
      ))}
    </ul>
  );
}

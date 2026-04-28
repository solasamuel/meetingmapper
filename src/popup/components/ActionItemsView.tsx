import { useId } from "react";
import type { ActionItem } from "../../extraction/schema.js";

export type ActionItemsViewProps = {
  items: ActionItem[];
};

export function ActionItemsView({ items }: ActionItemsViewProps) {
  if (items.length === 0) {
    return <p className="empty-state">No action items captured.</p>;
  }
  return (
    <ul className="action-items">
      {items.map((item, index) => (
        <ActionItemRow key={index} item={item} />
      ))}
    </ul>
  );
}

function ActionItemRow({ item }: { item: ActionItem }) {
  const checkboxId = useId();
  return (
    <li className="action-item">
      <input id={checkboxId} type="checkbox" />
      <div className="action-item-body">
        <label htmlFor={checkboxId} className="action-item-task">
          {item.task}
        </label>
        <div className="action-item-meta">
          <span className="action-item-owner">{item.owner ?? "Unassigned"}</span>
          <span className="action-item-due">{item.due ?? "No date"}</span>
          <span className={`priority priority-${item.priority}`}>{item.priority}</span>
        </div>
      </div>
    </li>
  );
}

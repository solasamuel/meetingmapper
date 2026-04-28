import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type TabDefinition = {
  id: string;
  label: string;
  panel: ReactNode;
};

export type TabsProps = {
  tabs: TabDefinition[];
};

export function Tabs({ tabs }: TabsProps) {
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();

  if (tabs.length === 0) return null;

  const focusTab = (index: number) => {
    setSelected(index);
    tabRefs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusTab((index + 1) % tabs.length);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusTab((index - 1 + tabs.length) % tabs.length);
        break;
      case "Home":
        event.preventDefault();
        focusTab(0);
        break;
      case "End":
        event.preventDefault();
        focusTab(tabs.length - 1);
        break;
    }
  };

  const activePanel = tabs[selected]?.panel;

  return (
    <div className="tabs">
      <div className="tabs-list" role="tablist">
        {tabs.map((tab, index) => {
          const isSelected = index === selected;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              type="button"
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              id={`${baseId}-tab-${tab.id}`}
              tabIndex={isSelected ? 0 : -1}
              className={isSelected ? "tab tab-selected" : "tab"}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-${tabs[selected]?.id}`}
        aria-labelledby={`${baseId}-tab-${tabs[selected]?.id}`}
        className="tab-panel"
      >
        {activePanel}
      </div>
    </div>
  );
}

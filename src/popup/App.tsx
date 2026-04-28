import packageJson from "../../package.json" with { type: "json" };
import type { ExtractionResult } from "../extraction/schema.js";
import { Tabs, type TabDefinition } from "./components/Tabs.js";
import { ActionItemsView } from "./components/ActionItemsView.js";
import { DecisionsView } from "./components/DecisionsView.js";
import { OpenQuestionsView } from "./components/OpenQuestionsView.js";
import { SummaryView } from "./components/SummaryView.js";
import { AttendeeMapView } from "./components/AttendeeMapView.js";

export type AppProps = {
  readonly result?: ExtractionResult | null;
};

export function App({ result }: Readonly<AppProps> = {}) {
  return (
    <div>
      <header className="popup-header">
        <h1 className="popup-title">MeetingMapper</h1>
        <span className="popup-version">v{packageJson.version}</span>
      </header>
      {result ? <ResultView result={result} /> : <EmptyState />}
    </div>
  );
}

function EmptyState() {
  return (
    <p className="popup-empty">
      Paste a transcript, upload a file, or start a Meet / Teams call to capture captions.
    </p>
  );
}

function ResultView({ result }: Readonly<{ result: ExtractionResult }>) {
  const tabs: TabDefinition[] = [
    {
      id: "action-items",
      label: "Action Items",
      panel: <ActionItemsView items={result.action_items} />,
    },
    {
      id: "decisions",
      label: "Decisions",
      panel: <DecisionsView decisions={result.decisions} />,
    },
    {
      id: "open-questions",
      label: "Open Questions",
      panel: <OpenQuestionsView questions={result.open_questions} />,
    },
    {
      id: "summary",
      label: "Summary",
      panel: <SummaryView summary={result.summary} />,
    },
  ];

  if (result.attendees.length > 0) {
    tabs.push({
      id: "attendees",
      label: "Attendees",
      panel: <AttendeeMapView attendees={result.attendees} />,
    });
  }

  return <Tabs tabs={tabs} />;
}

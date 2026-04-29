import packageJson from "../../package.json" with { type: "json" };
import type { ExtractionResult } from "../extraction/schema.js";
import { Tabs, type TabDefinition } from "./components/Tabs.js";
import { ActionItemsView } from "./components/ActionItemsView.js";
import { DecisionsView } from "./components/DecisionsView.js";
import { OpenQuestionsView } from "./components/OpenQuestionsView.js";
import { SummaryView } from "./components/SummaryView.js";
import { AttendeeMapView } from "./components/AttendeeMapView.js";
import { PasteInput } from "./components/PasteInput.js";
import { useExtraction, type ExtractFn } from "./use-extraction.js";
import { runPasteExtraction } from "./run-paste-extraction.js";

export type AppProps = {
  readonly result?: ExtractionResult | null;
  readonly extractFn?: ExtractFn;
};

export function App({ result, extractFn = runPasteExtraction }: Readonly<AppProps> = {}) {
  const extraction = useExtraction(extractFn);

  // Tests pass `result` directly; production uses the hook.
  const activeResult = result ?? extraction.result;

  return (
    <div>
      <header className="popup-header">
        <h1 className="popup-title">MeetingMapper</h1>
        <span className="popup-version">v{packageJson.version}</span>
      </header>

      {activeResult ? (
        <>
          <ResultView result={activeResult} />
          <button
            type="button"
            className="reset-button"
            onClick={extraction.reset}
          >
            New transcript
          </button>
        </>
      ) : (
        <>
          <PasteInput
            onSubmit={extraction.run}
            busy={extraction.state === "running"}
          />
          {extraction.state === "error" && extraction.error && (
            <p className="error-banner" role="alert">
              {extraction.error.message}
            </p>
          )}
        </>
      )}
    </div>
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

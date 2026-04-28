import packageJson from "../../package.json" with { type: "json" };

export function App() {
  return (
    <div>
      <header className="popup-header">
        <h1 className="popup-title">MeetingMapper</h1>
        <span className="popup-version">v{packageJson.version}</span>
      </header>
      <p className="popup-empty">
        Paste a transcript, upload a file, or start a Meet / Teams call to capture captions.
      </p>
    </div>
  );
}

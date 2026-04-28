export type SummaryViewProps = {
  summary: string;
};

export function SummaryView({ summary }: SummaryViewProps) {
  if (summary.trim() === "") {
    return <p className="empty-state">No summary captured.</p>;
  }
  return <p className="summary">{summary}</p>;
}

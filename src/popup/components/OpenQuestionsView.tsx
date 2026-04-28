export type OpenQuestionsViewProps = {
  questions: string[];
};

export function OpenQuestionsView({ questions }: OpenQuestionsViewProps) {
  if (questions.length === 0) {
    return <p className="empty-state">No open questions captured.</p>;
  }
  return (
    <ul className="open-questions">
      {questions.map((q, index) => (
        <li key={index}>{q}</li>
      ))}
    </ul>
  );
}

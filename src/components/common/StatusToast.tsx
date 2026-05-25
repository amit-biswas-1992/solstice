interface StatusToastProps {
  message: string | null;
}

export default function StatusToast({ message }: StatusToastProps) {
  if (!message) {
    return null;
  }

  return (
    <section
      className="selected-day-panel__section"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Status update"
    >
      <div className="selected-day-panel__section-header">
        <h3>Status</h3>
        <span>Saved locally</span>
      </div>
      <p className="selected-day-panel__summary">{message}</p>
    </section>
  );
}

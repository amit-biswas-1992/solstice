interface StatusToastProps {
  message: string | null;
  tone: 'error' | 'success';
}

export default function StatusToast({ message, tone }: StatusToastProps) {
  if (!message) {
    return null;
  }

  return (
    <section
      className={`selected-day-panel__section selected-day-panel__status selected-day-panel__status--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      aria-atomic="true"
      aria-label="Status update"
    >
      <div className="selected-day-panel__section-header">
        <h3>Status</h3>
        <span>{tone === 'error' ? 'Save blocked' : 'Saved to workspace'}</span>
      </div>
      <p className="selected-day-panel__summary">{message}</p>
    </section>
  );
}

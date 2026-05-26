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
      className={[
        'rounded-[24px] border px-5 py-4',
        tone === 'error'
          ? 'border-[color:var(--color-error)] bg-[rgba(181,71,60,0.08)]'
          : 'border-[color:var(--color-line)] bg-[color:var(--color-paper-muted)]'
      ].join(' ')}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      aria-atomic="true"
      aria-label="Status update"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-medium text-[color:var(--color-ink)]">Status</h3>
        <span className="text-[12px] uppercase tracking-[0.08em] text-[color:var(--color-copy-muted)]">
          {tone === 'error' ? 'Save blocked' : 'Saved to workspace'}
        </span>
      </div>
      <p className="mt-2 text-sm leading-5 text-[color:var(--color-copy-muted)]">{message}</p>
    </section>
  );
}

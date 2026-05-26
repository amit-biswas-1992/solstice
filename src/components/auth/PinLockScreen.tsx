import { useState } from 'react';
import type { StoreSummary } from '../../types/desktopBridge';

interface PinLockScreenProps {
  appVersion: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  onClearError: () => void;
  onUnlock: (pin: string) => Promise<void>;
  summary: StoreSummary;
}

const summaryCardClass =
  'rounded-[18px] border border-[color:var(--color-line)] bg-white/70 px-4 py-3';

export default function PinLockScreen({
  appVersion,
  errorMessage,
  isSubmitting,
  onClearError,
  onUnlock,
  summary
}: PinLockScreenProps) {
  const [pin, setPin] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onUnlock(pin);
  };

  return (
    <main className="flex min-h-screen items-stretch justify-center p-10">
      <section
        className="w-full max-w-[720px] rounded-[32px] border border-[color:var(--color-line)] bg-white p-10 shadow-[0_16px_48px_rgba(20,20,19,0.06)]"
        aria-labelledby="pin-lock-title"
      >
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-copy-muted)]">
          Locked workspace
        </p>
        <h1
          id="pin-lock-title"
          className="font-[var(--font-serif)] text-[clamp(2.6rem,6vw,4rem)] leading-[0.96] font-[330] text-[color:var(--color-ink)]"
        >
          Unlock Daily Notes
        </h1>
        <p className="mt-[18px] max-w-[40rem] text-base leading-6 font-[330] text-[color:var(--color-copy-muted)]">
          Enter your PIN to load the local store snapshot and continue from your last workspace
          checkpoint.
        </p>

        <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
          <label htmlFor="pin-code" className="grid gap-2">
            <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-[color:var(--color-copy-muted)]">
              PIN code
            </span>
            <input
              id="pin-code"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(event) => {
                if (errorMessage) {
                  onClearError();
                }
                setPin(event.target.value);
              }}
              aria-describedby="pin-help"
              className="h-12 w-full rounded-[10px] border border-[color:var(--color-line)] bg-white px-3 text-base text-[color:var(--color-ink)] outline-none transition focus:border-[color:var(--color-line-strong)] focus:ring-2 focus:ring-[color:var(--color-line-strong)]"
            />
          </label>

          <p id="pin-help" className="text-sm leading-5 text-[color:var(--color-copy-muted)]">
            Last opened month: {summary.lastOpenedMonth}
          </p>

          {errorMessage ? (
            <p role="alert" className="text-sm font-medium text-[color:var(--color-error)]">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting || pin.trim().length === 0}
              className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[color:var(--color-ink)] px-5 text-base font-medium text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Unlocking...' : 'Unlock workspace'}
            </button>
          </div>
        </form>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <SummaryCard label="Projects" value={`${summary.projectCount}`} />
          <SummaryCard label="Entry days" value={`${summary.entryCount}`} />
          <SummaryCard label="Selected date" value={summary.lastSelectedDate} />
        </div>

        <p className="mt-6 text-[12px] uppercase tracking-[0.08em] text-[color:var(--color-copy-muted)]">
          Bridge v{appVersion}
        </p>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={summaryCardClass}>
      <p className="m-0 text-[12px] font-medium uppercase tracking-[0.08em] text-[color:var(--color-copy-muted)]">
        {label}
      </p>
      <p className="mt-2 text-base font-medium text-[color:var(--color-ink)]">{value}</p>
    </div>
  );
}

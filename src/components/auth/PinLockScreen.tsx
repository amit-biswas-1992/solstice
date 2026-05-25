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
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="pin-lock-title">
        <p className="eyebrow">Locked Workspace</p>
        <h1 id="pin-lock-title">Unlock Daily Notes</h1>
        <p className="lede">
          Enter your PIN to load the local store snapshot and continue from your
          last workspace checkpoint.
        </p>
        <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
          <label
            htmlFor="pin-code"
            style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6f7f8e' }}
          >
            PIN Code
          </label>
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
            style={{
              width: '100%',
              marginTop: 10,
              padding: '16px 18px',
              fontSize: '1rem',
              borderRadius: 16,
              border: '1px solid rgba(28, 40, 51, 0.18)',
              background: '#fffdfa'
            }}
          />
          <p id="pin-help" style={{ margin: '10px 0 0', color: '#6f7f8e', fontSize: '0.92rem' }}>
            Last opened month: {summary.lastOpenedMonth}
          </p>
          {errorMessage ? (
            <p
              role="alert"
              style={{ margin: '14px 0 0', color: '#9f2d2d', fontWeight: 600 }}
            >
              {errorMessage}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting || pin.trim().length === 0}
            style={{
              marginTop: 18,
              padding: '14px 18px',
              border: 0,
              borderRadius: 16,
              background: '#1f4e79',
              color: '#f7f2e8',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: isSubmitting ? 'wait' : 'pointer',
              opacity: isSubmitting || pin.trim().length === 0 ? 0.72 : 1
            }}
          >
            {isSubmitting ? 'Unlocking...' : 'Unlock Workspace'}
          </button>
        </form>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginTop: 24
          }}
        >
          <SummaryCard label="Projects" value={`${summary.projectCount}`} />
          <SummaryCard label="Entry Days" value={`${summary.entryCount}`} />
          <SummaryCard label="Selected Date" value={summary.lastSelectedDate} />
        </div>
        <p className="build-tag">Bridge v{appVersion}</p>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 18,
        background: 'rgba(255, 255, 255, 0.7)',
        border: '1px solid rgba(28, 40, 51, 0.1)'
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: '0.78rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#8c5e34'
        }}
      >
        {label}
      </p>
      <p style={{ margin: '8px 0 0', fontSize: '1rem', fontWeight: 600, color: '#1c2833' }}>
        {value}
      </p>
    </div>
  );
}

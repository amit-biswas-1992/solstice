import { useState, useRef, useEffect } from 'react';
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
  summary: _summary
}: PinLockScreenProps) {
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onUnlock(pin);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f0eb]">
      {/* Centered card */}
      <div className="w-full max-w-[400px] px-6">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a1a1a] shadow-lg">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1a1a1a]">
            Solstice
          </h1>
          <p className="mt-1.5 text-sm text-[#8b8680]">
            Your calm, local-first daily planner
          </p>
        </div>

        {/* Login form card */}
        <div className="rounded-2xl border border-[#e8e2db] bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit}>
            <label htmlFor="pin-code" className="block text-sm font-medium text-[#1a1a1a]">
              Enter your PIN
            </label>
            <input
              ref={inputRef}
              id="pin-code"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              placeholder="••••"
              value={pin}
              onChange={(event) => {
                if (errorMessage) {
                  onClearError();
                }
                setPin(event.target.value);
              }}
              className="mt-2 h-12 w-full rounded-xl border border-[#e8e2db] bg-[#faf8f5] px-4 text-center text-lg tracking-[0.3em] text-[#1a1a1a] outline-none transition placeholder:text-[#c5bfb8] focus:border-[#1a1a1a] focus:bg-white focus:ring-1 focus:ring-[#1a1a1a]"
            />

            {errorMessage ? (
              <p role="alert" className="mt-2.5 text-center text-sm text-[#c0392b]">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || pin.trim().length === 0}
              className="mt-4 h-12 w-full rounded-xl bg-[#1a1a1a] text-sm font-medium text-white transition hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Unlocking...
                </span>
              ) : (
                'Unlock'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[#b5afa8]">
          v{appVersion} · Local-only · No cloud
        </p>
      </div>
    </main>
  );
}

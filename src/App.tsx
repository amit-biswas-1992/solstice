import { useEffect, useState } from 'react';
import PinLockScreen from './components/auth/PinLockScreen';
import type { StoreBootstrap } from './types/desktopBridge';
import type { StoreSnapshot } from './types/models';

export default function App() {
  const [bootstrap, setBootstrap] = useState<StoreBootstrap | null>(null);
  const [store, setStore] = useState<StoreSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const nextBootstrap = await window.dailyNotesDesktop.loadStore();
        if (!isActive) {
          return;
        }

        setBootstrap(nextBootstrap);
        if (!nextBootstrap.auth.isLocked && nextBootstrap.store) {
          setStore(nextBootstrap.store);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }
        setLoadError(error instanceof Error ? error.message : 'Failed to load the local store.');
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, []);

  const handleUnlock = async (pin: string) => {
    setUnlockError(null);
    setIsUnlocking(true);

    try {
      const result = await window.dailyNotesDesktop.unlock(pin);
      if (!result.ok) {
        setUnlockError(result.message);
        return;
      }

      setStore(result.store);
      setBootstrap((current) =>
        current
          ? {
              ...current,
              auth: {
                ...current.auth,
                isLocked: false
              },
              store: result.store
            }
          : current
      );
    } catch (error) {
      setUnlockError(error instanceof Error ? error.message : 'Unlock failed.');
    } finally {
      setIsUnlocking(false);
    }
  };

  if (loadError) {
    return (
      <main className="app-shell">
        <section className="hero-panel">
          <p className="eyebrow">Bootstrap Error</p>
          <h1>Daily Notes Desktop</h1>
          <p className="lede">{loadError}</p>
          <p className="build-tag">Bridge v{window.dailyNotesDesktop.version}</p>
        </section>
      </main>
    );
  }

  if (!bootstrap) {
    return (
      <main className="app-shell">
        <section className="hero-panel">
          <p className="eyebrow">Bootstrapping</p>
          <h1>Loading Daily Notes</h1>
          <p className="lede">Preparing the local store and auth state.</p>
          <p className="build-tag">Bridge v{window.dailyNotesDesktop.version}</p>
        </section>
      </main>
    );
  }

  if (bootstrap.auth.isLocked) {
    return (
      <PinLockScreen
        appVersion={window.dailyNotesDesktop.version}
        errorMessage={unlockError}
        isSubmitting={isUnlocking}
        onClearError={() => setUnlockError(null)}
        onUnlock={handleUnlock}
        summary={bootstrap.summary}
      />
    );
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Unlocked Shell</p>
        <h1>Daily Notes Workspace</h1>
        <p className="lede">
          {store ? `${store.projects.length} project loaded.` : 'Workspace unlocked.'}
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginTop: 24
          }}
        >
          <ShellCard label="Selected Date" value={store?.settings.lastSelectedDate ?? bootstrap.summary.lastSelectedDate} />
          <ShellCard label="Last Opened Month" value={store?.settings.lastOpenedMonth ?? bootstrap.summary.lastOpenedMonth} />
          <ShellCard label="Project Count" value={`${store?.projects.length ?? bootstrap.summary.projectCount}`} />
        </div>
        <p className="lede" style={{ marginTop: 20 }}>
          Selected date: {store?.settings.lastSelectedDate ?? bootstrap.summary.lastSelectedDate}
        </p>
        <p className="build-tag">Bridge v{window.dailyNotesDesktop.version}</p>
      </section>
    </main>
  );
}

function ShellCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 18,
        background: 'rgba(255, 255, 255, 0.72)',
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
      <p style={{ margin: '8px 0 0', fontSize: '1rem', fontWeight: 600 }}>{value}</p>
    </div>
  );
}

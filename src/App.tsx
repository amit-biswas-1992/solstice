import { useEffect, useState } from 'react';
import PinLockScreen from './components/auth/PinLockScreen';
import WorkspaceShell from './components/layout/WorkspaceShell';
import type { StoreBootstrap, UnlockedStoreSnapshot } from './types/desktopBridge';

export default function App() {
  const [bootstrap, setBootstrap] = useState<StoreBootstrap | null>(null);
  const [store, setStore] = useState<UnlockedStoreSnapshot | null>(null);
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

  const unlockedStore = store ?? bootstrap.store;

  if (!unlockedStore) {
    return (
      <main className="app-shell">
        <section className="hero-panel">
          <p className="eyebrow">Workspace Error</p>
          <h1>Daily Notes Workspace</h1>
          <p className="lede">The store unlocked, but no workspace snapshot was returned.</p>
          <p className="build-tag">Bridge v{window.dailyNotesDesktop.version}</p>
        </section>
      </main>
    );
  }

  return <WorkspaceShell appVersion={window.dailyNotesDesktop.version} store={unlockedStore} />;
}

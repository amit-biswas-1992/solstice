import { useEffect, useState } from 'react';
import PinLockScreen from './components/auth/PinLockScreen';
import WorkspaceShell from './components/layout/WorkspaceShell';
import DemoApp from './demo/DemoApp';
import type { StoreBootstrap, UnlockedStoreSnapshot } from './types/desktopBridge';

export default function App() {
  const demoMode = new URLSearchParams(window.location.search).get('demo');

  if (demoMode) {
    return <DemoApp mode={demoMode} />;
  }

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

  const handlePersistStore = async (nextStore: UnlockedStoreSnapshot) => {
    const savedStore = await window.dailyNotesDesktop.saveStore(nextStore);
    setStore(savedStore);
    setBootstrap((current) =>
      current
        ? {
            ...current,
            store: savedStore
          }
        : current
    );
    return savedStore;
  };

  if (loadError) {
    return (
      <main className="flex min-h-screen items-stretch justify-center p-10">
        <section className="w-full max-w-[720px] rounded-[32px] border border-[color:var(--color-line)] bg-white p-10 shadow-[0_16px_48px_rgba(20,20,19,0.06)]">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-copy-muted)]">
            Bootstrap error
          </p>
          <h1 className="font-[var(--font-serif)] text-[clamp(2.6rem,6vw,4rem)] leading-[0.96] font-[330] text-[color:var(--color-ink)]">
            Daily Notes Desktop
          </h1>
          <p className="mt-[18px] max-w-[40rem] text-base leading-6 font-[330] text-[color:var(--color-copy-muted)]">
            {loadError}
          </p>
          <p className="mt-6 text-[12px] uppercase tracking-[0.08em] text-[color:var(--color-copy-muted)]">
            Bridge v{window.dailyNotesDesktop.version}
          </p>
        </section>
      </main>
    );
  }

  if (!bootstrap) {
    return (
      <main className="flex min-h-screen items-stretch justify-center p-10">
        <section className="w-full max-w-[720px] rounded-[32px] border border-[color:var(--color-line)] bg-white p-10 shadow-[0_16px_48px_rgba(20,20,19,0.06)]">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-copy-muted)]">
            Bootstrapping
          </p>
          <h1 className="font-[var(--font-serif)] text-[clamp(2.6rem,6vw,4rem)] leading-[0.96] font-[330] text-[color:var(--color-ink)]">
            Loading Daily Notes
          </h1>
          <p className="mt-[18px] max-w-[40rem] text-base leading-6 font-[330] text-[color:var(--color-copy-muted)]">
            Preparing the local store and auth state.
          </p>
          <p className="mt-6 text-[12px] uppercase tracking-[0.08em] text-[color:var(--color-copy-muted)]">
            Bridge v{window.dailyNotesDesktop.version}
          </p>
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
      <main className="flex min-h-screen items-stretch justify-center p-10">
        <section className="w-full max-w-[720px] rounded-[32px] border border-[color:var(--color-line)] bg-white p-10 shadow-[0_16px_48px_rgba(20,20,19,0.06)]">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.18em] text-[color:var(--color-copy-muted)]">
            Workspace error
          </p>
          <h1 className="font-[var(--font-serif)] text-[clamp(2.6rem,6vw,4rem)] leading-[0.96] font-[330] text-[color:var(--color-ink)]">
            Daily Notes Workspace
          </h1>
          <p className="mt-[18px] max-w-[40rem] text-base leading-6 font-[330] text-[color:var(--color-copy-muted)]">
            The store unlocked, but no workspace snapshot was returned.
          </p>
          <p className="mt-6 text-[12px] uppercase tracking-[0.08em] text-[color:var(--color-copy-muted)]">
            Bridge v{window.dailyNotesDesktop.version}
          </p>
        </section>
      </main>
    );
  }

  const handleLock = () => {
    setStore(null);
    setBootstrap((current) =>
      current
        ? {
            ...current,
            auth: { ...current.auth, isLocked: true },
            store: undefined
          }
        : current
    );
  };

  return (
    <WorkspaceShell
      appVersion={window.dailyNotesDesktop.version}
      onLock={handleLock}
      onPersistStore={handlePersistStore}
      store={unlockedStore}
    />
  );
}

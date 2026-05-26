import PinLockScreen from '../components/auth/PinLockScreen';
import WorkspaceShell from '../components/layout/WorkspaceShell';
import { demoStore, demoSummary } from './demoData';

interface DemoAppProps {
  mode: string;
}

export default function DemoApp({ mode }: DemoAppProps) {
  if (mode === 'pin') {
    return (
      <PinLockScreen
        appVersion="demo"
        errorMessage={null}
        isSubmitting={false}
        onClearError={() => undefined}
        onUnlock={async () => undefined}
        summary={demoSummary}
      />
    );
  }

  return (
    <WorkspaceShell
      appVersion="demo"
      onPersistStore={async (store) => store}
      store={demoStore}
    />
  );
}

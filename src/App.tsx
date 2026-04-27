import { AppShell, NavBar } from 'even-toolkit/web';
import { useAppSelector } from './app/hooks/useAppSelector';
import { appStore, type AppTab } from './app/store';
import { CountPage } from './pages/CountPage';
import { TrainPage } from './pages/TrainPage';
import { StrategyPage } from './pages/StrategyPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';

const TAB_ITEMS: { id: AppTab; label: string }[] = [
  { id: 'count', label: 'Count' },
  { id: 'train', label: 'Train' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'stats', label: 'Stats' },
  { id: 'settings', label: 'Settings' },
];

function ActivePage({ tab }: { tab: AppTab }) {
  switch (tab) {
    case 'count': return <CountPage />;
    case 'train': return <TrainPage />;
    case 'strategy': return <StrategyPage />;
    case 'stats': return <StatsPage />;
    case 'settings': return <SettingsPage />;
  }
}

export default function App() {
  const phase = useAppSelector((s) => s.phase);
  const tab = useAppSelector((s) => s.tab);
  const statusMessage = useAppSelector((s) => s.statusMessage);

  if (phase === 'booting') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-4xl mb-4">♠</div>
          <p className="text-text-dim text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-sm font-medium mb-1">Something went wrong</p>
          <p className="text-text-dim text-xs">{statusMessage ?? 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      header={<span className="font-semibold">♠ Blackjack</span>}
      footer={
        <NavBar
          items={TAB_ITEMS}
          activeId={tab}
          onNavigate={(id) => appStore.setTab(id as AppTab)}
        />
      }
    >
      <ActivePage tab={tab} />
    </AppShell>
  );
}

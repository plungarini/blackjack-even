import { useAppSelector } from './app/hooks/useAppSelector';
import { appStore, type AppTab } from './app/store';
import { BottomNav } from './components/BottomNav';
import { CountPage } from './pages/CountPage';
import { TrainPage } from './pages/TrainPage';
import { StrategyPage } from './pages/StrategyPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';

function ActivePage({ tab }: { tab: AppTab }) {
  switch (tab) {
    case 'count': return <CountPage />;
    case 'train': return <TrainPage />;
    case 'strategy': return <StrategyPage />;
    case 'stats': return <StatsPage />;
    case 'settings': return <SettingsPage />;
  }
}

function PageTitle({ tab }: { tab: AppTab }) {
  switch (tab) {
    case 'count': return 'Card Count';
    case 'train': return 'Blackjack';
    case 'strategy': return 'Strategy';
    case 'stats': return 'Statistics';
    case 'settings': return 'Settings';
  }
}

export default function App() {
  const phase = useAppSelector((s) => s.phase);
  const tab = useAppSelector((s) => s.tab);
  const statusMessage = useAppSelector((s) => s.statusMessage);

  if (phase === 'booting') {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg">
        <div className="text-center">
          <div className="text-5xl mb-4">♠</div>
          <p className="text-text-dim text-sm font-['Poppins']">Loading…</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-sm font-medium mb-1 text-text">Something went wrong</p>
          <p className="text-text-dim text-xs">{statusMessage ?? 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-bg">
      <div className="relative mx-auto flex h-full max-w-md flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h1 className="text-lg font-semibold text-text font-['Poppins']">
            {PageTitle({ tab })}
          </h1>
          <div className="flex items-center gap-1">
            <span className="text-xl">♠</span>
            <span className="text-xs font-medium text-text-dim">Blackjack</span>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <ActivePage tab={tab} />
        </div>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={tab}
          onChange={(id) => appStore.setTab(id as AppTab)}
        />
      </div>
    </div>
  );
}

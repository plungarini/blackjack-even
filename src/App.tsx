import { AppShell, Card } from 'even-toolkit/web';

export default function App() {
  return (
    <AppShell>
      <div className="px-3 pt-4 pb-8">
        <Card>
          <h1 className="text-lg font-semibold mb-2">Blackjack</h1>
          <p className="text-[15px] text-text-dim">
            Open the Even app on your phone to project this app onto the G2 glasses.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

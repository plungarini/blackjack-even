import type { ViewKey, View } from './types';

type Listener = () => void;

export class Router {
  private stack: ViewKey[];
  private readonly views: Record<ViewKey, View>;
  private readonly listeners = new Set<Listener>();

  constructor(views: Record<ViewKey, View>, initial: ViewKey = 'count') {
    this.views = views;
    this.stack = [initial];
    views[initial].enter?.();
  }

  get currentView(): View {
    return this.views[this.stack[this.stack.length - 1] ?? 'count'];
  }

  get currentKey(): ViewKey {
    return this.stack[this.stack.length - 1] ?? 'count';
  }

  push(key: ViewKey): void {
    if (this.currentKey === key) return;
    this.currentView.exit?.();
    this.stack.push(key);
    this.views[key].enter?.();
    this.notify();
  }

  pop(): ViewKey | null {
    if (this.stack.length <= 1) return null;
    this.currentView.exit?.();
    this.stack.pop();
    this.currentView.enter?.();
    this.notify();
    return this.currentKey;
  }

  reset(key: ViewKey): void {
    if (this.stack.length === 1 && this.stack[0] === key) return;
    this.currentView.exit?.();
    this.stack = [key];
    this.views[key].enter?.();
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try { listener(); } catch (error) { console.error('[Router] listener error', error); }
    }
  }
}

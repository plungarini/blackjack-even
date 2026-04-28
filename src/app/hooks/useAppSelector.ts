import { useSyncExternalStore } from 'react';
import { appStore } from '../store';
import type { AppState } from '../store';

export function useAppSelector<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(
    appStore.subscribe.bind(appStore),
    () => selector(appStore.getState()),
    () => selector(appStore.getState()),
  );
}

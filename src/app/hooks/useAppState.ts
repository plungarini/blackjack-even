import { useAppSelector } from './useAppSelector';
import type { AppState } from '../store';

export function useAppState(): AppState {
  return useAppSelector((s) => s);
}

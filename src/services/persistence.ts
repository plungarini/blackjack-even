import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk';

export async function storageGet(key: string): Promise<string | null> {
  try {
    const bridge = await waitForEvenAppBridge();
    const value = await bridge.getLocalStorage(key);
    return typeof value === 'string' && value.length > 0 ? value : null;
  } catch {
    return sessionStorage.getItem(key);
  }
}

export async function storageSet(key: string, value: string): Promise<void> {
  try {
    const bridge = await waitForEvenAppBridge();
    await bridge.setLocalStorage(key, value);
  } catch {
    sessionStorage.setItem(key, value);
  }
}

export async function storageRemove(key: string): Promise<void> {
  try {
    const bridge = await waitForEvenAppBridge();
    await bridge.setLocalStorage(key, '');
  } catch {
    sessionStorage.removeItem(key);
  }
}

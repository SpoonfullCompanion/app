const APP_PREFIX = 'spoonfull-mobile';

const buildKey = (key: string) => `${APP_PREFIX}:${key}`;

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const raw = window.localStorage.getItem(buildKey(key));
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to parse localStorage key "${key}"`, error);
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(buildKey(key), JSON.stringify(value));
}

export function clearStorage(key: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(buildKey(key));
}

export function storageKey(key: string) {
  return buildKey(key);
}

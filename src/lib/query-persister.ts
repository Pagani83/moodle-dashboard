import type { Persister, PersistedClient } from '@tanstack/react-query-persist-client';

// Lazy import to avoid SSR issues
async function getIDB() {
  try {
    const mod = await import('idb-keyval');
    return mod;
  } catch {
    return null;
  }
}

const PERSIST_KEY = 'moodle_dash_query_cache_v1';

export async function createWebPersister(): Promise<Persister | undefined> {
  if (typeof window === 'undefined') return undefined;

  // Try IndexedDB first (non-blocking for large payloads)
  const idb = await getIDB();
  if (idb) {
    const { get, set, del } = idb as any;
    const idbPersister: Persister = {
      persistClient: async (client: PersistedClient) => {
        try {
          await set(PERSIST_KEY, client);
        } catch (e) {
          // If IDB quota fails, silently ignore (fallback will be used next load)
          console.warn('IDB persist failed, will fallback next load:', e);
        }
      },
      restoreClient: async () => {
        try {
          return await get(PERSIST_KEY);
        } catch (e) {
          console.warn('IDB restore failed:', e);
          return undefined;
        }
      },
      removeClient: async () => {
        try {
          await del(PERSIST_KEY);
        } catch { /* no-op */ }
      },
    };
    return idbPersister;
  }

  // Fallback to localStorage
  try {
    const localPersister: Persister = {
      persistClient: async (client: PersistedClient) => {
        window.localStorage.setItem(PERSIST_KEY, JSON.stringify(client));
      },
      restoreClient: async () => {
        const raw = window.localStorage.getItem(PERSIST_KEY);
        return raw ? JSON.parse(raw) : undefined;
      },
      removeClient: async () => {
        window.localStorage.removeItem(PERSIST_KEY);
      },
    };
    return localPersister;
  } catch {
    // Final fallback to sessionStorage
    try {
      const sessionPersister: Persister = {
        persistClient: async (client: PersistedClient) => {
          window.sessionStorage.setItem(PERSIST_KEY, JSON.stringify(client));
        },
        restoreClient: async () => {
          const raw = window.sessionStorage.getItem(PERSIST_KEY);
          return raw ? JSON.parse(raw) : undefined;
        },
        removeClient: async () => {
          window.sessionStorage.removeItem(PERSIST_KEY);
        },
      };
      return sessionPersister;
    } catch {
      return undefined;
    }
  }
}

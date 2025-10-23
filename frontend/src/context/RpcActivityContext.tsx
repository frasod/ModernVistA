import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

export interface RpcActivityItem {
  id: string;
  timestamp: number;
  endpoint: string;
  rpcName?: string;
  durationMs: number;
  statusCode?: number; // HTTP status when available
  event?: string;      // semantic event (select, cache, timeout)
  error?: string;
}

interface RpcActivityContextValue {
  log: (entry: Omit<RpcActivityItem, 'id' | 'timestamp'>) => void;
  items: RpcActivityItem[];
  clear: () => void;
}

const RpcActivityContext = createContext<RpcActivityContextValue | undefined>(undefined);

const STORAGE_KEY = 'modernvista.rpc.activity';

export const RpcActivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<RpcActivityItem[]>([]);

  // Hydrate
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed.slice(0,200));
        }
      }
    } catch { /* ignore */ }
  }, []);

  const persist = useCallback((next: RpcActivityItem[]) => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const log = (entry: Omit<RpcActivityItem, 'id' | 'timestamp'>) => {
    setItems(prev => {
      const next = [{ id: crypto.randomUUID(), timestamp: Date.now(), ...entry }, ...prev].slice(0, 200);
      persist(next);
      return next;
    });
  };
  const clear = () => { setItems([]); try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ } };
  return (
    <RpcActivityContext.Provider value={{ log, items, clear }}>
      {children}
    </RpcActivityContext.Provider>
  );
};

export function useRpcActivity() {
  const ctx = useContext(RpcActivityContext);
  if (!ctx) throw new Error('useRpcActivity must be used within RpcActivityProvider');
  return ctx;
}

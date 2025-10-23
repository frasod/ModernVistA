import { useState, useEffect, useCallback } from 'react';
import { searchPatients, Patient, ApiResponse } from '../services/patients';
import { useRpcActivity } from '../context/RpcActivityContext';

interface UsePatientSearchResult {
  patients: Patient[];
  loading: boolean;
  error?: string;
  term: string;
  setTerm: (t: string) => void;
  offline: boolean;
  timeout: boolean;
}

export function usePatientSearch(debounceMs = 300): UsePatientSearchResult {
  const [term, setTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [offline, setOffline] = useState(false);
  const [timeout, setTimeoutFlag] = useState(false);
  const { log } = useRpcActivity();

  const perform = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setPatients([]); setError(undefined); setOffline(false); setTimeoutFlag(false); return;
    }
    setLoading(true); setError(undefined); setOffline(false); setTimeoutFlag(false);
    try {
      const res: ApiResponse<Patient[]> = await searchPatients(q, info => {
        log({ endpoint: '/api/v1/patients-search', statusCode: info.status, durationMs: info.durationMs, rpcName: info.rpcName, error: info.error });
      });
      if (res.data) setPatients(res.data);
      if (res.error) setError(res.error);
      if (res.offline) setOffline(true);
      if (res.timeout) setTimeoutFlag(true);
    } catch (e:any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const h = setTimeout(() => { perform(term); }, debounceMs);
    return () => clearTimeout(h);
  }, [term, debounceMs, perform]);

  return { patients, loading, error, term, setTerm, offline, timeout };
}

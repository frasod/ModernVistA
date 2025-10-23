import { useState, useEffect } from 'react';
import { searchPatients, checkConnectivity, type Patient } from '../../services/patients';

interface PatientResult extends Patient {}

export function PatientSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PatientResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isOnline, setIsOnline] = useState(true);
  const [hasTimeout, setHasTimeout] = useState(false);

  // Check connectivity on mount
  useEffect(() => {
    checkConnectivity().then(setIsOnline);
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || query.length < 2) return;
    
    setLoading(true);
    setError('');
    setHasTimeout(false);

    try {
      const result = await searchPatients(query);
      
      if (result.data) {
        setResults(result.data);
      }
      
      if (result.error) {
        setError(result.error);
      }
      
      if (result.timeout) {
        setHasTimeout(true);
      }
      
      if (result.offline) {
        setIsOnline(false);
      }
    } catch (error: any) {
      setError(`Search failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Auto-search as user types (debounced)
  useEffect(() => {
    if (query.length >= 2) {
      const timeoutId = setTimeout(() => {
        handleSearch({ preventDefault: () => {} } as React.FormEvent);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
      setError('');
    }
  }, [query]);

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-brand-200">Patient Lookup</h1>
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-yellow-400'}`} />
          <span className="text-brand-400">
            {isOnline ? 'Online' : hasTimeout ? 'Timeout' : 'Offline'}
          </span>
        </div>
      </div>
      
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          className="flex-1 px-3 py-2 rounded bg-brand-800 border border-brand-700 focus:outline-none focus:ring focus:ring-brand-500/40 placeholder:text-brand-500 text-sm"
          placeholder="Search patient by name (min 2 characters)..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 transition text-sm rounded font-medium"
          disabled={loading || query.length < 2}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-900/20 border border-red-800 text-red-200 text-sm">
          {error}
        </div>
      )}
      <ul className="space-y-2">
        {results.map(r => (
          <li key={r.id} className="p-3 bg-brand-800 rounded border border-brand-700 hover:border-brand-500 transition">
            <div className="text-sm font-medium text-brand-100">{r.name}</div>
            <div className="text-xs text-brand-500">DOB: {r.dob}</div>
          </li>
        ))}
        {!loading && results.length === 0 && query && (
          <li className="text-xs text-brand-500">No matches.</li>
        )}
      </ul>
    </div>
  );
}

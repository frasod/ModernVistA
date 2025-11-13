import React from 'react';
import { usePatientSearch } from '../hooks/usePatientSearch';
import { useRpcActivity } from '../context/RpcActivityContext';
import { Patient } from '../services/patients';

interface PatientSearchProps {
  onSelect?: (p: Patient) => void;
  selectedId?: string | null;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({ onSelect, selectedId }) => {
  const { term, setTerm, patients, loading, error, offline, timeout } = usePatientSearch(350);
  const { log } = useRpcActivity();

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Patient Search</label>
        <input
          value={term}
          onChange={e => setTerm(e.target.value)}
          placeholder="Name (DOE), First,Last (DOE,JOHN), or VA format (D1234)"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
        />
        <div className="text-xs text-gray-500 mt-1">
          Supports: Last name • First,Last • VA format (Last initial + last 4 SSN, e.g., "S5463")
        </div>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {offline && <div className="text-xs text-yellow-700">Offline mode (showing cached/mock data)</div>}
      {timeout && <div className="text-xs text-orange-600">Request timed out (showing fallback)</div>}

      {loading ? (
        <table className="min-w-full text-sm border animate-pulse" aria-hidden="true">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-1 text-left">ID</th>
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">Gender</th>
              <th className="px-2 py-1 text-left">DOB</th>
              <th className="px-2 py-1 text-left">SSN/ICN</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="even:bg-gray-50">
                <td className="px-2 py-1"><div className="h-3 bg-gray-200 rounded w-10" /></td>
                <td className="px-2 py-1"><div className="h-3 bg-gray-200 rounded w-32" /></td>
                <td className="px-2 py-1"><div className="h-3 bg-gray-200 rounded w-8" /></td>
                <td className="px-2 py-1"><div className="h-3 bg-gray-200 rounded w-20" /></td>
                <td className="px-2 py-1"><div className="h-3 bg-gray-200 rounded w-16" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : patients.length > 0 ? (
        <table className="min-w-full text-sm border" role="table" aria-label="Patient search results">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-2 py-1 text-left">ID</th>
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">Gender</th>
              <th className="px-2 py-1 text-left">DOB</th>
              <th className="px-2 py-1 text-left">SSN/ICN</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => {
              const selected = p.id === selectedId;
              const displaySSN = p.ssnLast4 ? `***-**-${p.ssnLast4}` : (p.icn || '-');
              return (
                <tr
                  key={p.id}
                  tabIndex={0}
                  aria-selected={selected}
                  className={`even:bg-gray-50 hover:bg-blue-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${selected ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                  onClick={() => { onSelect?.(p); log({ endpoint: '/api/v1/patients-search', rpcName: 'ORWPT LIST', event: 'select', durationMs: 0 }); }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(p); log({ endpoint: '/api/v1/patients-search', rpcName: 'ORWPT LIST', event: 'select', durationMs: 0 }); } }}
                >
                  <td className="px-2 py-1 font-mono text-xs">{p.id}</td>
                  <td className="px-2 py-1">{p.lastName && p.firstName ? `${p.lastName}, ${p.firstName}` : p.name}</td>
                  <td className="px-2 py-1">{p.gender || '-'}</td>
                  <td className="px-2 py-1">{p.dobIso || p.dob || '-'}</td>
                  <td className="px-2 py-1 font-mono text-xs">{displaySSN}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : term.length >= 2 && !error ? (
        <div className="text-sm text-gray-500">No patients found.</div>
      ) : null}
    </div>
  );
};

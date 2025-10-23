import { useState } from 'react';
import { MinimalShell } from '../../components/layout/MinimalShell';
import { Route, Routes } from 'react-router-dom';
import { PatientSearch } from '../../components/PatientSearch';
import { PatientExplorer } from '../../components/PatientExplorer';
import type { Patient } from '../../services/patients';

export default function App() {
  const [selected, setSelected] = useState<Patient | null>(null);
  return (
    <MinimalShell>
      <Routes>
        <Route path="/" element={
          <div className="grid grid-cols-2 gap-6 p-6 max-w-7xl mx-auto">
            <div className="border rounded bg-white shadow-sm"><PatientSearch onSelect={p => setSelected(p)} selectedId={selected?.id || null} /></div>
            <PatientExplorer patient={selected} />
          </div>
        } />
      </Routes>
    </MinimalShell>
  );
}
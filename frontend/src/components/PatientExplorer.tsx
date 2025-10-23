import React, { useState, useEffect, useMemo } from 'react';
import { Patient, getLabs, getMedications, getVitals, getAllergies, LabResult, Medication, VitalSign, Allergy } from '../services/patients';
import { useRpcActivity } from '../context/RpcActivityContext';

interface Props {
  patient: Patient | null;
}

export const PatientExplorer: React.FC<Props> = ({ patient }) => {
  const { items, clear, log } = useRpcActivity() as any;
  const [activeTab, setActiveTab] = useState<'summary' | 'labs' | 'meds' | 'vitals' | 'allergies'>('summary');
  const [labs, setLabs] = useState<LabResult[] | null>(null);
  const [meds, setMeds] = useState<Medication[] | null>(null);
  const [vitals, setVitals] = useState<VitalSign[] | null>(null);
  const [allergies, setAllergies] = useState<Allergy[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState('');

  // Fetch data when tab changes
  useEffect(() => {
  if (!patient) { setLabs(null); setMeds(null); setVitals(null); setAllergies(null); setError(null); setLoading(false); return; }
    const pid = patient.id;
    const run = async () => {
      if (activeTab === 'labs' && labs === null) {
        setLoading(true); setError(null);
        const res = await getLabs(pid, info => log({ endpoint: `/api/v1/labs/${pid}`, status: info.status, durationMs: info.durationMs, rpcName: info.rpcName, error: info.error }));
        if (res.data) setLabs(res.data); else setError(res.error || 'Failed to load labs');
        setLoading(false);
      } else if (activeTab === 'meds' && meds === null) {
        setLoading(true); setError(null);
        const res = await getMedications(pid, info => log({ endpoint: `/api/v1/meds/${pid}`, status: info.status, durationMs: info.durationMs, rpcName: info.rpcName, error: info.error }));
        if (res.data) setMeds(res.data); else setError(res.error || 'Failed to load meds');
        setLoading(false);
      } else if (activeTab === 'vitals' && vitals === null) {
        setLoading(true); setError(null);
        const res = await getVitals(pid, info => log({ endpoint: `/api/v1/vitals/${pid}`, status: info.status, durationMs: info.durationMs, rpcName: info.rpcName, error: info.error }));
        if (res.data) setVitals(res.data); else setError(res.error || 'Failed to load vitals');
        setLoading(false);
      } else if (activeTab === 'allergies' && allergies === null) {
        setLoading(true); setError(null);
        const res = await getAllergies(pid, info => log({ endpoint: `/api/v1/allergies/${pid}`, status: info.status, durationMs: info.durationMs, rpcName: info.rpcName, error: info.error }));
        if (res.data) setAllergies(res.data); else setError(res.error || 'Failed to load allergies');
        setLoading(false);
      }
    };
    run();
  }, [activeTab, patient?.id]);

  useEffect(() => { setActiveTab('summary'); }, [patient?.id]);

  return (
    <div className="border rounded p-4 space-y-4 bg-white shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Patient Explorer</h2>
        {patient && <span className="text-sm text-gray-600">Selected: {patient.lastName ? `${patient.lastName}, ${patient.firstName}` : patient.name}</span>}
      </div>
      {!patient && <div className="text-sm text-gray-500">Select a patient to view details.</div>}
      {patient && (
        <>
          <div className="flex gap-2 text-sm" role="tablist" aria-label="Patient data sections">
            {['summary','labs','meds','vitals','allergies'].map(tab => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab===tab}
                aria-controls={`pane-${tab}`}
                id={`tab-${tab}`}
                className={`px-3 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${activeTab===tab?'bg-blue-600 text-white':'bg-gray-50 hover:bg-gray-100'}`}
                onClick={()=>setActiveTab(tab as any)}
              >{tab}</button>
            ))}
          </div>
          <div className="min-h-[120px] text-sm" aria-live="polite">
            {activeTab==='summary' && (
              <div id="pane-summary" role="tabpanel" aria-labelledby="tab-summary" className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div><span className="font-medium">ID:</span> {patient.id}</div>
                <div><span className="font-medium">Name:</span> {patient.name}</div>
                <div><span className="font-medium">DOB:</span> {patient.dobIso || patient.dob}</div>
                <div><span className="font-medium">Gender:</span> {patient.gender || '-'}</div>
              </div>
            )}
            {activeTab==='labs' && (
              <div id="pane-labs" role="tabpanel" aria-labelledby="tab-labs">
                {loading && <div className="text-sm text-blue-600">Loading labs...</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && !error && labs && labs.length === 0 && <div className="text-sm text-gray-500">No labs.</div>}
                {!loading && !error && labs && labs.length > 0 && (
                  <table className="w-full text-xs border rounded-sm bg-white shadow-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Test</th>
                        <th className="px-2 py-1 text-left">Value</th>
                        <th className="px-2 py-1 text-left">Collected</th>
                        <th className="px-2 py-1 text-left">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labs.map(l => (
                        <tr key={l.id} className="odd:bg-white even:bg-gray-50">
                          <td className="px-2 py-1">{l.test}</td>
                          <td className="px-2 py-1">{l.value}</td>
                          <td className="px-2 py-1 whitespace-nowrap">{l.collected}</td>
                          <td className="px-2 py-1">{l.flag || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            {activeTab==='meds' && (
              <div id="pane-meds" role="tabpanel" aria-labelledby="tab-meds">
                {loading && <div className="text-sm text-blue-600">Loading medications...</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && !error && meds && meds.length === 0 && <div className="text-sm text-gray-500">No medications.</div>}
                {!loading && !error && meds && meds.length > 0 && (
                  <table className="w-full text-xs border rounded-sm bg-white shadow-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Name</th>
                        <th className="px-2 py-1 text-left">Dose</th>
                        <th className="px-2 py-1 text-left">Status</th>
                        <th className="px-2 py-1 text-left">Start</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meds.map(m => (
                        <tr key={m.id} className="odd:bg-white even:bg-gray-50">
                          <td className="px-2 py-1">{m.name}</td>
                          <td className="px-2 py-1">{m.dose || '-'}</td>
                          <td className="px-2 py-1">{m.status || '-'}</td>
                          <td className="px-2 py-1 whitespace-nowrap">{m.start || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            {activeTab==='vitals' && (
              <div id="pane-vitals" role="tabpanel" aria-labelledby="tab-vitals">
                {loading && <div className="text-sm text-blue-600">Loading vitals...</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && !error && vitals && vitals.length === 0 && <div className="text-sm text-gray-500">No vitals.</div>}
                {!loading && !error && vitals && vitals.length > 0 && (
                  <table className="w-full text-xs border rounded-sm bg-white shadow-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Type</th>
                        <th className="px-2 py-1 text-left">Value</th>
                        <th className="px-2 py-1 text-left">Observed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vitals.map(v => (
                        <tr key={v.id} className="odd:bg-white even:bg-gray-50">
                          <td className="px-2 py-1">{v.type}</td>
                          <td className="px-2 py-1">{v.value}{v.unit?` ${v.unit}`:''}</td>
                          <td className="px-2 py-1 whitespace-nowrap">{v.observed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            {activeTab==='allergies' && (
              <div id="pane-allergies" role="tabpanel" aria-labelledby="tab-allergies">
                {loading && <div className="text-sm text-blue-600">Loading allergies...</div>}
                {error && <div className="text-sm text-red-600">{error}</div>}
                {!loading && !error && allergies && allergies.length === 0 && <div className="text-sm text-gray-500">No known allergies.</div>}
                {!loading && !error && allergies && allergies.length > 0 && (
                  <table className="w-full text-xs border rounded-sm bg-white shadow-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-1 text-left">Allergen</th>
                        <th className="px-2 py-1 text-left">Reaction</th>
                        <th className="px-2 py-1 text-left">Severity</th>
                        <th className="px-2 py-1 text-left">Type</th>
                        <th className="px-2 py-1 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allergies.map(a => {
                        const severityClass = a.severity === 'Severe' ? 'text-red-600 font-semibold' : 
                                            a.severity === 'Moderate' ? 'text-orange-600' : 'text-gray-600';
                        return (
                          <tr key={a.id} className="odd:bg-white even:bg-gray-50">
                            <td className="px-2 py-1 font-medium">{a.allergen}</td>
                            <td className="px-2 py-1">{a.reaction}</td>
                            <td className={`px-2 py-1 ${severityClass}`}>{a.severity}</td>
                            <td className="px-2 py-1">{a.type}</td>
                            <td className="px-2 py-1">
                              <span className={`px-1 rounded text-[10px] ${a.status === 'Active' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <h3 className="font-medium">Recent RPC Activity</h3>
              <input
                value={activityFilter}
                onChange={e=>setActivityFilter(e.target.value)}
                placeholder="filter..."
                className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring"
              />
              <button onClick={clear} className="text-xs text-blue-600 hover:underline">Clear</button>
            </div>
            <div className="max-h-48 overflow-auto border rounded text-xs" role="region" aria-label="Recent RPC activity log">
              <table className="w-full" role="table" aria-describedby="activity-legend">
                <thead className="bg-gray-50" role="rowgroup">
                  <tr>
                    <th className="px-2 py-1 text-left">Time</th>
                    <th className="px-2 py-1 text-left">Endpoint</th>
                    <th className="px-2 py-1 text-left">RPC</th>
                    <th className="px-2 py-1 text-left">Status/Event</th>
                    <th className="px-2 py-1 text-left">ms</th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {items.filter((i:any)=>{
                    if(!activityFilter) return true;
                    const q = activityFilter.toLowerCase();
                    return (i.endpoint||'').toLowerCase().includes(q) || (i.rpcName||'').toLowerCase().includes(q) || (i.event||'').toLowerCase().includes(q);
                  }).slice(0,50).map((i: any) => {
                    const statusClass = i.error ? 'bg-red-100 text-red-700' : (i.statusCode && i.statusCode >=400 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700');
                    let durationClass = '';
                    if (i.durationMs >= 1500) durationClass = 'text-red-600 font-semibold';
                    else if (i.durationMs >= 750) durationClass = 'text-orange-600 font-medium';
                    else if (i.durationMs >= 300) durationClass = 'text-yellow-600';
                    const rel = formatRelativeTime(i.timestamp);
                    return (
                    <tr key={i.id} className="odd:bg-white even:bg-gray-50">
                      <td className="px-2 py-1 whitespace-nowrap" title={new Date(i.timestamp).toISOString()}>{rel}</td>
                      <td className="px-2 py-1">{i.endpoint}</td>
                      <td className="px-2 py-1 font-mono">{i.rpcName || '-'}</td>
                      <td className="px-2 py-1">
                        {i.error && <span className="px-1 rounded bg-red-200 text-red-800 text-[10px] mr-1">error</span>}
                        {i.event && <span className="px-1 rounded bg-blue-200 text-blue-800 text-[10px] mr-1">{i.event}</span>}
                        {i.statusCode !== undefined && <span className={`px-1 rounded text-[10px] ${statusClass}`}>{i.statusCode}</span>}
                        {!i.event && i.statusCode===undefined && !i.error && <span className="text-gray-400">-</span>}
                      </td>
                      <td className={`px-2 py-1 ${durationClass}`}>{i.durationMs}</td>
                    </tr>
                  )})}
                  {items.length===0 && <tr><td colSpan={5} className="px-2 py-4 text-center text-gray-400">No RPC activity yet</td></tr>}
                </tbody>
              </table>
            </div>
            <div id="activity-legend" className="mt-2 flex flex-wrap gap-3 text-[10px] text-gray-600">
              <div><span className="inline-block w-2 h-2 bg-yellow-500 rounded mr-1 align-middle"></span>&ge;300ms</div>
              <div><span className="inline-block w-2 h-2 bg-orange-600 rounded mr-1 align-middle"></span>&ge;750ms</div>
              <div><span className="inline-block w-2 h-2 bg-red-600 rounded mr-1 align-middle"></span>&ge;1500ms</div>
              <div className="text-gray-400">(Latency severity thresholds)</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Relative time utility (simple, avoids external deps)
function formatRelativeTime(ts: number): string {
  const now = Date.now();
  let diff = now - ts; // ms
  const future = diff < 0;
  diff = Math.abs(diff);
  const sec = Math.floor(diff / 1000);
  if (sec < 1) return future ? 'in <1s' : '<1s ago';
  if (sec < 60) return future ? `in ${sec}s` : `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return future ? `in ${min}m` : `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return future ? `in ${hr}h` : `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return future ? `in ${day}d` : `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 4) return future ? `in ${wk}w` : `${wk}w ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return future ? `in ${mo}mo` : `${mo}mo ago`;
  const yr = Math.floor(day / 365);
  return future ? `in ${yr}y` : `${yr}y ago`;
}

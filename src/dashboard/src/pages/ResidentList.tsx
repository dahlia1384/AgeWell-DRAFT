import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Alert, Resident } from '../types';
import ResidentCard from '../components/ResidentCard';

export default function ResidentList() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [alerts, setAlerts]       = useState<Alert[]>([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      api.residents.list() as Promise<Resident[]>,
      api.alerts.list() as Promise<Alert[]>,
    ]).then(([r, a]) => {
      setResidents(r);
      setAlerts(a);
      setLoading(false);
    });
  }, []);

  const filtered = residents.filter(r => {
    const q = search.toLowerCase();
    return (
      r.first_name.toLowerCase().includes(q) ||
      r.last_name.toLowerCase().includes(q) ||
      r.room_number.toLowerCase().includes(q)
    );
  });

  const alertCount = (id: number) =>
    alerts.filter(a => a.resident_id === id && a.status !== 'resolved').length;

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Residents</h1>
        <span className="text-sm text-gray-500">{residents.length} active</span>
      </div>

      <input
        type="text"
        placeholder="Search by name or room..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No residents match your search.</p>
        ) : (
          filtered.map(r => (
            <ResidentCard key={r.id} resident={r} alertCount={alertCount(r.id)} />
          ))
        )}
      </div>
    </div>
  );
}

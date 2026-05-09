import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Resident, Alert } from '../types';
import StatCard from '../components/StatCard';
import AlertCard from '../components/AlertCard';
import ResidentCard from '../components/ResidentCard';

export default function Dashboard() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [alerts, setAlerts]       = useState<Alert[]>([]);
  const [loading, setLoading]     = useState(true);

  const load = async () => {
    const [r, a] = await Promise.all([
      api.residents.list() as Promise<Resident[]>,
      api.alerts.list({ status: 'open' }) as Promise<Alert[]>,
    ]);
    setResidents(r);
    setAlerts(a);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const today = new Date().toLocaleDateString('en-CA');
  const openAlerts     = alerts.filter(a => a.status === 'open');
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');

  if (loading) {
    return <div className="p-8 text-gray-400">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good morning</h1>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Residents" value={residents.length} sub="active" />
        <StatCard label="Open Alerts" value={openAlerts.length} color={openAlerts.length > 0 ? 'amber' : 'green'} sub="need attention" />
        <StatCard label="Critical / High" value={criticalAlerts.length} color={criticalAlerts.length > 0 ? 'red' : 'green'} />
        <StatCard label="Today" value={today} sub="data entry day" />
      </div>

      {openAlerts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Open Alerts</h2>
            <Link to="/alerts" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {openAlerts.slice(0, 5).map(a => (
              <AlertCard key={a.id} alert={a} onUpdate={load} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">Residents</h2>
          <Link to="/residents" className="text-sm text-brand-600 hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {residents.slice(0, 6).map(r => (
            <ResidentCard key={r.id} resident={r} alertCount={alerts.filter(a => a.resident_id === r.id && a.status !== 'resolved').length} />
          ))}
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Alert } from '../types';
import AlertCard from '../components/AlertCard';

type StatusFilter = 'all' | 'open' | 'acknowledged' | 'resolved';

export default function AlertsFeed() {
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [filter, setFilter]   = useState<StatusFilter>('open');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const params = filter === 'all' ? {} : { status: filter };
    const data = (await api.alerts.list(params)) as Alert[];
    setAlerts(data);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [filter]);

  const tabs: StatusFilter[] = ['open', 'acknowledged', 'resolved', 'all'];

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`pb-2 px-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              filter === t
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : alerts.length === 0 ? (
        <p className="text-gray-400 text-sm py-6 text-center">No {filter === 'all' ? '' : filter} alerts.</p>
      ) : (
        <div className="space-y-3">
          {alerts.map(a => (
            <AlertCard key={a.id} alert={a} onUpdate={load} />
          ))}
        </div>
      )}
    </div>
  );
}

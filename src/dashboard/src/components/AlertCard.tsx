import { Alert } from '../types';
import { api } from '../api/client';

interface Props {
  alert: Alert;
  onUpdate: () => void;
}

const severityStyle: Record<string, string> = {
  low:      'bg-blue-100 text-blue-800',
  medium:   'bg-amber-100 text-amber-800',
  high:     'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusStyle: Record<string, string> = {
  open:         'text-red-600 font-semibold',
  acknowledged: 'text-amber-600 font-semibold',
  resolved:     'text-green-600',
};

export default function AlertCard({ alert, onUpdate }: Props) {
  const residentName = alert.first_name
    ? `${alert.first_name} ${alert.last_name} · Rm ${alert.room_number}`
    : `Resident #${alert.resident_id}`;

  const handleAck = async () => {
    await api.alerts.acknowledge(alert.id);
    onUpdate();
  };

  const handleResolve = async () => {
    const notes = prompt('Resolution notes (optional):') ?? undefined;
    await api.alerts.resolve(alert.id, undefined, notes);
    onUpdate();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${severityStyle[alert.severity]}`}>
              {alert.severity.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500 capitalize">{alert.category}</span>
            <span className={`text-xs ${statusStyle[alert.status]}`}>{alert.status}</span>
          </div>
          <p className="text-sm text-gray-800 mt-1">{alert.message}</p>
          <p className="text-xs text-gray-400 mt-1">
            {residentName} · {new Date(alert.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {alert.status !== 'resolved' && (
        <div className="flex gap-2 mt-1">
          {alert.status === 'open' && (
            <button
              onClick={handleAck}
              className="text-xs px-3 py-1 rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              Acknowledge
            </button>
          )}
          <button
            onClick={handleResolve}
            className="text-xs px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
          >
            Resolve
          </button>
        </div>
      )}
    </div>
  );
}

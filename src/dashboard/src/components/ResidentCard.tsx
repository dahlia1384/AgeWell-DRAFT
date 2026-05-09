import { Link } from 'react-router-dom';
import { Resident } from '../types';

interface Props {
  resident: Resident;
  alertCount?: number;
}

function age(dob: string): number {
  const d = new Date(dob);
  const today = new Date();
  let a = today.getFullYear() - d.getFullYear();
  if (today < new Date(today.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a;
}

export default function ResidentCard({ resident, alertCount = 0 }: Props) {
  const initials = `${resident.first_name[0]}${resident.last_name[0]}`;

  return (
    <Link to={`/residents/${resident.id}`} className="block">
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:border-brand-500 hover:shadow-sm transition-all flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 truncate">
              {resident.first_name} {resident.last_name}
            </p>
            {alertCount > 0 && (
              <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                {alertCount}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Room {resident.room_number} · Age {age(resident.date_of_birth)}</p>
          {resident.diagnoses.length > 0 && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{resident.diagnoses.slice(0, 2).join(', ')}</p>
          )}
        </div>
        <span className="text-gray-300 text-lg">›</span>
      </div>
    </Link>
  );
}

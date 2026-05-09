interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'default' | 'amber' | 'red' | 'green';
}

const colorMap = {
  default: 'bg-white border-gray-200',
  amber:   'bg-amber-50 border-amber-200',
  red:     'bg-red-50 border-red-200',
  green:   'bg-green-50 border-green-200',
};

const valueColorMap = {
  default: 'text-gray-900',
  amber:   'text-amber-700',
  red:     'text-red-700',
  green:   'text-green-700',
};

export default function StatCard({ label, value, sub, color = 'default' }: Props) {
  return (
    <div className={`rounded-xl border p-5 ${colorMap[color]}`}>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${valueColorMap[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

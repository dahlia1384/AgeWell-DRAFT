import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard',  icon: '▦' },
  { to: '/residents', label: 'Residents',  icon: '♾' },
  { to: '/alerts',    label: 'Alerts',     icon: '⚑' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-brand-700 flex flex-col shrink-0">
      <div className="px-5 py-6">
        <span className="text-white font-bold text-lg tracking-tight">AgeWell</span>
        <p className="text-brand-100 text-xs mt-0.5">Staff Dashboard</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-brand-100 hover:bg-brand-600 hover:text-white'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-brand-600">
        <p className="text-brand-100 text-xs">Sunrise Care Home</p>
        <p className="text-white text-sm font-medium">Dr. Sarah Chen</p>
      </div>
    </aside>
  );
}

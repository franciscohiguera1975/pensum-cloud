import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/auth.store';

const links = [
  { to: '/', label: 'Inicio', icon: '🏠', end: true },
  { to: '/datos', label: 'Datos', icon: '🏛️' },
  { to: '/pensum', label: 'Visor Pensum', icon: '📊' },
  { to: '/usuarios', label: 'Usuarios', icon: '👥' },
  { to: '/public', label: 'Vista Pública', icon: '🌐' },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="w-56 bg-indigo-900 text-white flex flex-col shrink-0 h-full">
      <div className="px-4 py-5 border-b border-indigo-800">
        <p className="font-bold text-base tracking-tight">Pensum Cloud</p>
        <p className="text-xs text-indigo-300 mt-0.5">Gestión curricular</p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {links.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-indigo-800">
        <p className="text-xs text-indigo-300 truncate mb-2">{user?.email}</p>
        <button
          onClick={logout}
          className="w-full text-xs text-left text-red-300 hover:text-red-100 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

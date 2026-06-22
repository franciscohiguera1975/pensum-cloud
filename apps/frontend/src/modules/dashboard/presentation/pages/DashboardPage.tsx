import { Link } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/auth.store';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Bienvenido, {user?.firstName ?? user?.email}
      </h1>
      <p className="text-gray-500 mb-8 text-sm">Panel de gestión curricular</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/datos"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="text-3xl mb-3">🏛️</div>
          <h2 className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
            Gestión de Datos
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Administra universidades, facultades, carreras y pensums.
          </p>
        </Link>

        <Link
          to="/pensum"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="text-3xl mb-3">📊</div>
          <h2 className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
            Visor de Pensum
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Visualiza el mapa curricular en 2D (React Flow) o 3D (Three.js).
          </p>
        </Link>

        <Link
          to="/usuarios"
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <div className="text-3xl mb-3">👥</div>
          <h2 className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
            Usuarios
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestiona los usuarios y sus roles en el sistema.
          </p>
        </Link>
      </div>
    </div>
  );
}

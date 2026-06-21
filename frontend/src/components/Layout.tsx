import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded-md transition-colors ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-gray-800">PFE Queue App</div>
        <nav className="flex-1 p-4 space-y-2">
          <NavLink to="/dashboard" end className={navLinkClass}>Dashboard</NavLink>
          <NavLink to="/dashboard/services" className={navLinkClass}>Services</NavLink>
          <NavLink to="/dashboard/appointments" className={navLinkClass}>Appointments</NavLink>
          <NavLink to="/dashboard/queue" className={navLinkClass}>Queue</NavLink>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400 mb-2">Logged in as</div>
          <div className="font-medium truncate">{user?.email}</div>
          <button onClick={handleLogout} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md text-sm transition-colors">Logout</button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
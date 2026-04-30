import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, User, Shield, Users } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isSystemAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <Link to="/" className="text-2xl font-bold text-primary">TaskFlow</Link>
          <p className="text-xs text-gray-500 mt-1">Project Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-primary transition-colors">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link to="/projects" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-primary transition-colors">
            <FolderKanban size={20} /> Projects
          </Link>
          {isSystemAdmin && (
            <Link to="/users" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-primary transition-colors">
              <Users size={20} /> Users
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isSystemAdmin ? 'bg-amber-100' : 'bg-primary/10'}`}>
              {isSystemAdmin ? <Shield size={18} className="text-amber-600" /> : <User size={18} className="text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className={`text-xs flex items-center gap-1 ${isSystemAdmin ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                {isSystemAdmin && <Shield size={10} />}
                {user?.role}
              </p>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-danger transition-colors" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { usersAPI, projectAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Shield, FolderKanban, Mail, ArrowRight } from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.role !== 'admin') { navigate('/'); return; }
    Promise.all([usersAPI.list(), projectAPI.listAll()])
      .then(([userData, projData]) => {
        setUsers(userData.users);
        setAllProjects(projData.projects);
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Shield size={24} className="text-amber-500" /> Admin Panel</h1>
        <p className="text-gray-500 mt-1">Manage users and view all projects across the system</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Users ({users.length})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.role === 'admin' ? 'bg-amber-100' : 'bg-primary/10'}`}>
                  {u.role === 'admin' ? <Shield size={18} className="text-amber-600" /> : <User size={18} className="text-primary" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{u.name} {u.id === currentUser.id && <span className="text-xs text-gray-400">(you)</span>}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} /> {u.email}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                {u.role === 'admin' ? 'System Admin' : 'Member'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Projects ({allProjects.length})</h2>
          <p className="text-xs text-gray-500 mt-0.5">System admins can see all projects, even ones they haven't joined</p>
        </div>
        {allProjects.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No projects yet</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {allProjects.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">Created by {p.creator_name} &middot; {p.task_count} tasks &middot; {p.member_count} members</p>
                </div>
                <button onClick={() => navigate(`/projects/${p.id}`)} className="text-sm text-primary hover:underline flex items-center gap-1">
                  View <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { dashboardAPI } from '../api';
import { FolderKanban, ListTodo, CheckCircle2, Clock, AlertTriangle, UserCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const s = data?.stats || {};

  const statCards = [
    { label: 'Projects', value: s.projects, icon: FolderKanban, color: 'bg-indigo-50 text-primary', link: '/projects' },
    { label: 'Total Tasks', value: s.totalTasks, icon: ListTodo, color: 'bg-blue-50 text-info' },
    { label: 'Completed', value: s.done, icon: CheckCircle2, color: 'bg-green-50 text-success' },
    { label: 'In Progress', value: s.inProgress, icon: Clock, color: 'bg-amber-50 text-warning' },
    { label: 'Overdue', value: s.overdue, icon: AlertTriangle, color: 'bg-red-50 text-danger' },
    { label: 'My Tasks', value: s.myTasks, icon: UserCheck, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your projects and tasks</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(c => (
          <Link key={c.label} to={c.link || '#'} className={`rounded-xl p-4 ${c.color} hover:shadow-md transition-shadow ${!c.link ? 'cursor-default' : ''}`}>
            <c.icon size={22} className="mb-3" />
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs opacity-80 mt-0.5">{c.label}</p>
          </Link>
        ))}
      </div>

      {s.totalTasks > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Task Distribution</h3>
          <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
            {s.todo > 0 && <div className="bg-gray-400" style={{ width: `${(s.todo / s.totalTasks) * 100}%` }} title={`Todo: ${s.todo}`} />}
            {s.inProgress > 0 && <div className="bg-warning" style={{ width: `${(s.inProgress / s.totalTasks) * 100}%` }} title={`In Progress: ${s.inProgress}`} />}
            {s.done > 0 && <div className="bg-success" style={{ width: `${(s.done / s.totalTasks) * 100}%` }} title={`Done: ${s.done}`} />}
          </div>
          <div className="flex gap-6 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Todo ({s.todo})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning" /> In Progress ({s.inProgress})</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Done ({s.done})</span>
          </div>
        </div>
      )}

      {data?.overdueTasks?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-danger" /> Overdue Tasks</h3>
          <div className="space-y-3">
            {data.overdueTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-500">{t.project_name} &middot; Due: {t.due_date} &middot; {t.assigned_name || 'Unassigned'}</p>
                </div>
                <span className="text-xs bg-danger/10 text-danger px-2.5 py-1 rounded-full font-medium">Overdue</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.recentTasks?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Tasks</h3>
            <Link to="/projects" className="text-sm text-primary hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-3">
            {data.recentTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-500">{t.project_name} &middot; {t.assigned_name || 'Unassigned'}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${t.status === 'done' ? 'bg-green-100 text-success' : t.status === 'in_progress' ? 'bg-amber-100 text-warning' : 'bg-gray-100 text-gray-600'}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Plus, Users, Trash2, UserPlus, Shield, Edit3, X, Calendar, Flag, User, GripVertical, Clock, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', dot: 'bg-warning' },
  done: { label: 'Done', color: 'bg-green-100 text-green-700', dot: 'bg-success' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-blue-500' },
  medium: { label: 'Medium', color: 'text-amber-500' },
  high: { label: 'High', color: 'text-red-500' },
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [membership, setMembership] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '' });
  const [taskError, setTaskError] = useState('');
  const [taskActivities, setTaskActivities] = useState([]);

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const isAdmin = membership?.role === 'admin';

  const canEditTask = (task) => isAdmin || task.created_by === user?.id || task.assigned_to === user?.id;
  const canDeleteTask = (task) => isAdmin || task.created_by === user?.id || task.assigned_to === user?.id;
  const canChangeStatus = (task) => isAdmin || task.assigned_to === user?.id || task.created_by === user?.id;

  const fetchProject = async () => {
    try {
      const [projData, taskData] = await Promise.all([
        projectAPI.get(id),
        taskAPI.list(id),
      ]);
      setProject(projData.project);
      setMembers(projData.members);
      setMembership(projData.membership);
      setTasks(taskData.tasks);
    } catch (err) {
      if (err.message.includes('403') || err.message.includes('404')) navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskError('');
    try {
      await taskAPI.create(id, { ...taskForm, assigned_to: taskForm.assigned_to || null });
      setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '' });
      setShowTaskModal(false);
      fetchProject();
    } catch (err) { setTaskError(err.message); }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setTaskError('');
    try {
      await taskAPI.update(editingTask.id, { ...taskForm, assigned_to: taskForm.assigned_to || null });
      setEditingTask(null);
      setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '' });
      fetchProject();
    } catch (err) { setTaskError(err.message); }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await taskAPI.remove(taskId); fetchProject(); } catch {}
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try { await taskAPI.update(taskId, { status: newStatus }); fetchProject(); } catch {}
  };

  const openEditTask = async (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || '',
      assigned_to: task.assigned_to || '',
    });
    try {
      const data = await taskAPI.getActivities(task.id);
      setTaskActivities(data.activities);
    } catch {
      setTaskActivities([]);
    }
  };

  const openNewTask = () => {
    setEditingTask(null);
    setTaskActivities([]);
    setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '' });
    setShowTaskModal(true);
  };

  const handleSearchUsers = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const data = await projectAPI.searchUsers(id, q);
      setSearchResults(data.users);
    } catch {}
  };

  const handleAddMember = async (userId, role = 'member') => {
    try {
      await projectAPI.addMember(id, { userId, role });
      setSearchQuery('');
      setSearchResults([]);
      fetchProject();
    } catch (err) { alert(err.message); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try { await projectAPI.removeMember(id, userId); fetchProject(); } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!project) return null;

  const columns = ['todo', 'in_progress', 'done'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/projects')} className="p-2 hover:bg-gray-100 rounded-lg transition"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-gray-500 mt-0.5">{project.description || 'No description'}</p>
        </div>
        {isAdmin && (
          <button onClick={() => { if (confirm('Delete this project?')) { projectAPI.remove(id).then(() => navigate('/projects')); } }} className="p-2 text-gray-400 hover:text-danger transition" title="Delete project">
            <Trash2 size={20} />
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button onClick={() => setActiveTab('tasks')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${activeTab === 'tasks' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Tasks</button>
        <button onClick={() => setActiveTab('team')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${activeTab === 'team' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Team ({members.length})</button>
      </div>

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
            <button onClick={openNewTask} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition text-sm">
              <Plus size={16} /> Add Task
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {columns.map(status => {
              const colTasks = tasks.filter(t => t.status === status);
              const cfg = STATUS_CONFIG[status];
              return (
                <div key={status} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    <h3 className="font-semibold text-sm text-gray-700">{cfg.label}</h3>
                    <span className="text-xs text-gray-400 ml-auto">{colTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map(task => (
                      <div key={task.id} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">{task.title}</p>
                            {task.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>}
                          </div>
                          {canEditTask(task) && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button onClick={() => openEditTask(task)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"><Edit3 size={14} /></button>
                              {canDeleteTask(task) && (
                                <button onClick={() => handleDeleteTask(task.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-danger"><Trash2 size={14} /></button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className={`flex items-center gap-1 ${PRIORITY_CONFIG[task.priority]?.color}`}><Flag size={10} /> {task.priority}</span>
                          {task.due_date && <span className="flex items-center gap-1"><Calendar size={10} /> {task.due_date}</span>}
                          {task.assigned_name && <span className="flex items-center gap-1"><User size={10} /> {task.assigned_name}</span>}
                        </div>
                        {canChangeStatus(task) && status !== 'done' && (
                          <div className="flex gap-1 mt-2">
                            {status === 'todo' && <button onClick={() => handleStatusChange(task.id, 'in_progress')} className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded hover:bg-amber-100 transition">Start</button>}
                            {status === 'in_progress' && <button onClick={() => handleStatusChange(task.id, 'done')} className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded hover:bg-green-100 transition">Complete</button>}
                            <button onClick={() => handleStatusChange(task.id, 'todo')} className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition">Todo</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {colTasks.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No tasks</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <button onClick={() => setShowMemberModal(true)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition text-sm">
                <UserPlus size={16} /> Add Member
              </button>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${m.role === 'admin' ? 'bg-amber-100' : 'bg-primary/10'}`}>
                    {m.role === 'admin' ? <Shield size={18} className="text-amber-600" /> : <User size={18} className="text-primary" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{m.name} {m.id === user?.id && <span className="text-xs text-gray-400">(you)</span>}</p>
                    <p className="text-xs text-gray-500">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isAdmin && m.id !== user?.id ? (
                    <select
                      value={m.role}
                      onChange={async (e) => {
                        try {
                          await projectAPI.changeMemberRole(id, m.id, e.target.value);
                          fetchProject();
                        } catch (err) { alert(err.message); }
                      }}
                      className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${m.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                      {m.role === 'admin' && <Shield size={10} className="inline mr-1" />}{m.role === 'admin' ? 'Admin' : 'Member'}
                    </span>
                  )}
                  {isAdmin && m.id !== user?.id && (
                    <button onClick={() => handleRemoveMember(m.id)} className="p-1.5 text-gray-400 hover:text-danger transition rounded hover:bg-red-50"><X size={16} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(showTaskModal || editingTask) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setShowTaskModal(false); setEditingTask(null); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{editingTask ? 'Edit Task' : 'New Task'}</h2>
            {taskError && <div className="bg-red-50 text-danger text-sm rounded-lg px-4 py-3 mb-4">{taskError}</div>}
            <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" required minLength={2} value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To {isAdmin ? '' : <span className="text-gray-400 font-normal">(Admin only)</span>}</label>
                {isAdmin ? (
                  <select value={taskForm.assigned_to} onChange={e => setTaskForm(f => ({ ...f, assigned_to: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white">
                    <option value="">Unassigned</option>
                    {members.map(am => <option key={am.id} value={am.id}>{am.name} ({am.role})</option>)}
                  </select>
                ) : (
                  <p className="px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500">
                    {taskForm.assigned_to ? members.find(m => String(m.id) === String(taskForm.assigned_to))?.name || 'Assigned user' : 'Unassigned'}
                    <span className="block text-xs text-gray-400 mt-0.5">Only project admins can reassign tasks</span>
                  </p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowTaskModal(false); setEditingTask(null); }} className="flex-1 py-2.5 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition">{editingTask ? 'Update' : 'Create'}</button>
              </div>
            </form>
            {editingTask && taskActivities.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3"><Clock size={14} /> Progress History</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {taskActivities.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-700">
                          <span className="font-medium">{activity.user_name}</span> changed status from 
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs mx-1">{activity.old_value}</span> 
                          to 
                          <span className="px-1.5 py-0.5 bg-primary/10 rounded text-xs mx-1 text-primary">{activity.new_value}</span>
                        </p>
                        <p className="text-xs text-gray-400">{new Date(activity.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setShowMemberModal(false); setSearchQuery(''); setSearchResults([]); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Team Member</h2>
            <div className="relative mb-4">
              <input type="text" value={searchQuery} onChange={e => handleSearchUsers(e.target.value)} placeholder="Search by name or email..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div className="space-y-2 max-h-64 overflow-auto">
              {searchResults.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleAddMember(u.id, 'member')} className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 font-medium transition">Add as Member</button>
                    <button onClick={() => handleAddMember(u.id, 'admin')} className="text-xs px-3 py-1.5 bg-indigo-100 text-primary-dark rounded-lg hover:bg-indigo-200 font-medium transition">Add as Admin</button>
                  </div>
                </div>
              ))}
              {searchQuery.length >= 2 && searchResults.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No users found</p>}
              {searchQuery.length < 2 && <p className="text-sm text-gray-400 text-center py-4">Type at least 2 characters to search</p>}
            </div>
            <button onClick={() => { setShowMemberModal(false); setSearchQuery(''); setSearchResults([]); }} className="w-full mt-4 py-2.5 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

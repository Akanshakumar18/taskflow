const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const authAPI = {
  signup: (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
};

export const projectAPI = {
  list: () => request('/projects'),
  get: (id) => request(`/projects/${id}`),
  create: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  addMember: (projectId, body) => request(`/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify(body) }),
  removeMember: (projectId, userId) => request(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }),
  searchUsers: (projectId, q) => request(`/projects/${projectId}/search-users?q=${encodeURIComponent(q)}`),
};

export const taskAPI = {
  list: (projectId) => request(`/tasks/project/${projectId}`),
  create: (projectId, body) => request(`/tasks/project/${projectId}`, { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
};

export const dashboardAPI = {
  get: () => request('/dashboard'),
};

export const usersAPI = {
  list: () => request('/users'),
};

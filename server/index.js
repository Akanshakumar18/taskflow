const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { query, initDB } = require('./database');
const { auth, requireAdmin, requireProjectAdmin } = require('./middleware');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);

app.use('/api/users', auth, requireAdmin, async (req, res) => {
  if (req.method === 'GET') {
    try {
      const result = await query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
      res.json({ users: result.rows });
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Server error' });
    }
  } else if (req.method === 'DELETE') {
    const userId = req.query.id;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    if (String(userId) === String(req.user.id)) return res.status(400).json({ error: 'Cannot delete yourself' });
    try {
      await query('DELETE FROM project_members WHERE user_id = $1', [userId]);
      await query('DELETE FROM tasks WHERE created_by = $1 OR assigned_to = $1', [userId]);
      await query('DELETE FROM projects WHERE created_by = $1', [userId]);
      await query('DELETE FROM users WHERE id = $1', [userId]);
      res.json({ message: 'User deleted' });
    } catch (err) {
      console.error('Error deleting user:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`TaskFlow server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

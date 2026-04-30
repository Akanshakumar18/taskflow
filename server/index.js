const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { query, initDB } = require('./database');
const { auth } = require('./middleware');
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

app.use('/api/users', auth, async (req, res) => {
  try {
    const result = await query('SELECT id, name, email, role, created_at FROM users');
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
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

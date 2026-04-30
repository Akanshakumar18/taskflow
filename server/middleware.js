const jwt = require('jsonwebtoken');
const { query } = require('./database');
const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-secret-key-change-in-production';

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function requireProjectAdmin() {
  return async (req, res, next) => {
    const projectId = req.params.projectId || req.params.id;
    try {
      const result = await query('SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, req.user.id]);
      const member = result.rows[0];
      if (!member || member.role !== 'admin') {
        return res.status(403).json({ error: 'Project admin access required' });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  };
}

module.exports = { auth, requireAdmin, requireProjectAdmin };

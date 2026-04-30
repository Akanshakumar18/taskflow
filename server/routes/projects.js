const express = require('express');
const { query } = require('../database');
const { auth, requireProjectAdmin } = require('../middleware');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, u.name as creator_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count
      FROM projects p
      JOIN users u ON p.created_by = u.id
      WHERE p.id IN (SELECT project_id FROM project_members WHERE user_id = $1)
      ORDER BY p.created_at DESC
    `, [req.user.id]);
    res.json({ projects: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Project name must be at least 2 characters' });
    }
    const result = await query('INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *', [name.trim(), description || '', req.user.id]);
    const project = result.rows[0];
    await query('INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)', [project.id, req.user.id, 'admin']);
    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const projResult = await query(`
      SELECT p.*, u.name as creator_name FROM projects p
      JOIN users u ON p.created_by = u.id
      WHERE p.id = $1
    `, [req.params.id]);
    const project = projResult.rows[0];
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const memResult = await query('SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    const membership = memResult.rows[0];
    if (!membership) return res.status(403).json({ error: 'Not a project member' });

    const membersResult = await query(`
      SELECT pm.role, pm.joined_at, u.id, u.name, u.email
      FROM project_members pm JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1
    `, [req.params.id]);

    res.json({ project, membership, members: membersResult.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', requireProjectAdmin(), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Project name must be at least 2 characters' });
    }
    const existing = await query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Project not found' });
    const result = await query('UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *', [name.trim(), description || '', req.params.id]);
    res.json({ project: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', requireProjectAdmin(), async (req, res) => {
  try {
    const existing = await query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Project not found' });
    await query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/members', requireProjectAdmin(), async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });
    const userResult = await query('SELECT id, name, email, role FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const existing = await query('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.id, userId]);
    if (existing.rows.length) return res.status(409).json({ error: 'User already a member' });
    const memberRole = role === 'admin' ? 'admin' : 'member';
    await query('INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)', [req.params.id, userId, memberRole]);
    res.status(201).json({ member: { ...user, role: memberRole } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id/members/:userId', requireProjectAdmin(), async (req, res) => {
  try {
    const memResult = await query('SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.id, req.params.userId]);
    const membership = memResult.rows[0];
    if (!membership) return res.status(404).json({ error: 'Member not found' });
    const adminResult = await query("SELECT COUNT(*) as count FROM project_members WHERE project_id = $1 AND role = 'admin'", [req.params.id]);
    if (membership.role === 'admin' && parseInt(adminResult.rows[0].count) <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last admin' });
    }
    await query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.id, req.params.userId]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id/search-users', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json({ users: [] });
    const result = await query(`
      SELECT id, name, email, role FROM users
      WHERE (name ILIKE $1 OR email ILIKE $1)
      AND id NOT IN (SELECT user_id FROM project_members WHERE project_id = $2)
      LIMIT 10
    `, [`%${q.trim()}%`, req.params.id]);
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

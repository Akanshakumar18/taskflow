const express = require('express');
const { query } = require('../database');
const { auth } = require('../middleware');

const router = express.Router();

router.use(auth);

router.get('/project/:projectId', async (req, res) => {
  try {
    const memResult = await query('SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.projectId, req.user.id]);
    if (!memResult.rows.length) return res.status(403).json({ error: 'Not a project member' });

    const result = await query(`
      SELECT t.*, 
        u1.name as assigned_name, u1.email as assigned_email,
        u2.name as creator_name
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      JOIN users u2 ON t.created_by = u2.id
      WHERE t.project_id = $1
      ORDER BY t.created_at DESC
    `, [req.params.projectId]);
    res.json({ tasks: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/project/:projectId', async (req, res) => {
  try {
    const { title, description, status, priority, due_date, assigned_to } = req.body;
    if (!title || title.trim().length < 2) {
      return res.status(400).json({ error: 'Task title must be at least 2 characters' });
    }
    const memResult = await query('SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.projectId, req.user.id]);
    if (!memResult.rows.length) return res.status(403).json({ error: 'Not a project member' });

    if (assigned_to) {
      const assigneeResult = await query('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [req.params.projectId, assigned_to]);
      if (!assigneeResult.rows.length) return res.status(400).json({ error: 'Assignee is not a project member' });
    }

    const validStatus = ['todo', 'in_progress', 'done'].includes(status) ? status : 'todo';
    const validPriority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';

    const result = await query(
      'INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [title.trim(), description || '', validStatus, validPriority, due_date || null, req.params.projectId, assigned_to || null, req.user.id]
    );

    const taskResult = await query(`
      SELECT t.*, u1.name as assigned_name, u1.email as assigned_email, u2.name as creator_name
      FROM tasks t LEFT JOIN users u1 ON t.assigned_to = u1.id
      JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1
    `, [result.rows[0].id]);
    res.status(201).json({ task: taskResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    const task = taskResult.rows[0];
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const memResult = await query('SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2', [task.project_id, req.user.id]);
    if (!memResult.rows.length) return res.status(403).json({ error: 'Not a project member' });

    const { title, description, status, priority, due_date, assigned_to } = req.body;
    if (title !== undefined && title.trim().length < 2) {
      return res.status(400).json({ error: 'Task title must be at least 2 characters' });
    }

    if (assigned_to !== undefined && assigned_to !== null) {
      const assigneeResult = await query('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [task.project_id, assigned_to]);
      if (!assigneeResult.rows.length) return res.status(400).json({ error: 'Assignee is not a project member' });
    }

    const validStatus = ['todo', 'in_progress', 'done'].includes(status) ? status : task.status;
    const validPriority = ['low', 'medium', 'high'].includes(priority) ? priority : task.priority;

    await query(
      'UPDATE tasks SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, assigned_to = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7',
      [
        title !== undefined ? title.trim() : task.title,
        description !== undefined ? description : task.description,
        validStatus,
        validPriority,
        due_date !== undefined ? (due_date || null) : task.due_date,
        assigned_to !== undefined ? (assigned_to || null) : task.assigned_to,
        req.params.id
      ]
    );

    const updatedResult = await query(`
      SELECT t.*, u1.name as assigned_name, u1.email as assigned_email, u2.name as creator_name
      FROM tasks t LEFT JOIN users u1 ON t.assigned_to = u1.id
      JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = $1
    `, [req.params.id]);
    res.json({ task: updatedResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    const task = taskResult.rows[0];
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const memResult = await query('SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2', [task.project_id, req.user.id]);
    if (!memResult.rows.length) return res.status(403).json({ error: 'Not a project member' });
    await query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

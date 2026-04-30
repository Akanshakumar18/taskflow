const express = require('express');
const { query } = require('../database');
const { auth } = require('../middleware');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const projResult = await query(
      'SELECT COUNT(DISTINCT project_id) as count FROM project_members WHERE user_id = $1',
      [userId]
    );

    const statsResult = await query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN t.status = 'todo' THEN 1 END) as todo,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress,
        SUM(CASE WHEN t.status = 'done' THEN 1 END) as done,
        SUM(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'done' THEN 1 END) as overdue,
        SUM(CASE WHEN t.assigned_to = $1 THEN 1 END) as my_tasks,
        SUM(CASE WHEN t.assigned_to = $1 AND t.status != 'done' THEN 1 END) as my_pending
      FROM tasks t
      JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = $1
    `, [userId]);

    const overdueResult = await query(`
      SELECT t.*, p.name as project_name, u.name as assigned_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = $1
      WHERE t.due_date < CURRENT_DATE AND t.status != 'done'
      ORDER BY t.due_date ASC
      LIMIT 10
    `, [userId]);

    const recentResult = await query(`
      SELECT t.*, p.name as project_name, u.name as assigned_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      JOIN project_members pm ON t.project_id = pm.project_id AND pm.user_id = $1
      ORDER BY t.created_at DESC
      LIMIT 10
    `, [userId]);

    const s = statsResult.rows[0] || {};
    res.json({
      stats: {
        projects: parseInt(projResult.rows[0]?.count || 0),
        totalTasks: parseInt(s.total || 0),
        todo: parseInt(s.todo || 0),
        inProgress: parseInt(s.in_progress || 0),
        done: parseInt(s.done || 0),
        overdue: parseInt(s.overdue || 0),
        myTasks: parseInt(s.my_tasks || 0),
        myPending: parseInt(s.my_pending || 0),
      },
      overdueTasks: overdueResult.rows,
      recentTasks: recentResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

import { Router } from 'express';
import { db } from '../db/schema';
import { authMiddleware, employeeMiddleware } from '../middleware/auth';
import type { StatsRow } from '../types';

const router = Router();

// Apply auth and employee middleware
router.use(authMiddleware);
router.use(employeeMiddleware);

// Get all expenses
router.get('/', (req, res) => {
  try {
    const expenses = db.prepare(`
      SELECT e.*, u.full_name as recorded_by_name 
      FROM expenses e 
      LEFT JOIN users u ON e.recorded_by = u.id 
      ORDER BY e.date DESC, e.created_at DESC
    `).all();
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Get single expense
router.get('/:id', (req, res) => {
  try {
    const expense = db.prepare(`
      SELECT e.*, u.full_name as recorded_by_name 
      FROM expenses e 
      LEFT JOIN users u ON e.recorded_by = u.id 
      WHERE e.id = ?
    `).get(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// Create expense
router.post('/', (req, res) => {
  try {
    const { date, category, description, amount, paymentMethod, receiptNumber, notes } = req.body;
    
    if (!date || !category || !description || !amount) {
      return res.status(400).json({ error: 'Date, category, description, and amount are required' });
    }

    const result = db.prepare(`
      INSERT INTO expenses (date, category, description, amount, payment_method, receipt_number, notes, recorded_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(date, category, description, amount, paymentMethod || null, receiptNumber || null, notes || null, req.user!.userId);

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.put('/:id', (req, res) => {
  try {
    const { date, category, description, amount, paymentMethod, receiptNumber, notes } = req.body;
    
    db.prepare(`
      UPDATE expenses 
      SET date = ?, category = ?, description = ?, amount = ?, payment_method = ?, receipt_number = ?, notes = ?
      WHERE id = ?
    `).run(date, category, description, amount, paymentMethod, receiptNumber, notes, req.params.id);

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// Get expense categories summary
router.get('/stats/summary', (req, res) => {
  try {
    const totalExpenses = db.prepare('SELECT SUM(amount) as total FROM expenses').get() as StatsRow | undefined;
    const todayExpenses = db.prepare(`
      SELECT SUM(amount) as total 
      FROM expenses 
      WHERE date(date) = date('now')
    `).get() as StatsRow | undefined;
    const monthExpenses = db.prepare(`
      SELECT SUM(amount) as total 
      FROM expenses 
      WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `).get() as StatsRow | undefined;
    const byCategory = db.prepare(`
      SELECT category, SUM(amount) as total, COUNT(*) as count 
      FROM expenses 
      GROUP BY category 
      ORDER BY total DESC
    `).all();

    res.json({
      totalExpenses: totalExpenses?.total || 0,
      todayExpenses: todayExpenses?.total || 0,
      monthExpenses: monthExpenses?.total || 0,
      byCategory
    });
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    res.status(500).json({ error: 'Failed to fetch expense statistics' });
  }
});

export default router;

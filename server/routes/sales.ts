import { Router } from 'express';
import { db } from '../db/schema';
import { authMiddleware, employeeMiddleware } from '../middleware/auth';
import type { StatsRow, Sale } from '../types';

const router = Router();

// Apply auth and employee middleware
router.use(authMiddleware);
router.use(employeeMiddleware);

// Get all sales
router.get('/', (req, res) => {
  try {
    const sales = db.prepare(`
      SELECT s.*, c.name as customer_name, c.phone as customer_phone, u.full_name as recorded_by_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      LEFT JOIN users u ON s.recorded_by = u.id 
      ORDER BY s.sale_date DESC, s.created_at DESC
    `).all();
    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Get single sale
router.get('/:id', (req, res) => {
  try {
    const sale = db.prepare(`
      SELECT s.*, c.name as customer_name, c.phone as customer_phone, u.full_name as recorded_by_name 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      LEFT JOIN users u ON s.recorded_by = u.id 
      WHERE s.id = ?
    `).get(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
});

// Create sale
router.post('/', (req, res) => {
  try {
    const { customerId, saleDate, saleType, quantity, unitPrice, paymentStatus, paymentMethod, notes } = req.body;
    
    if (!customerId || !saleDate || !saleType || !quantity || !unitPrice) {
      return res.status(400).json({ error: 'Customer ID, sale date, sale type, quantity, and unit price are required' });
    }

    const totalAmount = quantity * unitPrice;

    const result = db.prepare(`
      INSERT INTO sales (customer_id, sale_date, sale_type, quantity, unit_price, total_amount, payment_status, payment_method, notes, recorded_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(customerId, saleDate, saleType, quantity, unitPrice, totalAmount, paymentStatus || 'pending', paymentMethod || null, notes || null, req.user!.userId);

    // Update customer's total purchases
    db.prepare(`
      UPDATE customers 
      SET total_purchases = total_purchases + ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(totalAmount, customerId);

    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(sale);
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Failed to create sale' });
  }
});

// Update sale
router.put('/:id', (req, res) => {
  try {
    const { paymentStatus, paymentMethod, notes } = req.body;
    
    db.prepare(`
      UPDATE sales 
      SET payment_status = ?, payment_method = ?, notes = ? 
      WHERE id = ?
    `).run(paymentStatus, paymentMethod, notes, req.params.id);

    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id);
    res.json(sale);
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({ error: 'Failed to update sale' });
  }
});

// Delete sale
router.delete('/:id', (req, res) => {
  try {
    // Get the sale first to update customer's total
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(req.params.id) as Sale | undefined;
    
    if (sale) {
      // Subtract from customer's total purchases
      db.prepare(`
        UPDATE customers 
        SET total_purchases = total_purchases - ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(sale.total_amount, sale.customer_id);
    }

    db.prepare('DELETE FROM sales WHERE id = ?').run(req.params.id);
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Failed to delete sale' });
  }
});

// Get sales summary/statistics
router.get('/stats/summary', (req, res) => {
  try {
    const totalSales = db.prepare('SELECT SUM(total_amount) as total FROM sales').get() as StatsRow | undefined;
    const todaySales = db.prepare(`
      SELECT SUM(total_amount) as total 
      FROM sales 
      WHERE date(sale_date) = date('now')
    `).get() as StatsRow | undefined;
    const monthSales = db.prepare(`
      SELECT SUM(total_amount) as total 
      FROM sales 
      WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', 'now')
    `).get() as StatsRow | undefined;
    const pendingPayments = db.prepare(`
      SELECT SUM(total_amount) as total 
      FROM sales 
      WHERE payment_status = 'pending'
    `).get() as StatsRow | undefined;
    const salesByType = db.prepare(`
      SELECT sale_type, SUM(total_amount) as total, COUNT(*) as count 
      FROM sales 
      GROUP BY sale_type
    `).all();

    res.json({
      totalSales: totalSales?.total || 0,
      todaySales: todaySales?.total || 0,
      monthSales: monthSales?.total || 0,
      pendingPayments: pendingPayments?.total || 0,
      salesByType
    });
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    res.status(500).json({ error: 'Failed to fetch sales statistics' });
  }
});

export default router;

import { Router } from 'express';
import { db } from '../db/schema';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all customers
router.get('/', (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT c.*, u.full_name as created_by_name 
      FROM customers c 
      LEFT JOIN users u ON c.created_by = u.id 
      ORDER BY c.created_at DESC
    `).all();
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer
router.get('/:id', (req, res) => {
  try {
    const customer = db.prepare(`
      SELECT c.*, u.full_name as created_by_name 
      FROM customers c 
      LEFT JOIN users u ON c.created_by = u.id 
      WHERE c.id = ?
    `).get(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer
router.post('/', (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const result = db.prepare(`
      INSERT INTO customers (name, email, phone, address, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, email || null, phone, address || null, notes || null, req.user!.userId);

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    
    db.prepare(`
      UPDATE customers 
      SET name = ?, email = ?, phone = ?, address = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(name, email, phone, address, notes, req.params.id);

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;

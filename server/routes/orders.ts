import { Router } from 'express';
import { db } from '../db/schema';
import { authMiddleware, employeeMiddleware } from '../middleware/auth';
import { sendOrderEmail } from '../services/email';

const router = Router();

interface OrderRow {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  delivery_address: string | null;
  order_items: string;
  total_amount: number;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// Generate a unique order number
function generateOrderNumber(): string {
  const prefix = 'CFM';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// PUBLIC: Place a new order (no auth required)
router.post('/', async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, deliveryAddress, items, notes } = req.body;

    if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Customer name, phone, and at least one item are required' });
    }

    // Validate items
    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ error: 'Each item must have a product and quantity >= 1' });
      }
    }

    // Calculate total
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * (item.unitPrice || 0)), 0);
    const orderNumber = generateOrderNumber();

    const result = db.prepare(`
      INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, delivery_address, order_items, total_amount, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')
    `).run(
      orderNumber,
      customerName,
      customerEmail || null,
      customerPhone,
      deliveryAddress || null,
      JSON.stringify(items),
      totalAmount,
      notes || null
    );

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid) as OrderRow;

    // Send email notification (non-blocking)
    try {
      // Get company email from settings
      const emailSetting = db.prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'email'").get() as { setting_value: string } | undefined;
      const companyEmail = emailSetting?.setting_value || 'info@countryfarm.ug';
      
      await sendOrderEmail(order, companyEmail);
    } catch (emailError) {
      console.error('Failed to send order email notification:', emailError);
      // Don't fail the order if email fails
    }

    res.status(201).json({ 
      message: 'Order placed successfully!', 
      orderNumber: order.order_number,
      order 
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// ADMIN: Get all orders
router.get('/', authMiddleware, employeeMiddleware, (req, res) => {
  try {
    const { status } = req.query;
    
    let query = 'SELECT * FROM orders';
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const orders = db.prepare(query).all(...params) as OrderRow[];
    
    // Parse order_items JSON for each order
    const ordersWithParsedItems = orders.map(o => ({
      ...o,
      order_items: JSON.parse(o.order_items),
    }));

    res.json(ordersWithParsedItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ADMIN: Get new order count
router.get('/count/new', authMiddleware, employeeMiddleware, (req, res) => {
  try {
    const result = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'new'").get() as { count: number };
    res.json({ count: result.count });
  } catch (error) {
    console.error('Error counting new orders:', error);
    res.status(500).json({ error: 'Failed to count new orders' });
  }
});

// ADMIN: Get single order
router.get('/:id', authMiddleware, employeeMiddleware, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow | undefined;
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      ...order,
      order_items: JSON.parse(order.order_items),
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ADMIN: Update order status
router.put('/:id/status', authMiddleware, employeeMiddleware, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'confirmed', 'processing', 'delivered', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, req.params.id);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow | undefined;
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      ...order,
      order_items: JSON.parse(order.order_items),
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ADMIN: Delete an order
router.delete('/:id', authMiddleware, employeeMiddleware, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as OrderRow | undefined;
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;

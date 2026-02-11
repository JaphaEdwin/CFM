import { Router } from 'express';
import { db } from '../db/schema';
import { authMiddleware, employeeMiddleware } from '../middleware/auth';
import type { StatsRow, ActivityRow } from '../types';

const router = Router();

// Apply auth and employee middleware
router.use(authMiddleware);
router.use(employeeMiddleware);

// Get dashboard statistics
router.get('/stats', (req, res) => {
  try {
    // Poultry stats
    const totalBirds = db.prepare(`
      SELECT SUM(current_count) as total 
      FROM poultry_batches 
      WHERE status = 'active'
    `).get() as StatsRow | undefined;

    const activeBatches = db.prepare(`
      SELECT COUNT(*) as count 
      FROM poultry_batches 
      WHERE status = 'active'
    `).get() as StatsRow | undefined;

    // Egg production - last 7 days
    const recentEggs = db.prepare(`
      SELECT SUM(eggs_collected) as total, SUM(broken_eggs) as broken 
      FROM egg_production 
      WHERE date >= date('now', '-7 days')
    `).get() as StatsRow | undefined;

    // Today's eggs
    const todayEggs = db.prepare(`
      SELECT SUM(eggs_collected) as total 
      FROM egg_production 
      WHERE date(date) = date('now')
    `).get() as StatsRow | undefined;

    // Sales stats
    const totalRevenue = db.prepare('SELECT SUM(total_amount) as total FROM sales').get() as StatsRow | undefined;
    const monthRevenue = db.prepare(`
      SELECT SUM(total_amount) as total 
      FROM sales 
      WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', 'now')
    `).get() as StatsRow | undefined;
    const pendingPayments = db.prepare(`
      SELECT SUM(total_amount) as total 
      FROM sales 
      WHERE payment_status = 'pending'
    `).get() as StatsRow | undefined;

    // Expense stats
    const totalExpenses = db.prepare('SELECT SUM(amount) as total FROM expenses').get() as StatsRow | undefined;
    const monthExpenses = db.prepare(`
      SELECT SUM(amount) as total 
      FROM expenses 
      WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `).get() as StatsRow | undefined;

    // Customer stats
    const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get() as StatsRow | undefined;
    const newCustomersThisMonth = db.prepare(`
      SELECT COUNT(*) as count 
      FROM customers 
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `).get() as StatsRow | undefined;

    // Recent mortality
    const recentMortality = db.prepare(`
      SELECT SUM(mortality_count) as total 
      FROM health_records 
      WHERE date >= date('now', '-30 days') AND mortality_count > 0
    `).get() as StatsRow | undefined;

    // Feed usage this month
    const monthFeed = db.prepare(`
      SELECT SUM(quantity_kg) as total, SUM(cost) as cost 
      FROM feed_records 
      WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    `).get() as StatsRow | undefined;

    // Orders stats
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get() as StatsRow | undefined;
    const newOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'new'`).get() as StatsRow | undefined;
    const ordersRevenue = db.prepare('SELECT SUM(total_amount) as total FROM orders WHERE status IN ("confirmed", "processing", "delivered")').get() as StatsRow | undefined;
    const monthOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`).get() as StatsRow | undefined;

    res.json({
      poultry: {
        totalBirds: totalBirds?.total || 0,
        activeBatches: activeBatches?.count || 0,
        recentMortality: recentMortality?.total || 0
      },
      eggs: {
        weeklyProduction: recentEggs?.total || 0,
        weeklyBroken: recentEggs?.broken || 0,
        todayProduction: todayEggs?.total || 0
      },
      sales: {
        totalRevenue: totalRevenue?.total || 0,
        monthRevenue: monthRevenue?.total || 0,
        pendingPayments: pendingPayments?.total || 0
      },
      expenses: {
        totalExpenses: totalExpenses?.total || 0,
        monthExpenses: monthExpenses?.total || 0
      },
      customers: {
        total: totalCustomers?.count || 0,
        newThisMonth: newCustomersThisMonth?.count || 0
      },
      feed: {
        monthUsage: monthFeed?.total || 0,
        monthCost: monthFeed?.cost || 0
      },
      orders: {
        total: totalOrders?.count || 0,
        newOrders: newOrders?.count || 0,
        revenue: ordersRevenue?.total || 0,
        thisMonth: monthOrders?.count || 0
      },
      profit: {
        monthly: (monthRevenue?.total || 0) - (monthExpenses?.total || 0),
        total: (totalRevenue?.total || 0) - (totalExpenses?.total || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent activities
router.get('/activities', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    // Get recent egg production
    const recentEggs = db.prepare(`
      SELECT 'egg' as type, id, date as timestamp, eggs_collected as value, 'Eggs collected' as description 
      FROM egg_production 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit);

    // Get recent sales
    const recentSales = db.prepare(`
      SELECT 'sale' as type, s.id, s.sale_date as timestamp, s.total_amount as value, 
             c.name || ' - ' || s.sale_type as description 
      FROM sales s 
      LEFT JOIN customers c ON s.customer_id = c.id 
      ORDER BY s.created_at DESC 
      LIMIT ?
    `).all(limit);

    // Get recent health records
    const recentHealth = db.prepare(`
      SELECT 'health' as type, hr.id, hr.date as timestamp, hr.record_type as value, 
             pb.batch_name || ' - ' || hr.description as description 
      FROM health_records hr 
      LEFT JOIN poultry_batches pb ON hr.batch_id = pb.id 
      ORDER BY hr.created_at DESC 
      LIMIT ?
    `).all(limit);

    // Combine and sort by timestamp
    const activities = [...recentEggs, ...recentSales, ...recentHealth] as ActivityRow[];
    activities.sort((a: ActivityRow, b: ActivityRow) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limitedActivities = activities.slice(0, limit);

    res.json(limitedActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get chart data for egg production
router.get('/charts/eggs', (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    const data = db.prepare(`
      SELECT date, SUM(eggs_collected) as eggs, SUM(broken_eggs) as broken 
      FROM egg_production 
      WHERE date >= date('now', '-' || ? || ' days') 
      GROUP BY date 
      ORDER BY date ASC
    `).all(days);

    res.json(data);
  } catch (error) {
    console.error('Error fetching egg chart data:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// Get chart data for sales
router.get('/charts/sales', (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    
    const data = db.prepare(`
      SELECT sale_date as date, SUM(total_amount) as total 
      FROM sales 
      WHERE sale_date >= date('now', '-' || ? || ' days') 
      GROUP BY sale_date 
      ORDER BY sale_date ASC
    `).all(days);

    res.json(data);
  } catch (error) {
    console.error('Error fetching sales chart data:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

export default router;

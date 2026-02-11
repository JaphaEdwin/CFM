import { Router } from 'express';
import { db } from '../db/schema';
import { authMiddleware, employeeMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth and employee middleware
router.use(authMiddleware);
router.use(employeeMiddleware);

// ==================== POULTRY BATCHES ====================

// Get all batches
router.get('/batches', (req, res) => {
  try {
    const batches = db.prepare(`
      SELECT pb.*, u.full_name as created_by_name 
      FROM poultry_batches pb 
      LEFT JOIN users u ON pb.created_by = u.id 
      ORDER BY pb.created_at DESC
    `).all();
    res.json(batches);
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// Get single batch with all related records
router.get('/batches/:id', (req, res) => {
  try {
    const batch = db.prepare('SELECT * FROM poultry_batches WHERE id = ?').get(req.params.id);
    
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const eggProduction = db.prepare('SELECT * FROM egg_production WHERE batch_id = ? ORDER BY date DESC').all(req.params.id);
    const feedRecords = db.prepare('SELECT * FROM feed_records WHERE batch_id = ? ORDER BY date DESC').all(req.params.id);
    const healthRecords = db.prepare('SELECT * FROM health_records WHERE batch_id = ? ORDER BY date DESC').all(req.params.id);

    res.json({ batch, eggProduction, feedRecords, healthRecords });
  } catch (error) {
    console.error('Error fetching batch:', error);
    res.status(500).json({ error: 'Failed to fetch batch' });
  }
});

// Create batch
router.post('/batches', (req, res) => {
  try {
    const { batchName, birdType, initialCount, dateAcquired, source, costPerBird, notes } = req.body;
    
    if (!batchName || !birdType || !initialCount || !dateAcquired) {
      return res.status(400).json({ error: 'Batch name, bird type, initial count, and date acquired are required' });
    }

    const result = db.prepare(`
      INSERT INTO poultry_batches (batch_name, bird_type, initial_count, current_count, date_acquired, source, cost_per_bird, notes, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(batchName, birdType, initialCount, initialCount, dateAcquired, source || null, costPerBird || null, notes || null, req.user!.userId);

    const batch = db.prepare('SELECT * FROM poultry_batches WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(batch);
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

// Update batch
router.put('/batches/:id', (req, res) => {
  try {
    const { batchName, birdType, currentCount, status, notes } = req.body;
    
    db.prepare(`
      UPDATE poultry_batches 
      SET batch_name = ?, bird_type = ?, current_count = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(batchName, birdType, currentCount, status, notes, req.params.id);

    const batch = db.prepare('SELECT * FROM poultry_batches WHERE id = ?').get(req.params.id);
    res.json(batch);
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ error: 'Failed to update batch' });
  }
});

// ==================== EGG PRODUCTION ====================

// Get all egg records
router.get('/eggs', (req, res) => {
  try {
    const eggs = db.prepare(`
      SELECT ep.*, pb.batch_name, u.full_name as recorded_by_name 
      FROM egg_production ep 
      LEFT JOIN poultry_batches pb ON ep.batch_id = pb.id 
      LEFT JOIN users u ON ep.recorded_by = u.id 
      ORDER BY ep.date DESC
    `).all();
    res.json(eggs);
  } catch (error) {
    console.error('Error fetching egg records:', error);
    res.status(500).json({ error: 'Failed to fetch egg records' });
  }
});

// Create egg production record
router.post('/eggs', (req, res) => {
  try {
    const { batchId, date, eggsCollected, brokenEggs, notes } = req.body;
    
    if (!batchId || !date || eggsCollected === undefined) {
      return res.status(400).json({ error: 'Batch ID, date, and eggs collected are required' });
    }

    const result = db.prepare(`
      INSERT INTO egg_production (batch_id, date, eggs_collected, broken_eggs, notes, recorded_by) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(batchId, date, eggsCollected, brokenEggs || 0, notes || null, req.user!.userId);

    const record = db.prepare('SELECT * FROM egg_production WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating egg record:', error);
    res.status(500).json({ error: 'Failed to create egg record' });
  }
});

// ==================== FEED RECORDS ====================

// Get all feed records
router.get('/feed', (req, res) => {
  try {
    const feed = db.prepare(`
      SELECT fr.*, pb.batch_name, u.full_name as recorded_by_name 
      FROM feed_records fr 
      LEFT JOIN poultry_batches pb ON fr.batch_id = pb.id 
      LEFT JOIN users u ON fr.recorded_by = u.id 
      ORDER BY fr.date DESC
    `).all();
    res.json(feed);
  } catch (error) {
    console.error('Error fetching feed records:', error);
    res.status(500).json({ error: 'Failed to fetch feed records' });
  }
});

// Create feed record
router.post('/feed', (req, res) => {
  try {
    const { batchId, date, feedType, quantityKg, cost, supplier, notes } = req.body;
    
    if (!batchId || !date || !feedType || !quantityKg) {
      return res.status(400).json({ error: 'Batch ID, date, feed type, and quantity are required' });
    }

    const result = db.prepare(`
      INSERT INTO feed_records (batch_id, date, feed_type, quantity_kg, cost, supplier, notes, recorded_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(batchId, date, feedType, quantityKg, cost || null, supplier || null, notes || null, req.user!.userId);

    const record = db.prepare('SELECT * FROM feed_records WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating feed record:', error);
    res.status(500).json({ error: 'Failed to create feed record' });
  }
});

// ==================== HEALTH RECORDS ====================

// Get all health records
router.get('/health', (req, res) => {
  try {
    const health = db.prepare(`
      SELECT hr.*, pb.batch_name, u.full_name as recorded_by_name 
      FROM health_records hr 
      LEFT JOIN poultry_batches pb ON hr.batch_id = pb.id 
      LEFT JOIN users u ON hr.recorded_by = u.id 
      ORDER BY hr.date DESC
    `).all();
    res.json(health);
  } catch (error) {
    console.error('Error fetching health records:', error);
    res.status(500).json({ error: 'Failed to fetch health records' });
  }
});

// Create health record
router.post('/health', (req, res) => {
  try {
    const { batchId, date, recordType, description, mortalityCount, cost, administeredBy, notes } = req.body;
    
    if (!batchId || !date || !recordType || !description) {
      return res.status(400).json({ error: 'Batch ID, date, record type, and description are required' });
    }

    const result = db.prepare(`
      INSERT INTO health_records (batch_id, date, record_type, description, mortality_count, cost, administered_by, notes, recorded_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(batchId, date, recordType, description, mortalityCount || 0, cost || 0, administeredBy || null, notes || null, req.user!.userId);

    // Update current_count if there was mortality
    if (mortalityCount && mortalityCount > 0) {
      db.prepare(`
        UPDATE poultry_batches 
        SET current_count = current_count - ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(mortalityCount, batchId);
    }

    const record = db.prepare('SELECT * FROM health_records WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating health record:', error);
    res.status(500).json({ error: 'Failed to create health record' });
  }
});

export default router;

import { Router } from 'express';
import { db } from '../db/schema';
import { authMiddleware, employeeMiddleware } from '../middleware/auth';

const router = Router();

interface SiteSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_type: string;
  updated_by: number | null;
  updated_at: string;
}

// Get all site settings (public - for landing page)
router.get('/', (req, res) => {
  try {
    const settings = db.prepare('SELECT setting_key, setting_value FROM site_settings').all() as SiteSetting[];
    
    // Convert to object for easier frontend use
    const settingsObj: Record<string, string> = {};
    settings.forEach((s: SiteSetting) => {
      settingsObj[s.setting_key] = s.setting_value;
    });
    
    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({ error: 'Failed to fetch site settings' });
  }
});

// Get all settings with details (for admin)
router.get('/admin', authMiddleware, employeeMiddleware, (req, res) => {
  try {
    const settings = db.prepare(`
      SELECT ss.*, u.full_name as updated_by_name 
      FROM site_settings ss 
      LEFT JOIN users u ON ss.updated_by = u.id 
      ORDER BY ss.setting_key
    `).all();
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    res.status(500).json({ error: 'Failed to fetch site settings' });
  }
});

// Update a single setting
router.put('/:key', authMiddleware, employeeMiddleware, (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    db.prepare(`
      UPDATE site_settings 
      SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE setting_key = ?
    `).run(value, req.user!.userId, key);

    const updated = db.prepare('SELECT * FROM site_settings WHERE setting_key = ?').get(key);
    
    if (!updated) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating site setting:', error);
    res.status(500).json({ error: 'Failed to update site setting' });
  }
});

// Update multiple settings at once
router.put('/', authMiddleware, employeeMiddleware, (req, res) => {
  try {
    const settings = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object is required' });
    }

    const updateStmt = db.prepare(`
      UPDATE site_settings 
      SET setting_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE setting_key = ?
    `);

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO site_settings (setting_key, setting_value, setting_type, updated_by)
      VALUES (?, ?, 'text', ?)
    `);

    const updateMany = db.transaction((settingsToUpdate: Record<string, string>) => {
      for (const [key, value] of Object.entries(settingsToUpdate)) {
        // First try to insert (will be ignored if exists)
        insertStmt.run(key, value, req.user!.userId);
        // Then update
        updateStmt.run(value, req.user!.userId, key);
      }
    });

    updateMany(settings);

    // Return updated settings
    const updatedSettings = db.prepare('SELECT setting_key, setting_value FROM site_settings').all() as SiteSetting[];
    const settingsObj: Record<string, string> = {};
    updatedSettings.forEach((s: SiteSetting) => {
      settingsObj[s.setting_key] = s.setting_value;
    });

    res.json(settingsObj);
  } catch (error) {
    console.error('Error updating site settings:', error);
    res.status(500).json({ error: 'Failed to update site settings' });
  }
});

export default router;

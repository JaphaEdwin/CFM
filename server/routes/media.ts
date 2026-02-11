import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db/schema';
import { authMiddleware, employeeMiddleware } from '../middleware/auth';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up upload directory
const uploadDir = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '..', 'public', 'uploads')
  : path.join(__dirname, '..', '..', 'client', 'public', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images and videos
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  
  if ([...allowedImageTypes, ...allowedVideoTypes].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, MOV, AVI) are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  }
});

interface MediaRow {
  id: number;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  category: string;
  title: string | null;
  description: string | null;
  is_active: number;
  display_order: number;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
  uploader_name?: string;
}

// Get all media (public - for landing page)
router.get('/', (req, res) => {
  try {
    const { category, type } = req.query;
    
    let query = 'SELECT * FROM media WHERE is_active = 1';
    const params: any[] = [];
    
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    if (type) {
      query += ' AND file_type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY display_order ASC, created_at DESC';
    
    const media = db.prepare(query).all(...params) as MediaRow[];
    
    // Add full URL path to each media item
    const mediaWithUrls = media.map(m => ({
      ...m,
      url: `/uploads/${m.filename}`
    }));
    
    res.json(mediaWithUrls);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// Get all media (admin - with more details)
router.get('/admin', authMiddleware, employeeMiddleware, (req, res) => {
  try {
    const media = db.prepare(`
      SELECT m.*, u.full_name as uploader_name 
      FROM media m 
      LEFT JOIN users u ON m.uploaded_by = u.id 
      ORDER BY m.created_at DESC
    `).all() as MediaRow[];
    
    const mediaWithUrls = media.map(m => ({
      ...m,
      url: `/uploads/${m.filename}`
    }));
    
    res.json(mediaWithUrls);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// Upload new media
router.post('/upload', authMiddleware, employeeMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { category = 'general', title, description } = req.body;
    const file = req.file;
    
    // Determine file type
    const fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
    
    // Get next display order
    const lastOrder = db.prepare(
      'SELECT MAX(display_order) as max_order FROM media WHERE category = ?'
    ).get(category) as { max_order: number | null };
    const displayOrder = (lastOrder?.max_order || 0) + 1;

    const result = db.prepare(`
      INSERT INTO media (filename, original_name, file_type, file_size, mime_type, category, title, description, display_order, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      file.filename,
      file.originalname,
      fileType,
      file.size,
      file.mimetype,
      category,
      title || null,
      description || null,
      displayOrder,
      req.user!.userId
    );

    const newMedia = db.prepare('SELECT * FROM media WHERE id = ?').get(result.lastInsertRowid) as MediaRow;
    
    res.status(201).json({
      ...newMedia,
      url: `/uploads/${newMedia.filename}`
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

// Update media details
router.put('/:id', authMiddleware, employeeMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, is_active, display_order } = req.body;

    const existing = db.prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRow | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Media not found' });
    }

    db.prepare(`
      UPDATE media 
      SET title = ?, description = ?, category = ?, is_active = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title ?? existing.title,
      description ?? existing.description,
      category ?? existing.category,
      is_active ?? existing.is_active,
      display_order ?? existing.display_order,
      id
    );

    const updated = db.prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRow;
    res.json({
      ...updated,
      url: `/uploads/${updated.filename}`
    });
  } catch (error) {
    console.error('Error updating media:', error);
    res.status(500).json({ error: 'Failed to update media' });
  }
});

// Delete media
router.delete('/:id', authMiddleware, employeeMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    
    const media = db.prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRow | undefined;
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete file from disk
    const filePath = path.join(uploadDir, media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    db.prepare('DELETE FROM media WHERE id = ?').run(id);
    
    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

// Reorder media
router.post('/reorder', authMiddleware, employeeMiddleware, (req, res) => {
  try {
    const { items } = req.body; // Array of { id, display_order }
    
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const updateStmt = db.prepare('UPDATE media SET display_order = ? WHERE id = ?');
    
    const reorderMany = db.transaction((itemsToReorder: { id: number; display_order: number }[]) => {
      for (const item of itemsToReorder) {
        updateStmt.run(item.display_order, item.id);
      }
    });

    reorderMany(items);
    
    res.json({ message: 'Media reordered successfully' });
  } catch (error) {
    console.error('Error reordering media:', error);
    res.status(500).json({ error: 'Failed to reorder media' });
  }
});

export default router;

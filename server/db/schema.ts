import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database will be stored in the server folder
const dbPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '..', 'countryfarm.db')
  : path.join(__dirname, '..', '..', 'countryfarm.db');

export const db = new Database(dbPath);

// Initialize database schema
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'employee', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Customers table (for tracking farm customers)
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      address TEXT,
      notes TEXT,
      total_purchases REAL DEFAULT 0,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Poultry Batches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS poultry_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_name TEXT NOT NULL,
      bird_type TEXT NOT NULL,
      initial_count INTEGER NOT NULL,
      current_count INTEGER NOT NULL,
      date_acquired DATE NOT NULL,
      source TEXT,
      cost_per_bird REAL,
      notes TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'sold', 'archived')),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Egg Production Records
  db.exec(`
    CREATE TABLE IF NOT EXISTS egg_production (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER REFERENCES poultry_batches(id),
      date DATE NOT NULL,
      eggs_collected INTEGER NOT NULL,
      broken_eggs INTEGER DEFAULT 0,
      notes TEXT,
      recorded_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Feed Records
  db.exec(`
    CREATE TABLE IF NOT EXISTS feed_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER REFERENCES poultry_batches(id),
      date DATE NOT NULL,
      feed_type TEXT NOT NULL,
      quantity_kg REAL NOT NULL,
      cost REAL,
      supplier TEXT,
      notes TEXT,
      recorded_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Health Records
  db.exec(`
    CREATE TABLE IF NOT EXISTS health_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER REFERENCES poultry_batches(id),
      date DATE NOT NULL,
      record_type TEXT NOT NULL CHECK(record_type IN ('vaccination', 'medication', 'checkup', 'mortality', 'other')),
      description TEXT NOT NULL,
      mortality_count INTEGER DEFAULT 0,
      cost REAL DEFAULT 0,
      administered_by TEXT,
      notes TEXT,
      recorded_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sales Records
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER REFERENCES customers(id),
      sale_date DATE NOT NULL,
      sale_type TEXT NOT NULL CHECK(sale_type IN ('eggs', 'birds', 'manure', 'other')),
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'partial', 'paid')),
      payment_method TEXT,
      notes TEXT,
      recorded_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      receipt_number TEXT,
      notes TEXT,
      recorded_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Site Settings table (for employee-editable content)
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      setting_type TEXT DEFAULT 'text',
      updated_by INTEGER REFERENCES users(id),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Media table (for uploaded images and videos)
  db.exec(`
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL CHECK(file_type IN ('image', 'video')),
      file_size INTEGER,
      mime_type TEXT,
      category TEXT DEFAULT 'general',
      title TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      uploaded_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Orders table (customer orders from the website)
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT NOT NULL,
      delivery_address TEXT,
      order_items TEXT NOT NULL,
      total_amount REAL NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'new' CHECK(status IN ('new', 'confirmed', 'processing', 'delivered', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Initialize default site settings
  const existingSettings = db.prepare('SELECT COUNT(*) as count FROM site_settings').get() as { count: number };
  if (existingSettings.count === 0) {
    const defaultSettings = [
      { key: 'hero_title', value: 'Fresh From Our Farm', type: 'text' },
      { key: 'hero_subtitle', value: 'To Your Table', type: 'text' },
      { key: 'hero_description', value: 'Premium quality eggs and poultry products from Matugga\'s finest farm. Raised with care, delivered with love.', type: 'text' },
      { key: 'phone_number', value: '+256 763 564 896', type: 'text' },
      { key: 'email', value: 'info@countryfarm.ug', type: 'text' },
      { key: 'address', value: 'Matugga, Wakiso District, Uganda', type: 'text' },
      { key: 'whatsapp_number', value: '256763564896', type: 'text' },
      { key: 'eggs_price', value: 'From UGX 15,000/tray', type: 'text' },
      { key: 'birds_price', value: 'From UGX 25,000/bird', type: 'text' },
      { key: 'manure_price', value: 'From UGX 5,000/bag', type: 'text' },
      { key: 'eggs_description', value: 'Farm-fresh eggs collected daily from our healthy, free-range chickens.', type: 'text' },
      { key: 'birds_description', value: 'Healthy chickens raised with natural feed and proper care.', type: 'text' },
      { key: 'manure_description', value: 'High-quality chicken manure for your garden and farm.', type: 'text' },
      // Order prices (numeric, used in order form)
      { key: 'order_price_eggs_tray', value: '15000', type: 'text' },
      { key: 'order_price_eggs_crate', value: '170000', type: 'text' },
      { key: 'order_price_broiler_chicken', value: '25000', type: 'text' },
      { key: 'order_price_layer_chicken', value: '20000', type: 'text' },
      { key: 'order_price_kienyeji_chicken', value: '35000', type: 'text' },
      { key: 'order_price_day_old_chicks', value: '3500', type: 'text' },
      { key: 'order_price_manure_bag', value: '5000', type: 'text' },
      { key: 'order_price_manure_truck', value: '200000', type: 'text' },
      { key: 'stat_birds', value: '5000+', type: 'text' },
      { key: 'stat_eggs', value: '10K+', type: 'text' },
      { key: 'stat_customers', value: '500+', type: 'text' },
      { key: 'stat_years', value: '5+', type: 'text' },
      // Testimonials
      { key: 'testimonial_1_name', value: 'Sarah Nakato', type: 'text' },
      { key: 'testimonial_1_role', value: 'Restaurant Owner', type: 'text' },
      { key: 'testimonial_1_content', value: 'The quality of eggs from Country Farm is exceptional. My customers love the rich taste!', type: 'text' },
      { key: 'testimonial_1_rating', value: '5', type: 'text' },
      { key: 'testimonial_2_name', value: 'John Mukasa', type: 'text' },
      { key: 'testimonial_2_role', value: 'Grocery Store Owner', type: 'text' },
      { key: 'testimonial_2_content', value: 'Reliable delivery and consistent quality. They are my go-to supplier for fresh eggs.', type: 'text' },
      { key: 'testimonial_2_rating', value: '5', type: 'text' },
      { key: 'testimonial_3_name', value: 'Grace Achieng', type: 'text' },
      { key: 'testimonial_3_role', value: 'Home Customer', type: 'text' },
      { key: 'testimonial_3_content', value: 'Fresh, affordable, and the team is always friendly. Highly recommend!', type: 'text' },
      { key: 'testimonial_3_rating', value: '5', type: 'text' },
    ];
    
    const insertStmt = db.prepare('INSERT INTO site_settings (setting_key, setting_value, setting_type) VALUES (?, ?, ?)');
    for (const setting of defaultSettings) {
      insertStmt.run(setting.key, setting.value, setting.type);
    }
  }

  console.log('Database initialized successfully');
}

export default db;

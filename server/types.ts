// Database row types
export interface User {
  id: number;
  email: string;
  password: string;
  full_name: string;
  phone: string | null;
  role: 'customer' | 'employee' | 'admin';
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface PoultryBatch {
  id: number;
  batch_name: string;
  bird_type: string;
  quantity: number;
  purchase_date: string;
  purchase_price: number;
  supplier: string | null;
  notes: string | null;
  status: 'active' | 'sold' | 'deceased';
  created_by: number | null;
  created_at: string;
}

export interface EggProduction {
  id: number;
  batch_id: number;
  date: string;
  eggs_collected: number;
  broken_eggs: number;
  notes: string | null;
  recorded_by: number | null;
  created_at: string;
}

export interface FeedRecord {
  id: number;
  batch_id: number | null;
  feed_type: string;
  quantity_kg: number;
  cost: number;
  purchase_date: string;
  supplier: string | null;
  notes: string | null;
  recorded_by: number | null;
  created_at: string;
}

export interface HealthRecord {
  id: number;
  batch_id: number;
  record_type: 'vaccination' | 'medication' | 'checkup' | 'mortality';
  description: string;
  date: string;
  cost: number;
  vet_name: string | null;
  notes: string | null;
  recorded_by: number | null;
  created_at: string;
}

export interface Sale {
  id: number;
  customer_id: number | null;
  sale_type: 'eggs' | 'birds' | 'manure' | 'other';
  quantity: number;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  payment_status: 'paid' | 'pending' | 'partial';
  notes: string | null;
  recorded_by: number | null;
  created_at: string;
  customer_name?: string;
}

export interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  receipt_number: string | null;
  notes: string | null;
  recorded_by: number | null;
  created_at: string;
}

// Stats types
export interface StatsRow {
  total?: number;
  count?: number;
  broken?: number;
  cost?: number;
  total_amount?: number;
  customer_id?: number;
}

// Activity row type
export interface ActivityRow {
  type: string;
  description: string;
  date: string;
  amount: number | null;
}

-- Cloudflare D1 Database Schema for Vehicle Gate Access System (Unified gate_* Schema)
-- نظام تصاريح بوابات المركبات - قاعدة بيانات D1 (موحدة)

-- USERS TABLE (synced across devices)
CREATE TABLE IF NOT EXISTS gate_users (
    id INTEGER PRIMARY KEY,
    badge_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL DEFAULT '',
    pin_code TEXT DEFAULT '',
    pin_hash TEXT DEFAULT '',
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('manager', 'officer', 'admin')),
    gate_assigned TEXT DEFAULT 'Gate 1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- GATES TABLE (factory gate definitions)
CREATE TABLE IF NOT EXISTS gate_gates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DESTINATIONS TABLE (internal factory destinations)
CREATE TABLE IF NOT EXISTS gate_destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SETTINGS TABLE (system configuration key-value pairs)
CREATE TABLE IF NOT EXISTS gate_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- VEHICLES TABLE (primary, all CRUD goes here)
CREATE TABLE IF NOT EXISTS gate_vehicles (
    id INTEGER PRIMARY KEY,
    plate_ar TEXT NOT NULL,
    plate_en TEXT NOT NULL DEFAULT '',
    vehicle_type TEXT NOT NULL DEFAULT 'truckHeavy',
    driver_name_ar TEXT NOT NULL DEFAULT '',
    driver_name_en TEXT NOT NULL DEFAULT '',
    driver_phone TEXT DEFAULT '',
    company_ar TEXT NOT NULL DEFAULT '',
    company_en TEXT NOT NULL DEFAULT '',
    status TEXT DEFAULT 'visitor',
    blacklist_reason TEXT DEFAULT '',
    photo_url TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PERMITS TABLE (primary, all CRUD goes here)
CREATE TABLE IF NOT EXISTS gate_permits (
    id INTEGER PRIMARY KEY,
    permit_code TEXT NOT NULL,
    pin_code TEXT NOT NULL DEFAULT '',
    vehicle_id INTEGER NOT NULL,
    permit_type TEXT DEFAULT 'entry',
    destination_ar TEXT DEFAULT '',
    destination_en TEXT DEFAULT '',
    purpose_ar TEXT DEFAULT '',
    purpose_en TEXT DEFAULT '',
    cargo_details TEXT DEFAULT '',
    invoice_no TEXT DEFAULT '',
    valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
    valid_until DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    created_by INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ACCESS LOGS TABLE (primary, entry/exit/denied records)
CREATE TABLE IF NOT EXISTS gate_logs (
    id INTEGER PRIMARY KEY,
    vehicle_id INTEGER NOT NULL,
    permit_id INTEGER DEFAULT NULL,
    officer_id INTEGER DEFAULT NULL,
    gate_name TEXT NOT NULL DEFAULT '',
    action_type TEXT NOT NULL DEFAULT 'entry',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    exit_timestamp DATETIME DEFAULT NULL,
    duration_minutes INTEGER DEFAULT NULL,
    remarks TEXT DEFAULT '',
    photo_url TEXT DEFAULT ''
);

-- WEB PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    role TEXT NOT NULL DEFAULT 'officer',
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_gate_vehicles_plate ON gate_vehicles(plate_ar);
CREATE INDEX IF NOT EXISTS idx_gate_vehicles_status ON gate_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_gate_permits_vehicle ON gate_permits(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gate_permits_code ON gate_permits(permit_code);
CREATE INDEX IF NOT EXISTS idx_gate_permits_status ON gate_permits(status);
CREATE INDEX IF NOT EXISTS idx_gate_logs_vehicle ON gate_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gate_logs_action ON gate_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_gate_logs_timestamp ON gate_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_push_role ON push_subscriptions(role);
CREATE INDEX IF NOT EXISTS idx_push_endpoint ON push_subscriptions(endpoint);

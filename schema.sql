-- Cloudflare D1 Database Schema for Vehicle Gate Access System
-- نظام تصاريح بوابات المركبات - قاعدة بيانات D1

-- LEGACY TABLES
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    badge_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    pin_code TEXT,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('manager', 'officer', 'admin')),
    gate_assigned TEXT DEFAULT 'Gate 1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY,
    plate_ar TEXT NOT NULL,
    plate_en TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    driver_name_ar TEXT NOT NULL,
    driver_name_en TEXT NOT NULL,
    driver_phone TEXT,
    company_ar TEXT NOT NULL,
    company_en TEXT NOT NULL,
    status TEXT DEFAULT 'visitor',
    blacklist_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permits (
    id INTEGER PRIMARY KEY,
    permit_code TEXT UNIQUE NOT NULL,
    vehicle_id INTEGER NOT NULL,
    destination_ar TEXT NOT NULL,
    destination_en TEXT NOT NULL,
    purpose_ar TEXT NOT NULL,
    purpose_en TEXT NOT NULL,
    cargo_details TEXT,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    status TEXT DEFAULT 'active',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY,
    permit_id INTEGER,
    vehicle_id INTEGER NOT NULL,
    officer_id INTEGER,
    gate_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    exit_timestamp DATETIME,
    duration_minutes INTEGER,
    remarks TEXT
);

-- PRIMARY SYNC TABLES used by POST/GET /api/sync for persistent cross-device sync
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
    remarks TEXT DEFAULT ''
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_gate_vehicles_plate ON gate_vehicles(plate_ar);
CREATE INDEX IF NOT EXISTS idx_gate_permits_vehicle ON gate_permits(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gate_permits_code ON gate_permits(permit_code);
CREATE INDEX IF NOT EXISTS idx_gate_logs_vehicle ON gate_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gate_logs_action ON gate_logs(action_type);
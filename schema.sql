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
    photo_url TEXT DEFAULT '',
    exit_photo_url TEXT DEFAULT ''
);

-- WEB PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    role TEXT NOT NULL DEFAULT 'officer',
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    watch_all INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PER-VEHICLE WATCHLIST (which vehicles a subscription wants notifications for)
CREATE TABLE IF NOT EXISTS push_vehicle_watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES gate_vehicles(id) ON DELETE CASCADE
);

-- NOTIFICATIONS QUEUE (pending notifications for polling clients)
CREATE TABLE IF NOT EXISTS gate_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL DEFAULT 'entry',
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    vehicle_id INTEGER,
    vehicle_plate TEXT DEFAULT '',
    gate_name TEXT DEFAULT '',
    is_read INTEGER DEFAULT 0,
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
CREATE INDEX IF NOT EXISTS idx_watchlist_sub ON push_vehicle_watchlist(subscription_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_vehicle ON push_vehicle_watchlist(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON gate_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON gate_notifications(is_read);

-- ============================================================
-- SEED DATA: Initial manager + officer accounts
-- Manager login: manager@dotra.com / Manager@2026
-- Officer login: GT-01 / PIN: 1234
-- Passwords are salted SHA-256 hashes. Change in production.
-- ============================================================
INSERT OR IGNORE INTO gate_users (id, badge_id, email, password_hash, pin_code, pin_hash, name_ar, name_en, role, gate_assigned)
VALUES
    (1, 'MGR-01', 'manager@dotra.com', '408e180e62c0d777915d5e95a367b1cb:d6dffc554dcfc484cda2b4838c7cd60bae796a2dd44640ce004d1931324730c2', '', 'ecdef03ce7f80ff3b36041bed489ca2f:4f8ec7427c805ae9e2fc144062c71206c3396dc98d414460acd338dc62e4edc7', 'م. أحمد المنصور', 'Eng. Ahmed Al-Mansoor', 'manager', ''),
    (2, 'GT-01', 'officer1@dotra.com', '', '', 'ecdef03ce7f80ff3b36041bed489ca2f:4f8ec7427c805ae9e2fc144062c71206c3396dc98d414460acd338dc62e4edc7', 'أمين الشرطة / طارق مصطفى', 'Officer Tariq Mostafa', 'officer', 'بوابة 1 الرئيسية - دوترا');

-- Seed gates
INSERT OR IGNORE INTO gate_gates (name) VALUES
    ('بوابة 1 الرئيسية - دوترا'),
    ('بوابة 2 الشحن والجمارك - دوترا'),
    ('بوابة 3 المواد الخام والكيماويات'),
    ('بوابة 4 خروج الإنتاج والشاحنات');

-- Seed destinations
INSERT OR IGNORE INTO gate_destinations (name) VALUES
    ('المستودع الرئيسي'),
    ('مصنع الأسمدة والمخصبات'),
    ('مصنع المبيدات والكيماويات'),
    ('منطقة التحميل والتفريغ'),
    ('ميزان البسكول'),
    ('مبنى الإدارة العامة');

-- Seed settings
INSERT OR IGNORE INTO gate_settings (key, value) VALUES
    ('default_whatsapp', '01012345678'),
    ('company_name_ar', 'مجموعة دوترا'),
    ('company_name_en', 'DOTRA Group'),
    ('gate_name_ar', 'بوابة مصانع دوترا الرئيسية'),
    ('gate_name_en', 'DOTRA Factory Main Gate');

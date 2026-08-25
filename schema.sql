-- Cloudflare D1 Database Schema for Vehicle Gate Access System (Egypt Traffic Edition)
-- نظام تصاريح بوابات المركبات - قاعدة بيانات كلاود فلير D1 (معيار المرور المصري)

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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_ar TEXT NOT NULL,           -- e.g. "ط ر ق ٩ ٨ ٢ ١"
    plate_en TEXT NOT NULL,           -- e.g. "TRQ 9821"
    vehicle_type TEXT NOT NULL,       -- truckHeavy, truckMedium, car, van, tanker
    driver_name_ar TEXT NOT NULL,
    driver_name_en TEXT NOT NULL,
    driver_phone TEXT,
    driver_id_number TEXT,
    company_ar TEXT NOT NULL,
    company_en TEXT NOT NULL,
    status TEXT DEFAULT 'visitor' CHECK(status IN ('whitelist', 'blacklist', 'visitor')),
    blacklist_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    permit_code TEXT UNIQUE NOT NULL,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    destination_ar TEXT NOT NULL,
    destination_en TEXT NOT NULL,
    purpose_ar TEXT NOT NULL,
    purpose_en TEXT NOT NULL,
    cargo_details TEXT,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'used', 'revoked')),
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    permit_id INTEGER REFERENCES permits(id),
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    officer_id INTEGER REFERENCES users(id),
    gate_name TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK(action_type IN ('entry', 'exit', 'denied')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    exit_timestamp DATETIME,
    duration_minutes INTEGER,
    remarks TEXT
);

-- Seed Initial Egyptian Admin & Gate Officers
INSERT OR IGNORE INTO users (id, badge_id, email, password_hash, pin_code, name_ar, name_en, role, gate_assigned) VALUES
(1, 'MGR-01', 'manager@factory.com', 'Manager@2026', '9900', 'م. أحمد المنصور', 'Eng. Ahmed Al-Mansoor', 'manager', 'Office HQ (الإدارة الرئيسية)'),
(2, 'GT-01', 'officer1@factory.com', 'Officer@2026', '1234', 'أمين الشرطة / طارق مصطفى', 'Officer Tariq Mostafa', 'officer', 'بوابة 1 الرئيسية (Gate 1 Main)'),
(3, 'GT-02', 'officer2@factory.com', 'Officer@2026', '5678', 'أمين الشرطة / خالد الشناوي', 'Officer Khalid El-Shenawy', 'officer', 'بوابة 2 الشحن والجمارك (Gate 2 Cargo)');



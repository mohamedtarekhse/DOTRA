-- Neon Serverless Postgres (Lakebase Postgres) Schema for DOTRA Gate Access System
-- مخطط قاعدة بيانات نيون بوستجريس لنظام تصاريح بوابات مصانع دوترا

-- 1. USERS TABLE (مديرو العمليات وأفراد أمن البوابات)
CREATE TABLE IF NOT EXISTS gate_users (
    id BIGINT PRIMARY KEY,
    badge_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL DEFAULT '',
    pin_code TEXT DEFAULT '',
    pin_hash TEXT DEFAULT '',
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('manager', 'officer', 'admin')),
    gate_assigned TEXT DEFAULT 'Gate 1',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. GATES TABLE (بوابات المصانع المعتمدة)
CREATE TABLE IF NOT EXISTS gate_gates (
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. DESTINATIONS TABLE (الوجهات والمستودعات الداخلية)
CREATE TABLE IF NOT EXISTS gate_destinations (
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. SETTINGS TABLE (إعدادات النظام العامة والمفتاحية)
CREATE TABLE IF NOT EXISTS gate_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. VEHICLES TABLE (سجل المركبات والشاحنات المعتمدة والزائرة)
CREATE TABLE IF NOT EXISTS gate_vehicles (
    id BIGINT PRIMARY KEY,
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. PERMITS TABLE (تصاريح الدخول والخروج الرسمية)
CREATE TABLE IF NOT EXISTS gate_permits (
    id BIGINT PRIMARY KEY,
    permit_code TEXT NOT NULL,
    pin_code TEXT NOT NULL DEFAULT '',
    vehicle_id BIGINT NOT NULL,
    permit_type TEXT DEFAULT 'entry',
    destination_ar TEXT DEFAULT '',
    destination_en TEXT DEFAULT '',
    purpose_ar TEXT DEFAULT '',
    purpose_en TEXT DEFAULT '',
    cargo_details TEXT DEFAULT '',
    invoice_no TEXT DEFAULT '',
    valid_from TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active',
    created_by BIGINT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. ACCESS LOGS TABLE (سجل حركات الدخول والخروج والمنع الأمني)
CREATE TABLE IF NOT EXISTS gate_logs (
    id BIGINT PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    permit_id BIGINT DEFAULT NULL,
    officer_id BIGINT DEFAULT NULL,
    gate_name TEXT NOT NULL DEFAULT '',
    action_type TEXT NOT NULL DEFAULT 'entry',
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    exit_timestamp TIMESTAMPTZ DEFAULT NULL,
    duration_minutes INTEGER DEFAULT NULL,
    remarks TEXT DEFAULT '',
    photo_url TEXT DEFAULT '',
    exit_photo_url TEXT DEFAULT ''
);

-- 8. PUSH SUBSCRIPTIONS TABLE (اشتراكات إشعارات الويب للمدير والحراس)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    role TEXT NOT NULL DEFAULT 'officer',
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    watch_all INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. PUSH VEHICLE WATCHLIST (قائمة المراقبة المخصصة للإشعارات)
CREATE TABLE IF NOT EXISTS push_vehicle_watchlist (
    id BIGSERIAL PRIMARY KEY,
    subscription_id BIGINT NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
    vehicle_id BIGINT NOT NULL REFERENCES gate_vehicles(id) ON DELETE CASCADE
);

-- 10. NOTIFICATIONS QUEUE (طابور الإشعارات والتنبيهات المباشرة)
CREATE TABLE IF NOT EXISTS gate_notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    type TEXT NOT NULL DEFAULT 'entry',
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    vehicle_id BIGINT,
    vehicle_plate TEXT DEFAULT '',
    gate_name TEXT DEFAULT '',
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PostgreSQL Indexes for Sub-Millisecond Queries
-- ============================================================
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
-- SEED DATA: Initial Users, Gates, Destinations, Settings
-- ============================================================
INSERT INTO gate_users (id, badge_id, email, password_hash, pin_code, pin_hash, name_ar, name_en, role, gate_assigned)
VALUES
    (1, 'MGR-01', 'manager@dotra.com', '408e180e62c0d777915d5e95a367b1cb:d6dffc554dcfc484cda2b4838c7cd60bae796a2dd44640ce004d1931324730c2', '', 'ecdef03ce7f80ff3b36041bed489ca2f:4f8ec7427c805ae9e2fc144062c71206c3396dc98d414460acd338dc62e4edc7', 'م. أحمد المنصور', 'Eng. Ahmed Al-Mansoor', 'manager', ''),
    (2, 'GT-01', 'officer1@dotra.com', '', '', 'ecdef03ce7f80ff3b36041bed489ca2f:4f8ec7427c805ae9e2fc144062c71206c3396dc98d414460acd338dc62e4edc7', 'أمين الشرطة / طارق مصطفى', 'Officer Tariq Mostafa', 'officer', 'بوابة 1 الرئيسية - دوترا')
ON CONFLICT (badge_id) DO NOTHING;

INSERT INTO gate_gates (name) VALUES
    ('بوابة 1 الرئيسية - دوترا'),
    ('بوابة 2 الشحن والجمارك - دوترا'),
    ('بوابة 3 المواد الخام والكيماويات'),
    ('بوابة 4 خروج الإنتاج والشاحنات')
ON CONFLICT (name) DO NOTHING;

INSERT INTO gate_destinations (name) VALUES
    ('المستودع الرئيسي'),
    ('مصنع الأسمدة والمخصبات'),
    ('مصنع المبيدات والكيماويات'),
    ('منطقة التحميل والتفريغ'),
    ('ميزان البسكول'),
    ('مبنى الإدارة العامة')
ON CONFLICT (name) DO NOTHING;

INSERT INTO gate_settings (key, value) VALUES
    ('default_whatsapp', '01012345678'),
    ('company_name_ar', 'مجموعة دوترا'),
    ('company_name_en', 'DOTRA Group'),
    ('gate_name_ar', 'بوابة مصانع دوترا الرئيسية'),
    ('gate_name_en', 'DOTRA Factory Main Gate')
ON CONFLICT (key) DO NOTHING;

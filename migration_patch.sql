-- ============================================================
-- DOTRA Factory Gate System - Database Migration Patch
-- السكربت المعتمد لتحديث وتوافق قاعدة البيانات (PostgreSQL / Neon)
-- ============================================================

-- 1. تحديث جدول المستخدمين (gate_users): إضافة رتبة 'ceo'
ALTER TABLE "gate_users" 
    DROP CONSTRAINT IF EXISTS "gate_users_role_check";

ALTER TABLE "gate_users" 
    ADD CONSTRAINT "gate_users_role_check" 
    CHECK (((role)::text = ANY ((ARRAY[
        'manager'::character varying, 
        'officer'::character varying, 
        'admin'::character varying, 
        'ceo'::character varying
    ])::text[])));

-- 2. تحديث جدول التصاريح (gate_permits): إضافة حقول التدقيق والتعليق وتوسيع الحالات
ALTER TABLE "gate_permits" 
    ADD COLUMN IF NOT EXISTS "created_by_name" varchar(255),
    ADD COLUMN IF NOT EXISTS "approved_by" integer REFERENCES "gate_users"("id") ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS "approved_by_name" varchar(255),
    ADD COLUMN IF NOT EXISTS "hold_reason" text;

ALTER TABLE "gate_permits" 
    DROP CONSTRAINT IF EXISTS "gate_permits_status_check";

ALTER TABLE "gate_permits" 
    ADD CONSTRAINT "gate_permits_status_check" 
    CHECK (((status)::text = ANY ((ARRAY[
        'active'::character varying, 
        'expired'::character varying, 
        'revoked'::character varying,
        'superseded'::character varying,
        'used'::character varying,
        'hold'::character varying
    ])::text[])));

-- 3. تحديث جدول سجلات الحركة (gate_logs): إضافة بوابة الخروج والضابط المسجل للخروج
ALTER TABLE "gate_logs" 
    ADD COLUMN IF NOT EXISTS "exit_gate_name" varchar(100),
    ADD COLUMN IF NOT EXISTS "exit_officer_id" integer REFERENCES "gate_users"("id") ON DELETE SET NULL;

-- 4. تحديث جدول المركبات (gate_vehicles): توسيع حالات المركبة (blacklist / registered / visitor / exited)
ALTER TABLE "gate_vehicles" 
    DROP CONSTRAINT IF EXISTS "gate_vehicles_status_check";

ALTER TABLE "gate_vehicles" 
    ADD CONSTRAINT "gate_vehicles_status_check" 
    CHECK (((status)::text = ANY ((ARRAY[
        'visitor'::character varying, 
        'registered'::character varying, 
        'employee'::character varying, 
        'contractor'::character varying, 
        'blacklist'::character varying, 
        'blacklisted'::character varying, 
        'exited'::character varying
    ])::text[])));

-- 5. إدراج وتحديث المستخدمين الافتراضيين (الرئيس التنفيذي، مدير العمليات، ضابط البوابة)
INSERT INTO "gate_users" ("id", "badge_id", "email", "password_hash", "pin_code", "pin_hash", "name_ar", "name_en", "role", "gate_assigned")
VALUES
    (1, 'MGR-01', 'manager@dotra.com', '5f2338021caf29159b9c5a502d47145b:9ff1522e5f8a0539d6e4171c089555338942faaa7c70789f64a2efa041c8b5e8', '', 'ecdef03ce7f80ff3b36041bed489ca2f:4f8ec7427c805ae9e2fc144062c71206c3396dc98d414460acd338dc62e4edc7', 'م. أحمد المنصور', 'Eng. Ahmed Al-Mansoor', 'manager', ''),
    (2, 'GT-01', 'officer1@dotra.com', '', '', 'ecdef03ce7f80ff3b36041bed489ca2f:4f8ec7427c805ae9e2fc144062c71206c3396dc98d414460acd338dc62e4edc7', 'أمين الشرطة / طارق مصطفى', 'Officer Tariq Mostafa', 'officer', 'بوابة 1 الرئيسية - دوترا'),
    (3, 'CEO-01', 'ceo@dotra.com', '5f2338021caf29159b9c5a502d47145b:9ff1522e5f8a0539d6e4171c089555338942faaa7c70789f64a2efa041c8b5e8', '', 'ecdef03ce7f80ff3b36041bed489ca2f:4f8ec7427c805ae9e2fc144062c71206c3396dc98d414460acd338dc62e4edc7', 'الرئيس التنفيذي / الإدارة العليا', 'Chief Executive Officer (CEO)', 'ceo', '')
ON CONFLICT ("id") DO UPDATE SET
    "password_hash" = EXCLUDED."password_hash",
    "badge_id" = EXCLUDED."badge_id",
    "role" = EXCLUDED."role",
    "name_ar" = EXCLUDED."name_ar",
    "name_en" = EXCLUDED."name_en";

-- 6. التأكد من تسلسل الأرقام التلقائية (Sequences) بعد التحديث
SELECT setval(pg_get_serial_sequence('gate_users', 'id'), COALESCE((SELECT MAX(id) FROM "gate_users"), 1));
SELECT setval(pg_get_serial_sequence('gate_vehicles', 'id'), COALESCE((SELECT MAX(id) FROM "gate_vehicles"), 1));
SELECT setval(pg_get_serial_sequence('gate_permits', 'id'), COALESCE((SELECT MAX(id) FROM "gate_permits"), 1));
SELECT setval(pg_get_serial_sequence('gate_logs', 'id'), COALESCE((SELECT MAX(id) FROM "gate_logs"), 1));

-- 7. إنشاء جدول توزيع الورديات والمناوبات (gate_roster)
CREATE TABLE IF NOT EXISTS "gate_roster" (
    "id" serial PRIMARY KEY,
    "gate_name" varchar(100) NOT NULL UNIQUE,
    "day_officer_id" integer REFERENCES "gate_users"("id") ON DELETE SET NULL,
    "night_officer_id" integer REFERENCES "gate_users"("id") ON DELETE SET NULL,
    "notes" text,
    "updated_at" timestamp DEFAULT now()
);

-- 8. إنشاء جدول طلبات الاستئذان والفحص المرفق بالصور (gate_requests)
CREATE TABLE IF NOT EXISTS "gate_requests" (
    "id" serial PRIMARY KEY,
    "plate_ar" varchar(50) NOT NULL,
    "plate_en" varchar(50),
    "driver_name" varchar(100),
    "driver_phone" varchar(50),
    "company" varchar(100),
    "destination" varchar(100),
    "cargo_details" text,
    "vehicle_type" varchar(50) DEFAULT 'truckHeavy',
    "notes" text,
    "plate_photo_url" text,
    "carriage_photo_url" text,
    "officer_id" integer REFERENCES "gate_users"("id") ON DELETE SET NULL,
    "officer_name" varchar(100),
    "gate_name" varchar(100),
    "status" varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    "manager_decision_notes" text,
    "decided_by_name" varchar(100),
    "permit_id" integer REFERENCES "gate_permits"("id") ON DELETE SET NULL,
    "created_at" timestamp DEFAULT now(),
    "decided_at" timestamp
);

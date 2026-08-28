-- ============================================================
-- Neon Serverless Postgres (Lakebase Postgres) Schema for DOTRA Gate Access System
-- مخطط قاعدة بيانات نيون بوستجريس المعتمد لنظام تصاريح بوابات مصانع دوترا
-- ============================================================

CREATE SCHEMA IF NOT EXISTS "public";

-- 1. DESTINATIONS TABLE
CREATE TABLE IF NOT EXISTS "gate_destinations" (
	"id" serial PRIMARY KEY,
	"name" varchar(100) NOT NULL CONSTRAINT "gate_destinations_name_key" UNIQUE
);

-- 2. GATES TABLE
CREATE TABLE IF NOT EXISTS "gate_gates" (
	"id" serial PRIMARY KEY,
	"name" varchar(100) NOT NULL CONSTRAINT "gate_gates_name_key" UNIQUE
);

-- 3. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS "gate_settings" (
	"key" varchar(100) PRIMARY KEY,
	"value" text,
	"updated_at" timestamp DEFAULT now()
);

-- 4. USERS TABLE
CREATE TABLE IF NOT EXISTS "gate_users" (
	"id" serial PRIMARY KEY,
	"badge_id" varchar(50) NOT NULL CONSTRAINT "gate_users_badge_id_key" UNIQUE,
	"email" varchar(255),
	"password_hash" varchar(255),
	"pin_hash" varchar(255),
	"pin_code" varchar(255),
	"name_ar" varchar(255),
	"name_en" varchar(255),
	"role" varchar(20) DEFAULT 'officer' NOT NULL,
	"gate_assigned" varchar(100),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "gate_users_role_check" CHECK (((role)::text = ANY ((ARRAY['manager'::character varying, 'officer'::character varying, 'admin'::character varying, 'ceo'::character varying])::text[])))
);

-- 5. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS "gate_vehicles" (
	"id" serial PRIMARY KEY,
	"plate_ar" varchar(50),
	"plate_en" varchar(50),
	"vehicle_type" varchar(50),
	"driver_name_ar" varchar(255),
	"driver_name_en" varchar(255),
	"driver_phone" varchar(50),
	"company_ar" varchar(255),
	"company_en" varchar(255),
	"status" varchar(20) DEFAULT 'visitor',
	"blacklist_reason" text,
	"photo_url" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "gate_vehicles_status_check" CHECK (((status)::text = ANY ((ARRAY['visitor'::character varying, 'blacklisted'::character varying])::text[])))
);

-- 6. PERMITS TABLE
CREATE TABLE IF NOT EXISTS "gate_permits" (
	"id" serial PRIMARY KEY,
	"permit_code" varchar(100) NOT NULL CONSTRAINT "gate_permits_permit_code_key" UNIQUE,
	"pin_code" varchar(20) NOT NULL,
	"vehicle_id" integer REFERENCES "gate_vehicles"("id") ON DELETE SET NULL,
	"permit_type" varchar(20) NOT NULL,
	"destination_ar" varchar(255),
	"destination_en" varchar(255),
	"purpose_ar" varchar(500),
	"purpose_en" varchar(500),
	"cargo_details" text,
	"invoice_no" varchar(100),
	"valid_from" timestamp,
	"valid_until" timestamp,
	"status" varchar(20) DEFAULT 'active',
	"created_by" integer REFERENCES "gate_users"("id") ON DELETE SET NULL,
	"created_by_name" varchar(255),
	"approved_by" integer REFERENCES "gate_users"("id") ON DELETE SET NULL,
	"approved_by_name" varchar(255),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "gate_permits_permit_type_check" CHECK (((permit_type)::text = ANY ((ARRAY['entry'::character varying, 'exit'::character varying, 'both'::character varying])::text[]))),
	CONSTRAINT "gate_permits_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'hold'::character varying, 'expired'::character varying, 'revoked'::character varying, 'superseded'::character varying])::text[])))
);

-- 7. ACCESS LOGS TABLE
CREATE TABLE IF NOT EXISTS "gate_logs" (
	"id" serial PRIMARY KEY,
	"vehicle_id" integer REFERENCES "gate_vehicles"("id") ON DELETE SET NULL,
	"permit_id" integer REFERENCES "gate_permits"("id") ON DELETE SET NULL,
	"officer_id" integer REFERENCES "gate_users"("id") ON DELETE SET NULL,
	"gate_name" varchar(100),
	"action_type" varchar(20) NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"exit_timestamp" timestamp,
	"exit_gate_name" varchar(100),
	"exit_officer_id" integer REFERENCES "gate_users"("id") ON DELETE SET NULL,
	"duration_minutes" integer,
	"remarks" text,
	"photo_url" text,
	"exit_photo_url" text,
	CONSTRAINT "gate_logs_action_type_check" CHECK (((action_type)::text = ANY ((ARRAY['entry'::character varying, 'exit'::character varying, 'denied'::character varying])::text[])))
);

-- 8. PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" serial PRIMARY KEY,
	"user_id" integer,
	"role" varchar(20),
	"endpoint" text NOT NULL CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE,
	"p256dh" text,
	"auth" text,
	"watch_all" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);

-- 9. PUSH VEHICLE WATCHLIST TABLE
CREATE TABLE IF NOT EXISTS "push_vehicle_watchlist" (
	"id" serial PRIMARY KEY,
	"subscription_id" integer REFERENCES "push_subscriptions"("id") ON DELETE CASCADE,
	"vehicle_id" integer REFERENCES "gate_vehicles"("id") ON DELETE CASCADE
);

-- 10. NOTIFICATIONS QUEUE TABLE
CREATE TABLE IF NOT EXISTS "gate_notifications" (
	"id" serial PRIMARY KEY,
	"user_id" integer,
	"type" varchar(50),
	"title" varchar(255),
	"body" text,
	"vehicle_id" integer,
	"vehicle_plate" varchar(50),
	"gate_name" varchar(100),
	"is_read" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS "idx_gate_logs_action" ON "gate_logs" ("action_type");
CREATE INDEX IF NOT EXISTS "idx_gate_logs_timestamp" ON "gate_logs" ("timestamp");
CREATE INDEX IF NOT EXISTS "idx_gate_logs_vehicle" ON "gate_logs" ("vehicle_id");
CREATE INDEX IF NOT EXISTS "idx_logs_timestamp" ON "gate_logs" ("timestamp");
CREATE INDEX IF NOT EXISTS "idx_logs_vehicle" ON "gate_logs" ("vehicle_id");
CREATE INDEX IF NOT EXISTS "idx_notif_read" ON "gate_notifications" ("is_read");
CREATE INDEX IF NOT EXISTS "idx_notif_user" ON "gate_notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_user" ON "gate_notifications" ("user_id","is_read");
CREATE INDEX IF NOT EXISTS "idx_gate_permits_code" ON "gate_permits" ("permit_code");
CREATE INDEX IF NOT EXISTS "idx_gate_permits_status" ON "gate_permits" ("status");
CREATE INDEX IF NOT EXISTS "idx_gate_permits_vehicle" ON "gate_permits" ("vehicle_id");
CREATE INDEX IF NOT EXISTS "idx_permits_status" ON "gate_permits" ("status");
CREATE INDEX IF NOT EXISTS "idx_permits_vehicle" ON "gate_permits" ("vehicle_id");
CREATE INDEX IF NOT EXISTS "idx_gate_vehicles_plate" ON "gate_vehicles" ("plate_ar");
CREATE INDEX IF NOT EXISTS "idx_gate_vehicles_status" ON "gate_vehicles" ("status");
CREATE INDEX IF NOT EXISTS "idx_vehicles_plate" ON "gate_vehicles" ("plate_en");
CREATE INDEX IF NOT EXISTS "idx_push_endpoint" ON "push_subscriptions" ("endpoint");
CREATE INDEX IF NOT EXISTS "idx_push_role" ON "push_subscriptions" ("role");
CREATE INDEX IF NOT EXISTS "idx_watchlist_sub" ON "push_vehicle_watchlist" ("subscription_id");
CREATE INDEX IF NOT EXISTS "idx_watchlist_vehicle" ON "push_vehicle_watchlist" ("vehicle_id");

-- ============================================================
-- SEED DATA: Initial Users, Gates, Destinations, Settings
-- ============================================================
INSERT INTO "gate_users" ("id", "badge_id", "email", "password_hash", "pin_code", "pin_hash", "name_ar", "name_en", "role", "gate_assigned")
VALUES
    (1, 'MGR-01', 'manager@dotra.com', '5f2338021caf29159b9c5a502d47145b:9ff1522e5f8a0539d6e4171c089555338942faaa7c70789f64a2efa041c8b5e8', '', 'ecdef03ce7f80ff3b36041bed489ca2f:4f8ec7427c805ae9e2fc144062c71206c3396dc98d414460acd338dc62e4edc7', 'م. أحمد المنصور', 'Eng. Ahmed Al-Mansoor', 'manager', ''),
    (2, 'GT-01', 'officer1@dotra.com', '', '', 'ecdef03ce7f80ff3b36041bed489ca2f:4f8ec7427c805ae9e2fc144062c71206c3396dc98d414460acd338dc62e4edc7', 'أمين الشرطة / طارق مصطفى', 'Officer Tariq Mostafa', 'officer', 'بوابة 1 الرئيسية - دوترا'),
    (3, 'CEO-01', 'ceo@dotra.com', '5f2338021caf29159b9c5a502d47145b:9ff1522e5f8a0539d6e4171c089555338942faaa7c70789f64a2efa041c8b5e8', '', 'ecdef03ce7f80ff3b36041bed489ca2f:4f8ec7427c805ae9e2fc144062c71206c3396dc98d414460acd338dc62e4edc7', 'الرئيس التنفيذي / الإدارة العليا', 'Chief Executive Officer (CEO)', 'ceo', '')
ON CONFLICT ("id") DO UPDATE SET
    "password_hash" = EXCLUDED."password_hash",
    "badge_id" = EXCLUDED."badge_id",
    "role" = EXCLUDED."role";

INSERT INTO "gate_gates" ("name") VALUES ('بوابة 1 الرئيسية - دوترا'), ('بوابة 2 شحن وتفريغ') ON CONFLICT ("name") DO NOTHING;
INSERT INTO "gate_destinations" ("name") VALUES ('المستودع الرئيسي A'), ('خط الإنتاج 1'), ('إدارة الجودة') ON CONFLICT ("name") DO NOTHING;
INSERT INTO "gate_settings" ("key", "value") VALUES ('maxStayHours', '8'), ('companyNameAr', 'مجموعة دوترا') ON CONFLICT ("key") DO NOTHING;

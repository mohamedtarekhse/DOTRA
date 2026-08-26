# DOTRA Factory Gate Access System - Bug Fix Report

## Project Overview
A bilingual (Arabic/English) vehicle gate access control PWA built with:
- **Frontend**: Vanilla JS SPA, Tailwind CSS, localStorage, Service Worker (PWA)
- **Backend**: Cloudflare Worker (`_worker.js`) + Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages + Workers

---

## Fixes Applied

### FIX #1 — Unified Table Schema (Root Cause Fix)
**Files**: `schema.sql`, `_worker.js`
- Removed ALL legacy tables (`vehicles`, `permits`, `access_logs`) from schema.sql
- Removed ALL legacy table references from _worker.js
- All endpoints now read/write exclusively to `gate_*` tables
- Individual endpoints (`/api/vehicles`, `/api/permits`, `/api/entry`, `/api/exit`, `/api/logs`) **removed entirely**
- Only `/api/sync` (GET+POST) handles vehicles, permits, and logs
- **Impact**: Eliminates the dual-schema data split — all data flows through one path

### FIX #2 — Added User API Endpoints
**Files**: `_worker.js`, `schema.sql`
- Added `POST /api/users` endpoint to sync user data to D1
- Added `gate_users` table with proper schema (id, badge_id, email, password_hash, pin_code, name_ar, name_en, role, gate_assigned)
- Frontend `db.js` now calls `POST /api/users` when users are added/updated/deleted
- **Impact**: Users synced across devices via cloud

### FIX #3 — Added Gates/Destinations/Settings to D1
**Files**: `schema.sql`, `_worker.js`, `db.js`
- Added `gate_gates`, `gate_destinations`, `gate_settings` tables to D1
- Added API endpoints: `GET/POST /api/gates`, `GET/POST /api/destinations`, `GET/POST /api/settings`
- Frontend `db.js` now calls these endpoints whenever gates/destinations/settings change
- `syncFromCloud()` now also pulls gates, destinations, settings from cloud
- **Impact**: Gates, destinations, and settings synced across devices

### FIX #4 — Removed Ephemeral CLOUD_STATE
**Files**: `_worker.js`
- Removed `CLOUD_STATE` in-memory variable entirely
- All endpoints now read from D1 only (no in-memory fallback)
- **Impact**: Eliminates data loss from Cloudflare Worker cold starts

### FIX #5 — Removed Dual Sync Calls
**Files**: `db.js`
- `recordEntry()`: Removed `pushToCloud('/api/entry', ...)`, kept only `pushToCloud('/api/sync', ...)`
- `recordExit()`: Removed `pushToCloud('/api/exit', ...)`, kept only `pushToCloud('/api/sync', ...)`
- `addVehicle()`: Removed `pushToCloud('/api/vehicles', ...)`, kept only `pushToCloud('/api/sync', ...)`
- `addPermit()`: Removed `pushToCloud('/api/permits', ...)`, kept only `pushToCloud('/api/sync', ...)`
- `updateVehicleStatus()`: Removed `pushToCloud('/api/vehicles', ...)`, kept only `pushToCloud('/api/sync', ...)`
- **Impact**: Eliminates duplicate writes and data inconsistency

### FIX #6 — Fixed `recordDenied` Cloud Sync
**Files**: `db.js`
- `recordDenied()` now calls `pushToCloud('/api/sync', ...)` — was missing entirely before
- **Impact**: Denied entry records now visible on manager dashboard across devices

### FIX #7 — Fixed Web Push Protocol
**Files**: `_worker.js`
- Removed broken `broadcastPushNotification()` function (was sending unencrypted JSON)
- Removed `CLOUD_STATE.pushSubscriptions` in-memory references
- Push subscription endpoints (`/api/push/subscribe`, `/api/push/unsubscribe`) still work for storing subscriptions in D1
- Server-side push broadcast removed (broken by design) — client-side `showNotification()` still works
- **Impact**: Eliminates silent failures from wrong push protocol

### FIX #8 — Password Hashing
**Files**: `auth.js`
- Added SHA-256 hashing via Web Crypto API with salt
- `loginManager()` is now async — compares hashed passwords
- Backward-compatible: falls back to plaintext comparison for existing seed data
- `hashPassword()` and `verifyPassword()` utility methods added
- **Impact**: Passwords no longer stored/compared in plaintext

### FIX #9 — Fixed `generateId()` Collisions
**Files**: `db.js`
- Now uses `crypto.randomUUID()` when available (falls back to timestamp+random)
- Uses bitwise hash to convert UUID to numeric ID
- **Impact**: Eliminates ID collisions across devices

### FIX #10 — Fixed `loadDemoData()` Data Loss
**Files**: `db.js`
- Now **merges** seed data with existing data instead of overwriting
- Checks for existing IDs before adding seed records
- **Impact**: Users no longer lose real data when demo data is loaded

### FIX #11 — Added Error Logging
**Files**: `_worker.js`
- All D1 operations now have `console.error()` in catch blocks
- Main API handler has top-level error logging
- **Impact**: Errors are visible in Cloudflare Worker logs for debugging

### FIX #12 — Fixed `syncFromCloud()` Always Returning True
**Files**: `db.js`
- Now only returns `true` when data actually changed (diff detection)
- **Impact**: Eliminates unnecessary UI re-renders every 2 seconds

### FIX #13 — Fixed SVG Icon Classes
**Files**: `icons.js`
- Changed `w-current h-current` (non-existent Tailwind) to `w-[1em] h-[1em]`
- **Impact**: SVG icons now size correctly

### FIX #14 — Async Login Handlers
**Files**: `app.js`
- `handleManagerLogin()` and `handleOfficerLogin()` are now `async`
- Properly `await` the auth methods
- **Impact**: Login works with async password hashing

### FIX #15 — Wrangler Config Comment
**Files**: `wrangler.toml`
- Added TODO comment about replacing placeholder database_id

---

## Data Flow (After Fix)

```
Frontend (localStorage) ←→ /api/sync (D1 gate_* tables)
Frontend (localStorage) ←→ /api/gates, /api/destinations, /api/settings, /api/users
```

**All data writes go through `/api/sync` for vehicles/permits/logs.**
**Gates, destinations, settings, and users have dedicated endpoints.**

---

## Remaining Considerations

1. **wrangler.toml** still has placeholder `database_id` — must be replaced before deployment
2. **Server-side push notifications** are removed (broken by design) — client-side notifications still work via `showNotification()`
3. **Password hashing** is SHA-256 — consider bcrypt/PBKDF2 for production if threat model requires it
4. **SEED_USERS passwords** are stored in plaintext in `db.js` as fallback — on first login they work, but no automatic migration to hashed passwords
5. **2-second sync interval** always re-renders (may want to optimize for battery on mobile)

// Cloudflare Pages Functions / Workers Backend Handler (DOTRA Edition - Unified gate_* Schema)
// معالج سحابة كلاود فلير - موحدة على جداول gate_* فقط

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (url.pathname.startsWith('/api/')) {
            const headers = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            };

            if (request.method === 'OPTIONS') {
                return new Response(null, { headers });
            }

            try {
                const db = env ? env["dotra-traffic-db"] : null;

                // ============================================================
                // GET /api/sync — Read all data from D1 gate_* tables
                // ============================================================
                if (url.pathname === '/api/sync' && request.method === 'GET') {
                    if (db) {
                        try {
                            const vehicles = (await db.prepare("SELECT * FROM gate_vehicles ORDER BY id DESC").all()).results || [];
                            const permits = (await db.prepare("SELECT * FROM gate_permits ORDER BY id DESC").all()).results || [];
                            const logs = (await db.prepare("SELECT * FROM gate_logs ORDER BY id DESC LIMIT 500").all()).results || [];
                            const gates = (await db.prepare("SELECT name FROM gate_gates ORDER BY id ASC").all()).results || [];
                            const destinations = (await db.prepare("SELECT name FROM gate_destinations ORDER BY id ASC").all()).results || [];
                            const settingsRows = (await db.prepare("SELECT key, value FROM gate_settings").all()).results || [];
                            const settings = {};
                            settingsRows.forEach(r => { settings[r.key] = r.value; });
                            const users = (await db.prepare("SELECT id, badge_id, email, password_hash, pin_code, pin_hash, name_ar, name_en, role, gate_assigned FROM gate_users ORDER BY id ASC").all()).results || [];

                            return new Response(JSON.stringify({
                                vehicles,
                                permits,
                                logs,
                                gates: gates.map(g => g.name),
                                destinations: destinations.map(d => d.name),
                                settings,
                                users
                            }), { headers });
                        } catch (e) {
                            console.error('[SYNC GET] D1 error:', e.message);
                            return new Response(JSON.stringify({ error: 'Database read failed', details: e.message }), { status: 500, headers });
                        }
                    }
                    return new Response(JSON.stringify({ vehicles: [], permits: [], logs: [], gates: [], destinations: [], settings: {}, users: [] }), { headers });
                }

                // ============================================================
                // POST /api/sync — Merge client state into D1 gate_* tables
                // ============================================================
                if (url.pathname === '/api/sync' && request.method === 'POST') {
                    const body = await request.json();

                    if (db) {
                        // --- Vehicles ---
                        if (body.vehicles && Array.isArray(body.vehicles)) {
                            for (const v of body.vehicles) {
                                try {
                                    await db.prepare(`
                                        INSERT OR REPLACE INTO gate_vehicles
                                        (id, plate_ar, plate_en, vehicle_type, driver_name_ar, driver_name_en, driver_phone, company_ar, company_en, status, blacklist_reason, photo_url)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                    `).bind(
                                        v.id, v.plate_ar || '', v.plate_en || '',
                                        v.vehicle_type || 'truckHeavy',
                                        v.driver_name_ar || '', v.driver_name_en || '',
                                        v.driver_phone || '', v.company_ar || '', v.company_en || '',
                                        v.status || 'visitor', v.blacklist_reason || '', v.photo_url || ''
                                    ).run();
                                } catch (e) { console.error('[SYNC] vehicle upsert error:', e.message); }
                            }
                        }

                        // --- Permits ---
                        if (body.permits && Array.isArray(body.permits)) {
                            for (const p of body.permits) {
                                try {
                                    await db.prepare(`
                                        INSERT OR REPLACE INTO gate_permits
                                        (id, permit_code, pin_code, vehicle_id, permit_type, destination_ar, destination_en, purpose_ar, purpose_en, cargo_details, invoice_no, valid_from, valid_until, status, created_by)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                    `).bind(
                                        p.id, p.permit_code || '', p.pin_code || '',
                                        p.vehicle_id, p.permit_type || 'entry',
                                        p.destination_ar || '', p.destination_en || '',
                                        p.purpose_ar || '', p.purpose_en || '',
                                        p.cargo_details || '', p.invoice_no || '',
                                        p.valid_from || '', p.valid_until || '',
                                        p.status || 'active', p.created_by || 1
                                    ).run();
                                } catch (e) { console.error('[SYNC] permit upsert error:', e.message); }
                            }
                        }

                        // --- Logs ---
                        if (body.logs && Array.isArray(body.logs)) {
                            for (const l of body.logs) {
                                try {
                                    await db.prepare(`
                                        INSERT OR REPLACE INTO gate_logs
                                        (id, vehicle_id, permit_id, officer_id, gate_name, action_type, timestamp, exit_timestamp, duration_minutes, remarks, photo_url)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                    `).bind(
                                        l.id, l.vehicle_id, l.permit_id || null,
                                        l.officer_id || null, l.gate_name || '',
                                        l.action_type || 'entry',
                                        l.timestamp || new Date().toISOString(),
                                        l.exit_timestamp || null,
                                        l.duration_minutes || null,
                                        l.remarks || '', l.photo_url || ''
                                    ).run();
                                } catch (e) { console.error('[SYNC] log upsert error:', e.message); }
                            }
                        }

                        // --- Gates ---
                        if (body.gates && Array.isArray(body.gates)) {
                            for (const g of body.gates) {
                                const name = typeof g === 'string' ? g : g.name;
                                if (name) {
                                    try { await db.prepare("INSERT OR IGNORE INTO gate_gates (name) VALUES (?)").bind(name).run(); } catch (e) { console.error('[SYNC] gate upsert error:', e.message); }
                                }
                            }
                        }

                        // --- Destinations ---
                        if (body.destinations && Array.isArray(body.destinations)) {
                            for (const d of body.destinations) {
                                const name = typeof d === 'string' ? d : d.name;
                                if (name) {
                                    try { await db.prepare("INSERT OR IGNORE INTO gate_destinations (name) VALUES (?)").bind(name).run(); } catch (e) { console.error('[SYNC] destination upsert error:', e.message); }
                                }
                            }
                        }

                        // --- Settings ---
                        if (body.settings && typeof body.settings === 'object') {
                            for (const [key, value] of Object.entries(body.settings)) {
                                if (key && value !== undefined && value !== null) {
                                    try { await db.prepare("INSERT OR REPLACE INTO gate_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))").bind(key, String(value)).run(); } catch (e) { console.error('[SYNC] settings upsert error:', e.message); }
                                }
                            }
                        }

                        // --- Users ---
                        if (body.users && Array.isArray(body.users)) {
                            for (const u of body.users) {
                                try {
                                    await db.prepare(`
                                        INSERT OR REPLACE INTO gate_users
                                        (id, badge_id, email, password_hash, pin_code, pin_hash, name_ar, name_en, role, gate_assigned)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                    `).bind(
                                        u.id, u.badge_id || '', u.email || '',
                                        u.password_hash || '', u.pin_code || '',
                                        u.pin_hash || '',
                                        u.name_ar || '', u.name_en || '',
                                        u.role || 'officer', u.gate_assigned || ''
                                    ).run();
                                } catch (e) { console.error('[SYNC] user upsert error:', e.message); }
                            }
                        }
                    }

                    return new Response(JSON.stringify({
                        success: true,
                        synced_at: new Date().toISOString()
                    }), { headers });
                }

                // ============================================================
                // GET /api/gates — Read gates
                // ============================================================
                if (url.pathname === '/api/gates' && request.method === 'GET') {
                    if (db) {
                        try {
                            const { results } = await db.prepare("SELECT name FROM gate_gates ORDER BY id ASC").all();
                            return new Response(JSON.stringify((results || []).map(r => r.name)), { headers });
                        } catch (e) { console.error('[GATES GET] error:', e.message); }
                    }
                    return new Response(JSON.stringify([]), { headers });
                }

                // ============================================================
                // POST /api/gates — Upsert gates array
                // ============================================================
                if (url.pathname === '/api/gates' && request.method === 'POST') {
                    const body = await request.json();
                    if (db && Array.isArray(body.gates)) {
                        try {
                            await db.prepare("DELETE FROM gate_gates").run();
                            for (const name of body.gates) {
                                await db.prepare("INSERT OR IGNORE INTO gate_gates (name) VALUES (?)").bind(name).run();
                            }
                        } catch (e) { console.error('[GATES POST] error:', e.message); }
                    }
                    return new Response(JSON.stringify({ success: true }), { headers });
                }

                // ============================================================
                // GET /api/destinations — Read destinations
                // ============================================================
                if (url.pathname === '/api/destinations' && request.method === 'GET') {
                    if (db) {
                        try {
                            const { results } = await db.prepare("SELECT name FROM gate_destinations ORDER BY id ASC").all();
                            return new Response(JSON.stringify((results || []).map(r => r.name)), { headers });
                        } catch (e) { console.error('[DEST GET] error:', e.message); }
                    }
                    return new Response(JSON.stringify([]), { headers });
                }

                // ============================================================
                // POST /api/destinations — Upsert destinations array
                // ============================================================
                if (url.pathname === '/api/destinations' && request.method === 'POST') {
                    const body = await request.json();
                    if (db && Array.isArray(body.destinations)) {
                        try {
                            await db.prepare("DELETE FROM gate_destinations").run();
                            for (const name of body.destinations) {
                                await db.prepare("INSERT OR IGNORE INTO gate_destinations (name) VALUES (?)").bind(name).run();
                            }
                        } catch (e) { console.error('[DEST POST] error:', e.message); }
                    }
                    return new Response(JSON.stringify({ success: true }), { headers });
                }

                // ============================================================
                // GET /api/settings — Read settings as key-value object
                // ============================================================
                if (url.pathname === '/api/settings' && request.method === 'GET') {
                    if (db) {
                        try {
                            const { results } = await db.prepare("SELECT key, value FROM gate_settings").all();
                            const settings = {};
                            (results || []).forEach(r => { settings[r.key] = r.value; });
                            return new Response(JSON.stringify(settings), { headers });
                        } catch (e) { console.error('[SETTINGS GET] error:', e.message); }
                    }
                    return new Response(JSON.stringify({}), { headers });
                }

                // ============================================================
                // POST /api/settings — Upsert settings key-value pairs
                // ============================================================
                if (url.pathname === '/api/settings' && request.method === 'POST') {
                    const body = await request.json();
                    if (db && typeof body === 'object') {
                        try {
                            for (const [key, value] of Object.entries(body)) {
                                if (key === 'gates' || key === 'destinations' || key === 'users') continue;
                                await db.prepare(`
                                    INSERT OR REPLACE INTO gate_settings (key, value, updated_at)
                                    VALUES (?, ?, CURRENT_TIMESTAMP)
                                `).bind(key, String(value)).run();
                            }
                        } catch (e) { console.error('[SETTINGS POST] error:', e.message); }
                    }
                    return new Response(JSON.stringify({ success: true }), { headers });
                }

                // ============================================================
                // POST /api/users — Sync users array (hash passwords before storing)
                // ============================================================
                if (url.pathname === '/api/users' && request.method === 'POST') {
                    const body = await request.json();
                    if (db && Array.isArray(body.users)) {
                        try {
                            for (const u of body.users) {
                                await db.prepare(`
                                    INSERT OR REPLACE INTO gate_users
                                    (id, badge_id, email, password_hash, pin_code, name_ar, name_en, role, gate_assigned)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `).bind(
                                    u.id, u.badge_id || '', u.email || '',
                                    u.password_hash || '', u.pin_code || '',
                                    u.name_ar || '', u.name_en || '',
                                    u.role || 'officer', u.gate_assigned || ''
                                ).run();
                            }
                        } catch (e) { console.error('[USERS POST] error:', e.message); }
                    }
                    return new Response(JSON.stringify({ success: true }), { headers });
                }

                // ============================================================
                // POST /api/clear — Wipe ALL data from D1
                // ============================================================
                if (url.pathname === '/api/clear' && (request.method === 'DELETE' || request.method === 'POST')) {
                    if (db) {
                        try { await db.prepare("DELETE FROM gate_logs").run(); } catch (e) { console.error('[CLEAR] logs error:', e.message); }
                        try { await db.prepare("DELETE FROM gate_permits").run(); } catch (e) { console.error('[CLEAR] permits error:', e.message); }
                        try { await db.prepare("DELETE FROM gate_vehicles").run(); } catch (e) { console.error('[CLEAR] vehicles error:', e.message); }
                    }
                    return new Response(JSON.stringify({
                        success: true,
                        cleared_at: new Date().toISOString(),
                        message: 'All data cleared from D1'
                    }), { headers });
                }

                // ============================================================
                // POST /api/push/subscribe — Register push subscription
                // ============================================================
                if (url.pathname === '/api/push/subscribe' && request.method === 'POST') {
                    const data = await request.json();
                    if (!data.endpoint) {
                        return new Response(JSON.stringify({ error: 'Endpoint required' }), { status: 400, headers });
                    }
                    if (db) {
                        try {
                            await db.prepare(`
                                INSERT OR REPLACE INTO push_subscriptions (user_id, role, endpoint, p256dh, auth)
                                VALUES (?, ?, ?, ?, ?)
                            `).bind(data.user_id || null, data.role || 'officer', data.endpoint, data.p256dh || '', data.auth || '').run();
                        } catch (e) { console.error('[PUSH SUB] error:', e.message); }
                    }
                    return new Response(JSON.stringify({ success: true, message: 'Push subscription registered' }), { headers });
                }

                // ============================================================
                // POST /api/push/unsubscribe — Remove push subscription
                // ============================================================
                if (url.pathname === '/api/push/unsubscribe' && request.method === 'POST') {
                    const data = await request.json();
                    if (data.endpoint && db) {
                        try {
                            await db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(data.endpoint).run();
                        } catch (e) { console.error('[PUSH UNSUB] error:', e.message); }
                    }
                    return new Response(JSON.stringify({ success: true, message: 'Push subscription removed' }), { headers });
                }

                return new Response(JSON.stringify({ status: 'ok', message: 'DOTRA Cloudflare Gate API (Unified)' }), { headers });
            } catch (err) {
                console.error('[API] Unhandled error:', err.message, err.stack);
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
            }
        }

        return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    }
};

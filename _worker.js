// Cloudflare Pages / Workers Backend with Neon Serverless Postgres (Lakebase Postgres)
// معالج سحابة كلاود فلير المتصل بقاعدة بيانات نيون بوستجريس مباشرة (بدون تبعيات خارجية - Zero Dependencies)

function createNeonClient(dbUrl) {
    if (!dbUrl) return null;
    let url;
    try {
        url = new URL(dbUrl);
    } catch (e) {
        return null;
    }
    const host = url.host.replace('-pooler', '');
    const endpoint = `https://${host}/sql`;

    const sql = async (strings, ...values) => {
        let query = '';
        const params = [];
        for (let i = 0; i < strings.length; i++) {
            query += strings[i];
            if (i < values.length) {
                params.push(values[i]);
                query += `$${params.length}`;
            }
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Neon-Connection-String': dbUrl
            },
            body: JSON.stringify({ query, params })
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Neon SQL Error (${res.status}): ${errText}`);
        }

        const data = await res.json();
        return data.rows || [];
    };

    return sql;
}

function getSql(env) {
    if (env?.sql) return env.sql;
    const dbUrl = env?.DATABASE_URL || (typeof process !== 'undefined' ? process.env?.DATABASE_URL : null);
    if (!dbUrl) return null;
    return createNeonClient(dbUrl);
}

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
                const sql = getSql(env);

                // ============================================================
                // 1. GET /api/sync — Read Complete Snapshot from Neon Postgres
                // ============================================================
                if (url.pathname === '/api/sync' && request.method === 'GET') {
                    if (sql) {
                        try {
                            const [vehicles, permits, logs, gates, destinations, settingsRows, users] = await Promise.all([
                                sql`SELECT * FROM gate_vehicles ORDER BY id DESC`,
                                sql`SELECT * FROM gate_permits ORDER BY id DESC`,
                                sql`SELECT * FROM gate_logs ORDER BY id DESC LIMIT 500`,
                                sql`SELECT name FROM gate_gates ORDER BY id ASC`,
                                sql`SELECT name FROM gate_destinations ORDER BY id ASC`,
                                sql`SELECT key, value FROM gate_settings`,
                                sql`SELECT id, badge_id, email, password_hash, pin_code, pin_hash, name_ar, name_en, role, gate_assigned FROM gate_users ORDER BY id ASC`
                            ]);

                            const settings = {};
                            (settingsRows || []).forEach(r => { settings[r.key] = r.value; });

                            return new Response(JSON.stringify({
                                vehicles: vehicles || [],
                                permits: permits || [],
                                logs: logs || [],
                                gates: (gates || []).map(g => g.name),
                                destinations: (destinations || []).map(d => d.name),
                                settings,
                                users: users || []
                            }), { headers });
                        } catch (e) {
                            console.error('[SYNC GET] Postgres error:', e.message);
                            return new Response(JSON.stringify({ error: 'Database read failed', details: e.message }), { status: 500, headers });
                        }
                    }
                    return new Response(JSON.stringify({ vehicles: [], permits: [], logs: [], gates: [], destinations: [], settings: {}, users: [] }), { headers });
                }

                // ============================================================
                // 2. POST /api/sync — Bulk Upsert Client State to Neon Postgres
                // ============================================================
                if (url.pathname === '/api/sync' && request.method === 'POST') {
                    const body = await request.json();

                    if (sql) {
                        // Bulk Upsert Vehicles
                        if (Array.isArray(body.vehicles) && body.vehicles.length > 0) {
                            for (const v of body.vehicles) {
                                try {
                                    await sql`
                                        INSERT INTO gate_vehicles (id, plate_ar, plate_en, vehicle_type, driver_name_ar, driver_name_en, driver_phone, company_ar, company_en, status, blacklist_reason, photo_url)
                                        VALUES (${v.id}, ${v.plate_ar}, ${v.plate_en || ''}, ${v.vehicle_type || 'truckHeavy'}, ${v.driver_name_ar || ''}, ${v.driver_name_en || ''}, ${v.driver_phone || ''}, ${v.company_ar || ''}, ${v.company_en || ''}, ${v.status || 'visitor'}, ${v.blacklist_reason || ''}, ${v.photo_url || ''})
                                        ON CONFLICT (id) DO UPDATE SET
                                            plate_ar = EXCLUDED.plate_ar,
                                            plate_en = EXCLUDED.plate_en,
                                            vehicle_type = EXCLUDED.vehicle_type,
                                            driver_name_ar = EXCLUDED.driver_name_ar,
                                            driver_name_en = EXCLUDED.driver_name_en,
                                            driver_phone = EXCLUDED.driver_phone,
                                            company_ar = EXCLUDED.company_ar,
                                            company_en = EXCLUDED.company_en,
                                            status = EXCLUDED.status,
                                            blacklist_reason = EXCLUDED.blacklist_reason,
                                            photo_url = CASE WHEN EXCLUDED.photo_url != '' THEN EXCLUDED.photo_url ELSE gate_vehicles.photo_url END
                                    `;
                                } catch (e) { console.error('[SYNC] vehicle upsert error:', e.message); }
                            }
                        }

                        // Bulk Upsert Permits
                        if (Array.isArray(body.permits) && body.permits.length > 0) {
                            for (const p of body.permits) {
                                try {
                                    await sql`
                                        INSERT INTO gate_permits (id, permit_code, pin_code, vehicle_id, permit_type, destination_ar, destination_en, purpose_ar, purpose_en, cargo_details, invoice_no, valid_from, valid_until, status, created_by)
                                        VALUES (${p.id}, ${p.permit_code}, ${p.pin_code || ''}, ${p.vehicle_id}, ${p.permit_type || 'entry'}, ${p.destination_ar || ''}, ${p.destination_en || ''}, ${p.purpose_ar || ''}, ${p.purpose_en || ''}, ${p.cargo_details || ''}, ${p.invoice_no || ''}, ${p.valid_from || new Date().toISOString()}, ${p.valid_until || new Date(Date.now() + 8 * 3600000).toISOString()}, ${p.status || 'active'}, ${p.created_by || 1})
                                        ON CONFLICT (id) DO UPDATE SET
                                            permit_code = EXCLUDED.permit_code,
                                            pin_code = EXCLUDED.pin_code,
                                            vehicle_id = EXCLUDED.vehicle_id,
                                            permit_type = EXCLUDED.permit_type,
                                            destination_ar = EXCLUDED.destination_ar,
                                            destination_en = EXCLUDED.destination_en,
                                            purpose_ar = EXCLUDED.purpose_ar,
                                            purpose_en = EXCLUDED.purpose_en,
                                            cargo_details = EXCLUDED.cargo_details,
                                            invoice_no = EXCLUDED.invoice_no,
                                            valid_from = EXCLUDED.valid_from,
                                            valid_until = EXCLUDED.valid_until,
                                            status = EXCLUDED.status
                                    `;
                                } catch (e) { console.error('[SYNC] permit upsert error:', e.message); }
                            }
                        }

                        // Bulk Upsert Logs
                        if (Array.isArray(body.logs) && body.logs.length > 0) {
                            for (const l of body.logs) {
                                try {
                                    await sql`
                                        INSERT INTO gate_logs (id, vehicle_id, permit_id, officer_id, gate_name, action_type, timestamp, exit_timestamp, duration_minutes, remarks, photo_url, exit_photo_url)
                                        VALUES (${l.id}, ${l.vehicle_id}, ${l.permit_id || null}, ${l.officer_id || null}, ${l.gate_name || ''}, ${l.action_type || 'entry'}, ${l.timestamp || new Date().toISOString()}, ${l.exit_timestamp || null}, ${l.duration_minutes || null}, ${l.remarks || ''}, ${l.photo_url || ''}, ${l.exit_photo_url || ''})
                                        ON CONFLICT (id) DO UPDATE SET
                                            exit_timestamp = EXCLUDED.exit_timestamp,
                                            duration_minutes = EXCLUDED.duration_minutes,
                                            remarks = EXCLUDED.remarks,
                                            exit_photo_url = EXCLUDED.exit_photo_url
                                    `;
                                } catch (e) { console.error('[SYNC] log upsert error:', e.message); }
                            }
                        }

                        // Bulk Upsert Gates
                        if (Array.isArray(body.gates) && body.gates.length > 0) {
                            for (const g of body.gates) {
                                try {
                                    await sql`INSERT INTO gate_gates (name) VALUES (${g}) ON CONFLICT (name) DO NOTHING`;
                                } catch (e) {}
                            }
                        }

                        // Bulk Upsert Destinations
                        if (Array.isArray(body.destinations) && body.destinations.length > 0) {
                            for (const d of body.destinations) {
                                try {
                                    await sql`INSERT INTO gate_destinations (name) VALUES (${d}) ON CONFLICT (name) DO NOTHING`;
                                } catch (e) {}
                            }
                        }

                        // Bulk Upsert Settings
                        if (body.settings && typeof body.settings === 'object') {
                            for (const [key, value] of Object.entries(body.settings)) {
                                try {
                                    await sql`
                                        INSERT INTO gate_settings (key, value, updated_at)
                                        VALUES (${key}, ${String(value)}, CURRENT_TIMESTAMP)
                                        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
                                    `;
                                } catch (e) {}
                            }
                        }

                        // Bulk Upsert Users
                        if (Array.isArray(body.users) && body.users.length > 0) {
                            for (const u of body.users) {
                                try {
                                    await sql`
                                        INSERT INTO gate_users (id, badge_id, email, password_hash, pin_code, pin_hash, name_ar, name_en, role, gate_assigned)
                                        VALUES (${u.id}, ${u.badge_id || ''}, ${u.email || ''}, ${u.password_hash || ''}, ${u.pin_code || ''}, ${u.pin_hash || ''}, ${u.name_ar || ''}, ${u.name_en || ''}, ${u.role || 'officer'}, ${u.gate_assigned || ''})
                                        ON CONFLICT (id) DO UPDATE SET
                                            badge_id = EXCLUDED.badge_id,
                                            email = EXCLUDED.email,
                                            password_hash = CASE WHEN EXCLUDED.password_hash != '' THEN EXCLUDED.password_hash ELSE gate_users.password_hash END,
                                            pin_hash = CASE WHEN EXCLUDED.pin_hash != '' THEN EXCLUDED.pin_hash ELSE gate_users.pin_hash END,
                                            name_ar = EXCLUDED.name_ar,
                                            name_en = EXCLUDED.name_en,
                                            role = EXCLUDED.role,
                                            gate_assigned = EXCLUDED.gate_assigned
                                    `;
                                } catch (e) { console.error('[SYNC] user upsert error:', e.message); }
                            }
                        }
                    }

                    return new Response(JSON.stringify({
                        success: true,
                        synced_at: new Date().toISOString(),
                        counts: {
                            vehicles: body.vehicles ? body.vehicles.length : 0,
                            permits: body.permits ? body.permits.length : 0,
                            logs: body.logs ? body.logs.length : 0
                        }
                    }), { headers });
                }

                // ============================================================
                // 3. REST Endpoints (/api/vehicles, /api/permits, /api/entry, /api/exit, /api/logs)
                // ============================================================
                if (url.pathname === '/api/vehicles' && request.method === 'GET') {
                    if (sql) {
                        try {
                            const res = await sql`SELECT * FROM gate_vehicles ORDER BY id DESC`;
                            return new Response(JSON.stringify(res || []), { headers });
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify([]), { headers });
                }

                if (url.pathname === '/api/vehicles' && request.method === 'POST') {
                    const v = await request.json();
                    const id = v.id || Date.now();
                    if (sql) {
                        try {
                            await sql`
                                INSERT INTO gate_vehicles (id, plate_ar, plate_en, vehicle_type, driver_name_ar, driver_name_en, driver_phone, company_ar, company_en, status, blacklist_reason, photo_url)
                                VALUES (${id}, ${v.plate_ar}, ${v.plate_en || ''}, ${v.vehicle_type || 'truckHeavy'}, ${v.driver_name_ar || ''}, ${v.driver_name_en || ''}, ${v.driver_phone || ''}, ${v.company_ar || ''}, ${v.company_en || ''}, ${v.status || 'visitor'}, ${v.blacklist_reason || ''}, ${v.photo_url || ''})
                                ON CONFLICT (id) DO UPDATE SET
                                    plate_ar = EXCLUDED.plate_ar,
                                    plate_en = EXCLUDED.plate_en,
                                    driver_name_ar = EXCLUDED.driver_name_ar,
                                    driver_phone = EXCLUDED.driver_phone,
                                    company_ar = EXCLUDED.company_ar,
                                    status = EXCLUDED.status
                            `;
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify({ success: true, id }), { headers });
                }

                if (url.pathname === '/api/permits' && request.method === 'GET') {
                    if (sql) {
                        try {
                            const res = await sql`SELECT * FROM gate_permits ORDER BY id DESC`;
                            return new Response(JSON.stringify(res || []), { headers });
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify([]), { headers });
                }

                if (url.pathname === '/api/permits' && request.method === 'POST') {
                    const data = await request.json();
                    const id = data.id || Date.now();
                    const permitCode = data.permit_code || `PER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
                    const pinCode = data.pin_code || Math.floor(10000 + Math.random() * 90000).toString();

                    if (sql) {
                        try {
                            await sql`
                                INSERT INTO gate_permits (id, permit_code, pin_code, vehicle_id, permit_type, destination_ar, destination_en, purpose_ar, purpose_en, cargo_details, invoice_no, valid_from, valid_until, status, created_by)
                                VALUES (${id}, ${permitCode}, ${pinCode}, ${data.vehicle_id}, ${data.permit_type || 'entry'}, ${data.destination_ar || 'المستودع الرئيسي'}, ${data.destination_en || 'Main Plant'}, ${data.purpose_ar || 'تصريح دخول'}, ${data.purpose_en || 'Entry Pass'}, ${data.cargo_details || ''}, ${data.invoice_no || ''}, ${data.valid_from || new Date().toISOString()}, ${data.valid_until || new Date(Date.now() + 8 * 3600000).toISOString()}, ${data.status || 'active'}, ${data.created_by || 1})
                                ON CONFLICT (id) DO UPDATE SET
                                    status = EXCLUDED.status,
                                    pin_code = EXCLUDED.pin_code
                            `;
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify({ success: true, id, permit_code: permitCode, pin_code: pinCode }), { headers });
                }

                if (url.pathname === '/api/entry' && request.method === 'POST') {
                    const data = await request.json();
                    const newId = data.id || Date.now();
                    if (sql) {
                        try {
                            await sql`
                                INSERT INTO gate_logs (id, vehicle_id, permit_id, officer_id, gate_name, action_type, timestamp, remarks, photo_url)
                                VALUES (${newId}, ${data.vehicle_id}, ${data.permit_id || null}, ${data.officer_id || 2}, ${data.gate_name || 'بوابة 1'}, ${data.timestamp || new Date().toISOString()}, ${data.remarks || 'دخول مصرح'}, ${data.photo_url || ''})
                                ON CONFLICT (id) DO UPDATE SET
                                    action_type = EXCLUDED.action_type
                            `;
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify({ success: true, id: newId }), { headers });
                }

                if (url.pathname === '/api/exit' && request.method === 'POST') {
                    const data = await request.json();
                    if (sql) {
                        try {
                            await sql`
                                UPDATE gate_logs
                                SET exit_timestamp = CURRENT_TIMESTAMP,
                                    duration_minutes = ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - timestamp)) / 60)
                                WHERE vehicle_id = ${data.vehicle_id} AND action_type = 'entry' AND exit_timestamp IS NULL
                            `;
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify({ success: true }), { headers });
                }

                if (url.pathname === '/api/logs' && request.method === 'GET') {
                    if (sql) {
                        try {
                            const res = await sql`SELECT * FROM gate_logs ORDER BY id DESC LIMIT 200`;
                            return new Response(JSON.stringify(res || []), { headers });
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify([]), { headers });
                }

                // ============================================================
                // 4. GET & POST /api/gates
                // ============================================================
                if (url.pathname === '/api/gates' && request.method === 'GET') {
                    if (sql) {
                        try {
                            const res = await sql`SELECT name FROM gate_gates ORDER BY id ASC`;
                            return new Response(JSON.stringify(res.map(r => r.name)), { headers });
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify([]), { headers });
                }

                if (url.pathname === '/api/gates' && request.method === 'POST') {
                    const data = await request.json();
                    if (sql && data.name) {
                        try {
                            await sql`INSERT INTO gate_gates (name) VALUES (${data.name}) ON CONFLICT (name) DO NOTHING`;
                            const res = await sql`SELECT name FROM gate_gates ORDER BY id ASC`;
                            return new Response(JSON.stringify({ success: true, gates: res.map(r => r.name) }), { headers });
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify({ success: false }), { headers });
                }

                // ============================================================
                // 5. GET & POST /api/destinations
                // ============================================================
                if (url.pathname === '/api/destinations' && request.method === 'GET') {
                    if (sql) {
                        try {
                            const res = await sql`SELECT name FROM gate_destinations ORDER BY id ASC`;
                            return new Response(JSON.stringify(res.map(r => r.name)), { headers });
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify([]), { headers });
                }

                if (url.pathname === '/api/destinations' && request.method === 'POST') {
                    const data = await request.json();
                    if (sql && data.name) {
                        try {
                            await sql`INSERT INTO gate_destinations (name) VALUES (${data.name}) ON CONFLICT (name) DO NOTHING`;
                            const res = await sql`SELECT name FROM gate_destinations ORDER BY id ASC`;
                            return new Response(JSON.stringify({ success: true, destinations: res.map(r => r.name) }), { headers });
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify({ success: false }), { headers });
                }

                // ============================================================
                // 6. GET & POST /api/settings
                // ============================================================
                if (url.pathname === '/api/settings' && request.method === 'GET') {
                    if (sql) {
                        try {
                            const rows = await sql`SELECT key, value FROM gate_settings`;
                            const settings = {};
                            rows.forEach(r => { settings[r.key] = r.value; });
                            return new Response(JSON.stringify(settings), { headers });
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify({}), { headers });
                }

                if (url.pathname === '/api/settings' && request.method === 'POST') {
                    const data = await request.json();
                    if (sql && typeof data === 'object') {
                        try {
                            for (const [k, v] of Object.entries(data)) {
                                await sql`
                                    INSERT INTO gate_settings (key, value, updated_at)
                                    VALUES (${k}, ${String(v)}, CURRENT_TIMESTAMP)
                                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
                                `;
                            }
                            return new Response(JSON.stringify({ success: true, settings: data }), { headers });
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify({ success: false }), { headers });
                }

                // ============================================================
                // 7. GET & POST /api/users
                // ============================================================
                if (url.pathname === '/api/users' && request.method === 'GET') {
                    if (sql) {
                        try {
                            const users = await sql`SELECT id, badge_id, email, password_hash, pin_code, pin_hash, name_ar, name_en, role, gate_assigned FROM gate_users ORDER BY id ASC`;
                            return new Response(JSON.stringify(users || []), { headers });
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify([]), { headers });
                }

                if (url.pathname === '/api/users' && request.method === 'POST') {
                    const user = await request.json();
                    const id = user.id || Date.now();
                    if (sql) {
                        try {
                            await sql`
                                INSERT INTO gate_users (id, badge_id, email, password_hash, pin_code, pin_hash, name_ar, name_en, role, gate_assigned)
                                VALUES (${id}, ${user.badge_id || ''}, ${user.email || ''}, ${user.password_hash || ''}, ${user.pin_code || ''}, ${user.pin_hash || ''}, ${user.name_ar || ''}, ${user.name_en || ''}, ${user.role || 'officer'}, ${user.gate_assigned || ''})
                                ON CONFLICT (id) DO UPDATE SET
                                    badge_id = EXCLUDED.badge_id,
                                    email = EXCLUDED.email,
                                    password_hash = CASE WHEN EXCLUDED.password_hash != '' THEN EXCLUDED.password_hash ELSE gate_users.password_hash END,
                                    pin_hash = CASE WHEN EXCLUDED.pin_hash != '' THEN EXCLUDED.pin_hash ELSE gate_users.pin_hash END,
                                    name_ar = EXCLUDED.name_ar,
                                    name_en = EXCLUDED.name_en,
                                    role = EXCLUDED.role,
                                    gate_assigned = EXCLUDED.gate_assigned
                            `;
                            return new Response(JSON.stringify({ success: true, user: { ...user, id } }), { headers });
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify({ success: false }), { headers });
                }

                // ============================================================
                // 8. DELETE /api/clear — Wipe Database while Retaining Push Subscriptions
                // ============================================================
                if (url.pathname === '/api/clear' && (request.method === 'DELETE' || request.method === 'POST')) {
                    if (sql) {
                        try {
                            await Promise.all([
                                sql`DELETE FROM gate_vehicles`,
                                sql`DELETE FROM gate_permits`,
                                sql`DELETE FROM gate_logs`,
                                sql`DELETE FROM gate_notifications`
                            ]);
                            return new Response(JSON.stringify({ success: true, message: 'Neon Postgres gate data successfully cleared' }), { headers });
                        } catch (e) {
                            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
                        }
                    }
                    return new Response(JSON.stringify({ success: true, message: 'Cleared' }), { headers });
                }

                // ============================================================
                // 9. PUSH NOTIFICATIONS & DISPATCH (/api/push/*)
                // ============================================================
                if (url.pathname === '/api/push/subscribe' && request.method === 'POST') {
                    const data = await request.json();
                    const endpoint = data.endpoint || data.subscription?.endpoint;
                    const p256dh = data.p256dh || data.subscription?.keys?.p256dh || '';
                    const auth = data.auth || data.subscription?.keys?.auth || '';
                    const role = data.role || 'manager';
                    const userId = data.user_id || null;
                    const watchAll = data.watch_all !== undefined ? (data.watch_all ? 1 : 0) : 1;

                    if (sql && endpoint) {
                        try {
                            await sql`
                                INSERT INTO push_subscriptions (user_id, role, endpoint, p256dh, auth, watch_all)
                                VALUES (${userId}, ${role}, ${endpoint}, ${p256dh}, ${auth}, ${watchAll})
                                ON CONFLICT (endpoint) DO UPDATE SET
                                    user_id = EXCLUDED.user_id,
                                    role = EXCLUDED.role,
                                    p256dh = EXCLUDED.p256dh,
                                    auth = EXCLUDED.auth,
                                    watch_all = EXCLUDED.watch_all
                            `;
                        } catch (e) { 
                            console.error('[PUSH SUB] error:', e.message);
                            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
                        }
                    }
                    return new Response(JSON.stringify({ success: true, message: 'Push subscription registered in Neon Postgres' }), { headers });
                }

                if (url.pathname === '/api/push/unsubscribe' && request.method === 'POST') {
                    const data = await request.json();
                    const endpoint = data.endpoint || data.subscription?.endpoint;
                    if (sql && endpoint) {
                        try {
                            await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify({ success: true, message: 'Push subscription removed' }), { headers });
                }

                if ((url.pathname === '/api/push/notify' || url.pathname === '/api/push/send') && request.method === 'POST') {
                    const data = await request.json();
                    if (sql && (data.type || data.title) && (data.vehicle_plate || data.body)) {
                        const title = data.title || (data.type === 'entry'
                            ? `📥 دخول: ${data.vehicle_plate}`
                            : (data.type === 'exit' ? `📤 خروج: ${data.vehicle_plate}` : `🔔 ${data.vehicle_plate}`));
                        const body = data.body || (data.type === 'entry'
                            ? `دخول عبر ${data.gate_name || 'البوابة'}`
                            : (data.type === 'exit' ? `خروج عبر ${data.gate_name || 'البوابة'}` : data.message || ''));

                        try {
                            // 1. Insert a broadcast notification for all connected clients
                            await sql`
                                INSERT INTO gate_notifications (user_id, type, title, body, vehicle_id, vehicle_plate, gate_name)
                                VALUES (${data.user_id || null}, ${data.type || 'alert'}, ${title}, ${body}, ${data.vehicle_id || null}, ${data.vehicle_plate || ''}, ${data.gate_name || ''})
                            `;

                            // 2. Insert for each specific subscribed user
                            const roles = data.roles || [data.role || 'manager'];
                            for (const role of roles) {
                                const subs = await sql`SELECT user_id FROM push_subscriptions WHERE role = ${role}`;
                                const userIds = [...new Set((subs || []).map(s => s.user_id).filter(Boolean))];
                                for (const uid of userIds) {
                                    if (data.user_id && uid === data.user_id) continue;
                                    await sql`
                                        INSERT INTO gate_notifications (user_id, type, title, body, vehicle_id, vehicle_plate, gate_name)
                                        VALUES (${uid}, ${data.type || 'alert'}, ${title}, ${body}, ${data.vehicle_id || null}, ${data.vehicle_plate || ''}, ${data.gate_name || ''})
                                    `;
                                }
                            }
                        } catch (e) { console.error('[PUSH NOTIFY] error:', e.message); }
                    }
                    return new Response(JSON.stringify({ success: true, broadcasted: true }), { headers });
                }

                if (url.pathname === '/api/notifications' && request.method === 'GET') {
                    const userId = url.searchParams.get('user_id');
                    if (sql) {
                        try {
                            let notifs = [];
                            if (userId && !isNaN(parseInt(userId))) {
                                notifs = await sql`
                                    SELECT * FROM gate_notifications
                                    WHERE (user_id = ${parseInt(userId)} OR user_id IS NULL) AND is_read = 0
                                    ORDER BY created_at DESC LIMIT 50
                                `;
                            } else {
                                notifs = await sql`
                                    SELECT * FROM gate_notifications
                                    WHERE is_read = 0
                                    ORDER BY created_at DESC LIMIT 50
                                `;
                            }
                            return new Response(JSON.stringify({ notifications: notifs || [] }), { headers });
                        } catch (e) { console.error('[NOTIFICATIONS GET] error:', e.message); }
                    }
                    return new Response(JSON.stringify({ notifications: [] }), { headers });
                }

                if (url.pathname === '/api/notifications/read' && request.method === 'POST') {
                    const data = await request.json();
                    if (sql) {
                        try {
                            if (data.id) {
                                await sql`UPDATE gate_notifications SET is_read = 1 WHERE id = ${data.id}`;
                            } else if (data.user_id) {
                                await sql`UPDATE gate_notifications SET is_read = 1 WHERE user_id = ${data.user_id} OR user_id IS NULL`;
                            } else {
                                await sql`UPDATE gate_notifications SET is_read = 1`;
                            }
                        } catch (e) {}
                    }
                    return new Response(JSON.stringify({ success: true }), { headers });
                }

                return new Response(JSON.stringify({ error: 'Endpoint not found', path: url.pathname }), { status: 404, headers });

            } catch (err) {
                console.error('[WORKER ERROR]:', err);
                return new Response(JSON.stringify({ error: 'Internal Server Error', message: err.message }), { status: 500, headers });
            }
        }

        // Static Asset Fallback
        return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not Found', { status: 404 });
    }
};

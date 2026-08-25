// Cloudflare Pages Functions / Workers Backend Handler (DOTRA Edition)
// معالج سحابة كلاود فلير وربط قاعدة البيانات D1 مع تكامل كامل للواجهة الأمامية

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // API Route handling
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
                const db = env.DB;

                // 1. GET & POST /api/vehicles
                if (url.pathname === '/api/vehicles') {
                    if (request.method === 'GET') {
                        if (db) {
                            const { results } = await db.prepare("SELECT * FROM vehicles ORDER BY id DESC").all();
                            return new Response(JSON.stringify(results || []), { headers });
                        }
                        return new Response(JSON.stringify([]), { headers });
                    }
                    if (request.method === 'POST') {
                        const data = await request.json();
                        if (db) {
                            const res = await db.prepare(`
                                INSERT INTO vehicles (plate_ar, plate_en, vehicle_type, driver_name_ar, driver_name_en, driver_phone, company_ar, company_en, status)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `).bind(
                                data.plate_ar, data.plate_en || data.plate_ar, data.vehicle_type || 'truckHeavy',
                                data.driver_name_ar || 'سائق مصرح', data.driver_name_en || 'Authorized Driver',
                                data.driver_phone || '', data.company_ar || 'توريدات عامة', data.company_en || 'General Supplies',
                                data.status || 'visitor'
                            ).run();
                            return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), { headers });
                        }
                        return new Response(JSON.stringify({ success: true, id: Date.now() }), { headers });
                    }
                }

                // 2. GET & POST /api/permits
                if (url.pathname === '/api/permits') {
                    if (request.method === 'GET') {
                        if (db) {
                            const { results } = await db.prepare("SELECT * FROM permits WHERE status = 'active' ORDER BY id DESC").all();
                            return new Response(JSON.stringify(results || []), { headers });
                        }
                        return new Response(JSON.stringify([]), { headers });
                    }
                    if (request.method === 'POST') {
                        const data = await request.json();
                        const permitCode = data.permit_code || `PER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
                        if (db) {
                            const res = await db.prepare(`
                                INSERT INTO permits (permit_code, vehicle_id, destination_ar, destination_en, purpose_ar, purpose_en, cargo_details, valid_from, valid_until, created_by)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `).bind(
                                permitCode, data.vehicle_id,
                                data.destination_ar || 'المستودع الرئيسي', data.destination_en || 'Main Plant',
                                data.purpose_ar || 'تصريح دخول سريع', data.purpose_en || 'Fast Entry Pass',
                                data.cargo_details || 'بضائع مصرحة',
                                data.valid_from || new Date().toISOString(),
                                data.valid_until || new Date(Date.now() + 8 * 3600000).toISOString(),
                                data.created_by || 1
                            ).run();
                            return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id, permit_code: permitCode }), { headers });
                        }
                        return new Response(JSON.stringify({ success: true, id: Date.now(), permit_code: permitCode }), { headers });
                    }
                }

                // 3. POST /api/entry (Log vehicle entry)
                if (url.pathname === '/api/entry' && request.method === 'POST') {
                    const data = await request.json();
                    if (db) {
                        const res = await db.prepare(`
                            INSERT INTO access_logs (vehicle_id, permit_id, officer_id, gate_name, action_type, timestamp, remarks)
                            VALUES (?, ?, ?, ?, 'entry', CURRENT_TIMESTAMP, ?)
                        `).bind(data.vehicle_id, data.permit_id || null, data.officer_id || 2, data.gate_name || 'بوابة 1 الرئيسية', data.remarks || '').run();
                        return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), { headers });
                    }
                    return new Response(JSON.stringify({ success: true, id: Date.now(), timestamp: new Date().toISOString() }), { headers });
                }

                // 4. POST /api/exit (Log vehicle exit)
                if (url.pathname === '/api/exit' && request.method === 'POST') {
                    const data = await request.json();
                    if (db) {
                        await db.prepare(`
                            UPDATE access_logs 
                            SET exit_timestamp = CURRENT_TIMESTAMP,
                                duration_minutes = ROUND((JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(timestamp)) * 1440)
                            WHERE vehicle_id = ? AND action_type = 'entry' AND exit_timestamp IS NULL
                        `).bind(data.vehicle_id).run();
                        return new Response(JSON.stringify({ success: true }), { headers });
                    }
                    return new Response(JSON.stringify({ success: true, exit_timestamp: new Date().toISOString() }), { headers });
                }

                // 5. GET /api/logs (Live access logs)
                if (url.pathname === '/api/logs' && request.method === 'GET') {
                    if (db) {
                        const { results } = await db.prepare("SELECT * FROM access_logs ORDER BY id DESC LIMIT 100").all();
                        return new Response(JSON.stringify(results || []), { headers });
                    }
                    return new Response(JSON.stringify([]), { headers });
                }

                // 6. GET & POST /api/sync (Full Cloud Sync across PC, Mobile, Tablets)
                if (url.pathname === '/api/sync') {
                    if (request.method === 'GET') {
                        if (db) {
                            const vehicles = (await db.prepare("SELECT * FROM vehicles ORDER BY id DESC").all()).results || [];
                            const permits = (await db.prepare("SELECT * FROM permits ORDER BY id DESC").all()).results || [];
                            const logs = (await db.prepare("SELECT * FROM access_logs ORDER BY id DESC LIMIT 200").all()).results || [];
                            return new Response(JSON.stringify({ vehicles, permits, logs }), { headers });
                        }
                        return new Response(JSON.stringify({ vehicles: [], permits: [], logs: [] }), { headers });
                    }
                    if (request.method === 'POST') {
                        return new Response(JSON.stringify({ success: true, synced_at: new Date().toISOString() }), { headers });
                    }
                }

                return new Response(JSON.stringify({ status: 'ok', message: 'DOTRA Cloudflare Gate API' }), { headers });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
            }
        }

        // Serve static assets via Cloudflare Pages
        return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    }
};

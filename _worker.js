// Cloudflare Pages Functions / Workers Backend Handler
// معالج سحابة كلاود فلير وربط قاعدة البيانات D1

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
                // Check if D1 database is bound (env.DB)
                const db = env.DB;

                // 1. GET /api/vehicles
                if (url.pathname === '/api/vehicles' && request.method === 'GET') {
                    if (db) {
                        const { results } = await db.prepare("SELECT * FROM vehicles ORDER BY id DESC").all();
                        return new Response(JSON.stringify(results), { headers });
                    }
                    return new Response(JSON.stringify({ status: 'ok', source: 'edge-mock' }), { headers });
                }

                // 2. GET /api/permits
                if (url.pathname === '/api/permits' && request.method === 'GET') {
                    if (db) {
                        const { results } = await db.prepare("SELECT * FROM permits WHERE status = 'active' ORDER BY id DESC").all();
                        return new Response(JSON.stringify(results), { headers });
                    }
                    return new Response(JSON.stringify({ status: 'ok', source: 'edge-mock' }), { headers });
                }

                // 3. POST /api/entry (Log vehicle entry)
                if (url.pathname === '/api/entry' && request.method === 'POST') {
                    const data = await request.json();
                    if (db) {
                        const res = await db.prepare(`
                            INSERT INTO access_logs (vehicle_id, permit_id, officer_id, gate_name, action_type, timestamp, remarks)
                            VALUES (?, ?, ?, ?, 'entry', CURRENT_TIMESTAMP, ?)
                        `).bind(data.vehicle_id, data.permit_id, data.officer_id, data.gate_name, data.remarks || '').run();
                        return new Response(JSON.stringify({ success: true, id: res.meta.last_row_id }), { headers });
                    }
                    return new Response(JSON.stringify({ success: true, timestamp: new Date().toISOString() }), { headers });
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

                // 5. POST /api/permits/new (Issue new permit)
                if (url.pathname === '/api/permits/new' && request.method === 'POST') {
                    const data = await request.json();
                    const permitCode = `PER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
                    if (db) {
                        await db.prepare(`
                            INSERT INTO permits (permit_code, vehicle_id, destination_ar, destination_en, purpose_ar, purpose_en, cargo_details, valid_from, valid_until, created_by)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).bind(
                            permitCode, data.vehicle_id, data.destination_ar, data.destination_en,
                            data.purpose_ar, data.purpose_en, data.cargo_details, data.valid_from, data.valid_until, data.created_by
                        ).run();
                    }
                    return new Response(JSON.stringify({ success: true, permit_code: permitCode }), { headers });
                }

                // Fallback API response
                return new Response(JSON.stringify({ status: 'active', message: 'Cloudflare Gate Access API' }), { headers });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
            }
        }

        // Serve static asset via Cloudflare Pages
        return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not found', { status: 404 });
    }
};

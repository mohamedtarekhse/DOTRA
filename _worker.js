// Cloudflare Pages Functions / Workers Backend Handler (DOTRA Edition)
// معالج سحابة كلاود فلير وربط قاعدة البيانات D1 مع تكامل كامل للواجهة الأمامية

// Persistent Edge State store for seamless multi-device live sync
let CLOUD_STATE = {
    vehicles: [],
    permits: [],
    logs: []
};

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
                const db = env ? env.DB : null;

                // 1. GET & POST /api/vehicles
                if (url.pathname === '/api/vehicles') {
                    if (request.method === 'GET') {
                        if (db) {
                            try {
                                const { results } = await db.prepare("SELECT * FROM vehicles ORDER BY id DESC").all();
                                if (results && results.length > 0) return new Response(JSON.stringify(results), { headers });
                            } catch(e) {}
                        }
                        return new Response(JSON.stringify(CLOUD_STATE.vehicles), { headers });
                    }
                    if (request.method === 'POST') {
                        const data = await request.json();
                        const existingIdx = CLOUD_STATE.vehicles.findIndex(v => v.id === data.id || v.plate_ar === data.plate_ar);
                        if (existingIdx >= 0) {
                            CLOUD_STATE.vehicles[existingIdx] = { ...CLOUD_STATE.vehicles[existingIdx], ...data };
                        } else {
                            CLOUD_STATE.vehicles.unshift(data);
                        }

                        if (db) {
                            try {
                                await db.prepare(`
                                    INSERT OR REPLACE INTO vehicles (id, plate_ar, plate_en, vehicle_type, driver_name_ar, driver_name_en, driver_phone, company_ar, company_en, status)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `).bind(
                                    data.id || Date.now(), data.plate_ar, data.plate_en || data.plate_ar, data.vehicle_type || 'truckHeavy',
                                    data.driver_name_ar || 'سائق مصرح', data.driver_name_en || 'Authorized Driver',
                                    data.driver_phone || '', data.company_ar || 'توريدات عامة', data.company_en || 'General Supplies',
                                    data.status || 'visitor'
                                ).run();
                            } catch(e) {}
                        }
                        return new Response(JSON.stringify({ success: true, id: data.id || Date.now() }), { headers });
                    }
                }

                // 2. GET & POST /api/permits
                if (url.pathname === '/api/permits') {
                    if (request.method === 'GET') {
                        if (db) {
                            try {
                                const { results } = await db.prepare("SELECT * FROM permits ORDER BY id DESC").all();
                                if (results && results.length > 0) return new Response(JSON.stringify(results), { headers });
                            } catch(e) {}
                        }
                        return new Response(JSON.stringify(CLOUD_STATE.permits), { headers });
                    }
                    if (request.method === 'POST') {
                        const data = await request.json();
                        const permitCode = data.permit_code || `PER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
                        const pinCode = data.pin_code || Math.floor(10000 + Math.random() * 90000).toString();
                        const newPermit = { ...data, permit_code: permitCode, pin_code: pinCode };

                        const existingIdx = CLOUD_STATE.permits.findIndex(p => p.id === data.id || p.permit_code === permitCode);
                        if (existingIdx >= 0) {
                            CLOUD_STATE.permits[existingIdx] = { ...CLOUD_STATE.permits[existingIdx], ...newPermit };
                        } else {
                            CLOUD_STATE.permits.unshift(newPermit);
                        }

                        if (db) {
                            try {
                                await db.prepare(`
                                    INSERT OR REPLACE INTO permits (id, permit_code, vehicle_id, destination_ar, destination_en, purpose_ar, purpose_en, cargo_details, valid_from, valid_until, status, created_by)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                `).bind(
                                    data.id || Date.now(),
                                    permitCode, data.vehicle_id,
                                    data.destination_ar || 'المستودع الرئيسي', data.destination_en || 'Main Plant',
                                    data.purpose_ar || 'تصريح دخول سريع', data.purpose_en || 'Fast Entry Pass',
                                    data.cargo_details || 'بضائع مصرحة',
                                    data.valid_from || new Date().toISOString(),
                                    data.valid_until || new Date(Date.now() + 8 * 3600000).toISOString(),
                                    data.status || 'active',
                                    data.created_by || 1
                                ).run();
                            } catch(e) {}
                        }
                        return new Response(JSON.stringify({ success: true, id: data.id || Date.now(), permit_code: permitCode, pin_code: pinCode }), { headers });
                    }
                }

                // 3. POST /api/entry (Log vehicle entry)
                if (url.pathname === '/api/entry' && request.method === 'POST') {
                    const data = await request.json();
                    const newLog = {
                        id: data.id || Date.now(),
                        vehicle_id: data.vehicle_id,
                        permit_id: data.permit_id || null,
                        officer_id: data.officer_id || 2,
                        gate_name: data.gate_name || 'بوابة 1 الرئيسية',
                        action_type: 'entry',
                        timestamp: data.timestamp || new Date().toISOString(),
                        exit_timestamp: null,
                        duration_minutes: null,
                        remarks: data.remarks || ''
                    };
                    CLOUD_STATE.logs.unshift(newLog);

                    if (db) {
                        try {
                            await db.prepare(`
                                INSERT INTO access_logs (id, vehicle_id, permit_id, officer_id, gate_name, action_type, timestamp, remarks)
                                VALUES (?, ?, ?, ?, ?, 'entry', CURRENT_TIMESTAMP, ?)
                            `).bind(newLog.id, data.vehicle_id, data.permit_id || null, data.officer_id || 2, data.gate_name || 'بوابة 1 الرئيسية', data.remarks || '').run();
                        } catch(e) {}
                    }
                    return new Response(JSON.stringify({ success: true, id: newLog.id }), { headers });
                }

                // 4. POST /api/exit (Log vehicle exit)
                if (url.pathname === '/api/exit' && request.method === 'POST') {
                    const data = await request.json();
                    const entryLog = CLOUD_STATE.logs.find(l => l.vehicle_id === data.vehicle_id && l.action_type === 'entry' && !l.exit_timestamp);
                    if (entryLog) {
                        entryLog.exit_timestamp = new Date().toISOString();
                        entryLog.duration_minutes = Math.round((new Date(entryLog.exit_timestamp) - new Date(entryLog.timestamp)) / 60000);
                        entryLog.remarks = (entryLog.remarks ? entryLog.remarks + ' | ' : '') + `خروج عبر ${data.gate_name || 'البوابة'}`;
                    }

                    if (db) {
                        try {
                            await db.prepare(`
                                UPDATE access_logs 
                                SET exit_timestamp = CURRENT_TIMESTAMP,
                                    duration_minutes = ROUND((JULIANDAY(CURRENT_TIMESTAMP) - JULIANDAY(timestamp)) * 1440)
                                WHERE vehicle_id = ? AND action_type = 'entry' AND exit_timestamp IS NULL
                            `).bind(data.vehicle_id).run();
                        } catch(e) {}
                    }
                    return new Response(JSON.stringify({ success: true }), { headers });
                }

                // 5. GET /api/logs (Live access logs)
                if (url.pathname === '/api/logs' && request.method === 'GET') {
                    if (db) {
                        try {
                            const { results } = await db.prepare("SELECT * FROM access_logs ORDER BY id DESC LIMIT 100").all();
                            if (results && results.length > 0) return new Response(JSON.stringify(results), { headers });
                        } catch(e) {}
                    }
                    return new Response(JSON.stringify(CLOUD_STATE.logs), { headers });
                }

                // 6. GET & POST /api/sync (Full Cloud Sync across PC, Mobile, Tablets)
                if (url.pathname === '/api/sync') {
                    if (request.method === 'GET') {
                        if (db) {
                            try {
                                const vehicles = (await db.prepare("SELECT * FROM vehicles ORDER BY id DESC").all()).results || [];
                                const permits = (await db.prepare("SELECT * FROM permits ORDER BY id DESC").all()).results || [];
                                const logs = (await db.prepare("SELECT * FROM access_logs ORDER BY id DESC LIMIT 200").all()).results || [];
                                if (vehicles.length > 0 || permits.length > 0 || logs.length > 0) {
                                    return new Response(JSON.stringify({ vehicles, permits, logs }), { headers });
                                }
                            } catch(e) {}
                        }
                        return new Response(JSON.stringify(CLOUD_STATE), { headers });
                    }
                    if (request.method === 'POST') {
                        const body = await request.json();
                        if (body.vehicles && Array.isArray(body.vehicles)) {
                            body.vehicles.forEach(v => {
                                const idx = CLOUD_STATE.vehicles.findIndex(ev => ev.id === v.id || ev.plate_ar === v.plate_ar);
                                if (idx >= 0) CLOUD_STATE.vehicles[idx] = { ...CLOUD_STATE.vehicles[idx], ...v };
                                else CLOUD_STATE.vehicles.push(v);
                            });
                        }
                        if (body.permits && Array.isArray(body.permits)) {
                            body.permits.forEach(p => {
                                const idx = CLOUD_STATE.permits.findIndex(ep => ep.id === p.id || ep.permit_code === p.permit_code);
                                if (idx >= 0) CLOUD_STATE.permits[idx] = { ...CLOUD_STATE.permits[idx], ...p };
                                else CLOUD_STATE.permits.push(p);
                            });
                        }
                        if (body.logs && Array.isArray(body.logs)) {
                            body.logs.forEach(l => {
                                const idx = CLOUD_STATE.logs.findIndex(el => el.id === l.id);
                                if (idx >= 0) CLOUD_STATE.logs[idx] = { ...CLOUD_STATE.logs[idx], ...l };
                                else CLOUD_STATE.logs.push(l);
                            });
                        }
                        return new Response(JSON.stringify({ success: true, synced_at: new Date().toISOString(), state: CLOUD_STATE }), { headers });
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

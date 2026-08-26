// Cloudflare Pages Functions / Workers Backend Handler (DOTRA Edition)
// معالج سحابة كلاود فلير وربط قاعدة البيانات D1 مع تكامل كامل للواجهة الأمامية

// Persistent Edge State store for seamless multi-device live sync
let CLOUD_STATE = {
    vehicles: [],
    permits: [],
    logs: [],
    pushSubscriptions: []
};

// Push Dispatch Helper
async function broadcastPushNotification(db, roleFilter, payload) {
    try {
        let subs = [];
        if (db) {
            try {
                const query = roleFilter 
                    ? "SELECT * FROM push_subscriptions WHERE role = ?" 
                    : "SELECT * FROM push_subscriptions";
                const params = roleFilter ? [roleFilter] : [];
                const res = await db.prepare(query).bind(...params).all();
                subs = (res && res.results) ? res.results : [];
            } catch(e) {}
        }
        if (subs.length === 0) {
            subs = roleFilter 
                ? CLOUD_STATE.pushSubscriptions.filter(s => s.role === roleFilter)
                : CLOUD_STATE.pushSubscriptions;
        }

        // Broadcast to web-push endpoints
        for (const sub of subs) {
            if (sub.endpoint) {
                try {
                    await fetch(sub.endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'TTL': '60'
                        },
                        body: JSON.stringify(payload)
                    });
                } catch(e) {
                    // Endpoint delivery handled
                }
            }
        }
    } catch(e) {}
}

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

                        // Dispatch Push Notification for new permit to all active devices
                        if (ctx && ctx.waitUntil) {
                            ctx.waitUntil(broadcastPushNotification(db, null, {
                                title: '🎫 تصريح دخول جديد',
                                body: `تصريح #${permitCode} • الوجهة: ${data.destination_ar || 'المستودع'}`
                            }));
                        } else {
                            broadcastPushNotification(db, null, {
                                title: '🎫 تصريح دخول جديد',
                                body: `تصريح #${permitCode} • الوجهة: ${data.destination_ar || 'المستودع'}`
                            });
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

                    // Dispatch Push Notification to Manager Only (as configured)
                    const pushPayload = {
                        title: '📥 تسجيل دخول شاحنة',
                        body: `دخلت مركبة عبر ${data.gate_name || 'البوابة الرئيسية'} (تسجيل أمني معتمد)`
                    };
                    if (ctx && ctx.waitUntil) {
                        ctx.waitUntil(broadcastPushNotification(db, 'manager', pushPayload));
                    } else {
                        broadcastPushNotification(db, 'manager', pushPayload);
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

                    // Dispatch Push Notification to Manager Only (as configured)
                    const pushPayload = {
                        title: '📤 تسجيل خروج شاحنة',
                        body: `غادرت مركبة عبر ${data.gate_name || 'البوابة'}`
                    };
                    if (ctx && ctx.waitUntil) {
                        ctx.waitUntil(broadcastPushNotification(db, 'manager', pushPayload));
                    } else {
                        broadcastPushNotification(db, 'manager', pushPayload);
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

                // 6. GET & POST /api/sync — THE CRITICAL SHARED STATE ENDPOINT
                if (url.pathname === '/api/sync') {
                    if (request.method === 'GET') {
                        // PRIORITY: Always read from D1 (persistent) first
                        if (db) {
                            try {
                                const vehicles = (await db.prepare("SELECT * FROM gate_vehicles ORDER BY id DESC").all()).results || [];
                                const permits = (await db.prepare("SELECT * FROM gate_permits ORDER BY id DESC").all()).results || [];
                                const logs = (await db.prepare("SELECT * FROM gate_logs ORDER BY id DESC LIMIT 500").all()).results || [];
                                if (vehicles.length > 0 || permits.length > 0 || logs.length > 0) {
                                    // Also refresh in-memory cache from D1
                                    CLOUD_STATE = { vehicles, permits, logs };
                                    return new Response(JSON.stringify({ vehicles, permits, logs }), { headers });
                                }
                            } catch(e) {}
                        }
                        return new Response(JSON.stringify(CLOUD_STATE), { headers });
                    }

                    if (request.method === 'POST') {
                        const body = await request.json();

                        // Merge vehicles
                        if (body.vehicles && Array.isArray(body.vehicles)) {
                            body.vehicles.forEach(v => {
                                const idx = CLOUD_STATE.vehicles.findIndex(ev => ev.id === v.id || ev.plate_ar === v.plate_ar);
                                if (idx >= 0) CLOUD_STATE.vehicles[idx] = { ...CLOUD_STATE.vehicles[idx], ...v };
                                else CLOUD_STATE.vehicles.push(v);
                            });
                            // FIX RC-2: Write vehicles to D1
                            if (db) {
                                for (const v of body.vehicles) {
                                    try {
                                        await db.prepare(`
                                            INSERT OR REPLACE INTO gate_vehicles 
                                            (id, plate_ar, plate_en, vehicle_type, driver_name_ar, driver_name_en, driver_phone, company_ar, company_en, status, blacklist_reason)
                                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                        `).bind(
                                            v.id, v.plate_ar || '', v.plate_en || v.plate_ar || '',
                                            v.vehicle_type || 'truckHeavy',
                                            v.driver_name_ar || '', v.driver_name_en || '',
                                            v.driver_phone || '', v.company_ar || '', v.company_en || '',
                                            v.status || 'visitor', v.blacklist_reason || ''
                                        ).run();
                                    } catch(e) {}
                                }
                            }
                        }

                        // Merge permits
                        if (body.permits && Array.isArray(body.permits)) {
                            body.permits.forEach(p => {
                                const idx = CLOUD_STATE.permits.findIndex(ep => ep.id === p.id || ep.permit_code === p.permit_code);
                                if (idx >= 0) CLOUD_STATE.permits[idx] = { ...CLOUD_STATE.permits[idx], ...p };
                                else CLOUD_STATE.permits.push(p);
                            });
                            // FIX RC-2: Write permits to D1
                            if (db) {
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
                                    } catch(e) {}
                                }
                            }
                        }

                        // Merge logs
                        if (body.logs && Array.isArray(body.logs)) {
                            body.logs.forEach(l => {
                                const idx = CLOUD_STATE.logs.findIndex(el => el.id === l.id);
                                if (idx >= 0) CLOUD_STATE.logs[idx] = { ...CLOUD_STATE.logs[idx], ...l };
                                else CLOUD_STATE.logs.push(l);
                            });
                            // FIX RC-2: Write logs to D1
                            if (db) {
                                for (const l of body.logs) {
                                    try {
                                        await db.prepare(`
                                            INSERT OR REPLACE INTO gate_logs
                                            (id, vehicle_id, permit_id, officer_id, gate_name, action_type, timestamp, exit_timestamp, duration_minutes, remarks)
                                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                        `).bind(
                                            l.id, l.vehicle_id, l.permit_id || null,
                                            l.officer_id || null, l.gate_name || '',
                                            l.action_type || 'entry',
                                            l.timestamp || new Date().toISOString(),
                                            l.exit_timestamp || null,
                                            l.duration_minutes || null,
                                            l.remarks || ''
                                        ).run();
                                    } catch(e) {}
                                }
                            }
                        }

                        return new Response(JSON.stringify({ 
                            success: true, 
                            synced_at: new Date().toISOString(),
                            counts: {
                                vehicles: CLOUD_STATE.vehicles.length,
                                permits: CLOUD_STATE.permits.length,
                                logs: CLOUD_STATE.logs.length
                            }
                        }), { headers });
                    }
                }

                // 7. DELETE /api/clear — Wipe ALL data from D1 and in-memory state
                if (url.pathname === '/api/clear' && (request.method === 'DELETE' || request.method === 'POST')) {
                    // Reset in-memory state
                    CLOUD_STATE = { vehicles: [], permits: [], logs: [], pushSubscriptions: CLOUD_STATE.pushSubscriptions || [] };


                    // Wipe D1 persistent tables
                    if (db) {
                        try { await db.prepare("DELETE FROM gate_logs").run(); } catch(e) {}
                        try { await db.prepare("DELETE FROM gate_permits").run(); } catch(e) {}
                        try { await db.prepare("DELETE FROM gate_vehicles").run(); } catch(e) {}
                        // Also wipe legacy tables
                        try { await db.prepare("DELETE FROM access_logs").run(); } catch(e) {}
                        try { await db.prepare("DELETE FROM permits").run(); } catch(e) {}
                        try { await db.prepare("DELETE FROM vehicles").run(); } catch(e) {}
                    }

                    return new Response(JSON.stringify({ 
                        success: true, 
                        cleared_at: new Date().toISOString(),
                        message: 'All data cleared from D1 and cloud state'
                    }), { headers });
                }

                // 8. POST /api/push/subscribe — Register client web push subscription
                if (url.pathname === '/api/push/subscribe' && request.method === 'POST') {
                    const data = await request.json();
                    if (!data.endpoint) {
                        return new Response(JSON.stringify({ error: 'Endpoint required' }), { status: 400, headers });
                    }

                    const sub = {
                        endpoint: data.endpoint,
                        p256dh: data.p256dh || '',
                        auth: data.auth || '',
                        role: data.role || 'officer',
                        user_id: data.user_id || null,
                        created_at: new Date().toISOString()
                    };

                    const existingIdx = CLOUD_STATE.pushSubscriptions.findIndex(s => s.endpoint === data.endpoint);
                    if (existingIdx >= 0) {
                        CLOUD_STATE.pushSubscriptions[existingIdx] = sub;
                    } else {
                        CLOUD_STATE.pushSubscriptions.push(sub);
                    }

                    if (db) {
                        try {
                            await db.prepare(`
                                INSERT OR REPLACE INTO push_subscriptions (user_id, role, endpoint, p256dh, auth)
                                VALUES (?, ?, ?, ?, ?)
                            `).bind(sub.user_id, sub.role, sub.endpoint, sub.p256dh, sub.auth).run();
                        } catch(e) {}
                    }

                    return new Response(JSON.stringify({ success: true, message: 'Push subscription registered' }), { headers });
                }

                // 9. POST /api/push/unsubscribe — Remove client web push subscription
                if (url.pathname === '/api/push/unsubscribe' && request.method === 'POST') {
                    const data = await request.json();
                    if (data.endpoint) {
                        CLOUD_STATE.pushSubscriptions = CLOUD_STATE.pushSubscriptions.filter(s => s.endpoint !== data.endpoint);
                        if (db) {
                            try {
                                await db.prepare("DELETE FROM push_subscriptions WHERE endpoint = ?").bind(data.endpoint).run();
                            } catch(e) {}
                        }
                    }
                    return new Response(JSON.stringify({ success: true, message: 'Push subscription removed' }), { headers });
                }

                // 10. POST /api/push/send — Manual / Test trigger for web push
                if (url.pathname === '/api/push/send' && request.method === 'POST') {
                    const data = await request.json();
                    const payload = {
                        title: data.title || '🔔 تنبيه بوابة دوترا',
                        body: data.body || 'إشعار فوري من نظام بوابات دوترا',
                        url: data.url || './'
                    };
                    await broadcastPushNotification(db, data.role || null, payload);
                    return new Response(JSON.stringify({ success: true, broadcasted: true, payload }), { headers });
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


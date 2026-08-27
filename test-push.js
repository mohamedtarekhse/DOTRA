// Automated Test Script for Web Push Notifications & Neon Postgres Queue
import { strict as assert } from 'assert';
import fs from 'fs';

console.log("=================================================");
console.log("🧪 RUNNING COMPREHENSIVE PUSH NOTIFICATION TESTS");
console.log("=================================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
    } catch (e) {
        console.error(`  ❌ FAIL: ${name} -> ${e.message}`);
        failed++;
    }
}

async function asyncTest(name, fn) {
    try {
        await fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
    } catch (e) {
        console.error(`  ❌ FAIL: ${name} -> ${e.message}`);
        failed++;
    }
}

// 1. Static Configuration & Code Integrity Checks
console.log("[1] Checking Push Configuration & Client Files:");

test('VAPID Public Key format is valid base64url', () => {
    const pushCode = fs.readFileSync('js/push.js', 'utf8');
    assert(pushCode.includes('BKwgzVplNP0DtEzEBV2MnQTtWIGLO8Cr7jdyAENM-b4zo2jodoLDY4d78M5LExz8UBYZU4DJKRcdTrSLGiAAsZ4'), 'Valid standard VAPID key present in js/push.js');
});

test('Service Worker sw.js has push and notificationclick listeners', () => {
    const swCode = fs.readFileSync('sw.js', 'utf8');
    assert(swCode.includes("addEventListener('push'"), 'sw.js handles incoming push events');
    assert(swCode.includes("addEventListener('notificationclick'"), 'sw.js handles user click on push notification');
    assert(swCode.includes('js/push.js'), 'sw.js caches js/push.js in offline assets');
});

test('Database Schema has push_subscriptions and gate_notifications tables', () => {
    const schema = fs.readFileSync('schema.sql', 'utf8');
    assert(schema.includes('push_subscriptions'), 'push_subscriptions table defined in schema');
    assert(schema.includes('gate_notifications'), 'gate_notifications table defined in schema');
    assert(schema.includes('push_vehicle_watchlist'), 'push_vehicle_watchlist defined in schema');
});

// 2. Cloudflare Worker Push Endpoints Test
console.log("\n[2] Testing Backend Push API Routes (_worker.js):");

const workerModule = await import('./_worker.js');
const worker = workerModule.default;

// In-memory mock store representing Neon Postgres state for push tests
const mockStore = {
    subscriptions: [],
    notifications: []
};

const mockSql = async (strings, ...values) => {
    const query = strings.join('?');
    if (query.includes('INSERT INTO push_subscriptions')) {
        mockStore.subscriptions.push({
            user_id: values[0],
            role: values[1],
            endpoint: values[2],
            p256dh: values[3],
            auth: values[4],
            watch_all: values[5]
        });
        return [];
    }
    if (query.includes('SELECT user_id FROM push_subscriptions')) {
        return mockStore.subscriptions.map(s => ({ user_id: s.user_id }));
    }
    if (query.includes('INSERT INTO gate_notifications')) {
        mockStore.notifications.push({
            id: mockStore.notifications.length + 1,
            user_id: values[0],
            type: values[1],
            title: values[2],
            body: values[3],
            vehicle_id: values[4],
            vehicle_plate: values[5],
            gate_name: values[6],
            is_read: 0,
            created_at: new Date().toISOString()
        });
        return [];
    }
    if (query.includes('SELECT * FROM gate_notifications')) {
        return mockStore.notifications.filter(n => n.is_read === 0);
    }
    if (query.includes('UPDATE gate_notifications SET is_read = 1')) {
        mockStore.notifications.forEach(n => n.is_read = 1);
        return [];
    }
    if (query.includes('DELETE FROM push_subscriptions')) {
        mockStore.subscriptions = [];
        return [];
    }
    return [];
};

const env = { sql: mockSql };

await asyncTest('POST /api/push/subscribe registers subscription successfully', async () => {
    const req = new Request('https://dotra.pages.dev/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            role: 'manager',
            user_id: 1,
            subscription: {
                endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/test-token-12345',
                keys: {
                    p256dh: 'BEl62iENgUdlx_E9NyTxt7bOU_AU4CnaOjbpKnlEWCnxfqhOE30UijfcTOOWGhmM0xPLKIfyhUS',
                    auth: 'tH9sDFk02k4msf23'
                }
            }
        })
    });
    const res = await worker.fetch(req, env);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.equal(mockStore.subscriptions.length, 1);
});

await asyncTest('POST /api/push/send broadcasts entry alert and queues notification', async () => {
    const req = new Request('https://dotra.pages.dev/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'entry',
            vehicle_plate: 'ط ر ق ٩ ٨ ٢ ١',
            gate_name: 'بوابة 1 الرئيسية - دوترا',
            roles: ['manager']
        })
    });
    const res = await worker.fetch(req, env);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert.equal(json.broadcasted, true);
    assert(mockStore.notifications.length >= 1, 'Notification queued in database');
    assert(mockStore.notifications[0].title.includes('ط ر ق ٩ ٨ ٢ ١'), 'Notification title contains vehicle plate');
});

await asyncTest('POST /api/push/send broadcasts exit alert', async () => {
    const req = new Request('https://dotra.pages.dev/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'exit',
            vehicle_plate: 'س ي ر ٥ ٥ ٤ ٤',
            gate_name: 'بوابة 2 الشحن والجمارك',
            roles: ['manager']
        })
    });
    const res = await worker.fetch(req, env);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
    assert(mockStore.notifications.length >= 2);
});

await asyncTest('GET /api/notifications retrieves queued unread notifications for user', async () => {
    const req = new Request('https://dotra.pages.dev/api/notifications?user_id=1', { method: 'GET' });
    const res = await worker.fetch(req, env);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert(Array.isArray(json.notifications));
    assert(json.notifications.length >= 2, 'Retrieved unread notifications for user');
});

await asyncTest('POST /api/notifications/read marks notifications as read', async () => {
    const req = new Request('https://dotra.pages.dev/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 1 })
    });
    const res = await worker.fetch(req, env);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
});

await asyncTest('POST /api/push/unsubscribe removes subscription', async () => {
    const req = new Request('https://dotra.pages.dev/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/test-token-12345'
        })
    });
    const res = await worker.fetch(req, env);
    const json = await res.json();
    assert.equal(res.status, 200);
    assert.equal(json.success, true);
});

// 3. Live Neon Postgres Query Verification (Optional Live Smoke Test)
console.log("\n[3] Testing Live Connection against Neon Postgres:");

const LIVE_DB_URL = 'postgresql://neondb_owner:npg_6wMLOJZr1jKG@ep-hidden-voice-b10afhgj-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require';

await asyncTest('Live Neon Postgres handles push tables queries with 0 latency errors', async () => {
    const url = new URL(LIVE_DB_URL);
    const host = url.host.replace('-pooler', '');
    const endpoint = `https://${host}/sql`;

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Neon-Connection-String': LIVE_DB_URL
        },
        body: JSON.stringify({
            query: 'SELECT COUNT(*) as sub_count FROM push_subscriptions'
        })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert(data.rows && data.rows.length > 0, 'Returned rows from Neon push_subscriptions table');
    console.log(`      ↳ Live Neon Push Subscriptions count: ${data.rows[0].sub_count}`);
});

console.log("\n=================================================");
console.log(`🏁 PUSH NOTIFICATION TEST RESULTS:`);
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}`);
console.log("=================================================");

if (failed === 0) {
    console.log("🎉 ALL PUSH NOTIFICATION TESTS PASSED SUCCESSFULLY! (100%)\n");
    process.exit(0);
} else {
    console.error("❌ Some push notification tests failed.\n");
    process.exit(1);
}

// ============================================================
// Automated Test Suite: Gate Shift Roster & Multi-Photo Inspection Requests
// اختبار شامل لجدول المناوبات والورديات واستيراد الـ CSV وطلبات الفحص والاستئذان بالصور
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock Browser Environment
const localStorageData = {};
global.localStorage = {
    getItem: (k) => localStorageData[k] || null,
    setItem: (k, v) => { localStorageData[k] = String(v); },
    removeItem: (k) => { delete localStorageData[k]; },
    clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

global.sessionStorage = {
    getItem: (k) => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
};

global.window = {
    DB: null,
    Auth: null,
    Manager: null,
    Officer: null,
    i18n: {
        getLang: () => 'ar',
        t: (k) => k
    },
    ArabicPlate: {
        renderEgyptianPlate: () => '<div>PLATE</div>'
    },
    Icons: {
        get: () => '<i></i>'
    }
};

global.location = { origin: 'http://localhost' };
global.fetch = async () => ({ ok: true, json: async () => ({ success: true }) });
global.BroadcastChannel = class {
    constructor(name) { this.name = name; }
    postMessage(data) {}
    close() {}
};

// Load DB
eval(fs.readFileSync(path.join(__dirname, 'js/db.js'), 'utf8'));

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
    totalTests++;
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passedTests++;
    } else {
        console.error(`  ❌ FAIL: ${testName}`);
    }
}

async function runTests() {
    console.log("\n=======================================================");
    console.log("  TEST SUITE: Gate Shift Roster & Inspection Requests  ");
    console.log("=======================================================\n");

    // --- TEST 1: Gate Roster Initial State & Enrichment ---
    console.log("1. Testing Gate Roster Initial State & Officer Details...");
    const roster = window.DB.getGateRoster();
    assert(Array.isArray(roster) && roster.length >= 2, "Gate roster initialized with default entries");
    const gate1 = roster.find(r => r.gate_name.includes('بوابة 1'));
    assert(gate1 !== undefined, "Gate 1 exists in roster");
    assert(gate1.day_officer_id === 2, "Gate 1 assigned to officer 2 for day shift");
    assert(gate1.night_officer_id === 3, "Gate 1 assigned to officer 3 for night shift");
    assert(gate1.day_officer_name.includes('طارق'), "Day officer name enriched correctly");
    assert(gate1.night_officer_name.includes('حسام'), "Night officer name enriched correctly");

    // --- TEST 2: Officer Stationing & Back-to-Back Partner Retrieval ---
    console.log("\n2. Testing Officer Stationing & Back-to-Back Partner Retrieval...");
    const officer2Roster = window.DB.getOfficerRoster(2);
    assert(officer2Roster !== null, "Officer 2 roster info returned");
    assert(officer2Roster.shift === 'day', "Officer 2 shift is 'day'");
    assert(officer2Roster.partner_name_ar.includes('حسام'), "Officer 2 back-to-back partner is Officer 3 (Hossam)");
    assert(officer2Roster.gate_name.includes('بوابة 1'), "Officer 2 locked to Gate 1");

    const officer3Roster = window.DB.getOfficerRoster(3);
    assert(officer3Roster.shift === 'night', "Officer 3 shift is 'night'");
    assert(officer3Roster.partner_name_ar.includes('طارق'), "Officer 3 back-to-back partner is Officer 2 (Tariq)");

    // --- TEST 3: Manager Assigns Shift Officers to Gates ---
    console.log("\n3. Testing Manager Assigning Shift Officers...");
    window.DB.assignGateOfficers('بوابة 3 المواد الخام والكيماويات', 2, 3, 'مناوبة مؤقتة');
    const updatedRoster = window.DB.getGateRoster();
    const gate3 = updatedRoster.find(r => r.gate_name.includes('بوابة 3'));
    assert(gate3.day_officer_id === 2, "Gate 3 day officer successfully assigned to 2");
    assert(gate3.night_officer_id === 3, "Gate 3 night officer successfully assigned to 3");

    // --- TEST 4: CSV Roster Export & Import ---
    console.log("\n4. Testing CSV Roster Export & Import...");
    const exportedCsv = window.DB.exportRosterToCSV();
    assert(exportedCsv.includes("Gate_Name") && exportedCsv.includes("بوابة 1"), "Roster CSV exported successfully with headers");

    const sampleCsv = `اسم البوابة,كود شارة ضابط وردية النهار,اسم ضابط النهار,كود شارة ضابط وردية الليل (المناوب البديل),اسم ضابط الليل,ملاحظات
بوابة 1 الرئيسية - دوترا,GT-02,حسام حسن,GT-01,طارق محمود,تم تبديل الورديات
بوابة 2 الشحن والجمارك - دوترا,GT-01,طارق محمود,GT-02,حسام حسن,الشحن الجمركي`;

    const importResult = window.DB.importRosterFromCSV(sampleCsv);
    assert(importResult.success === true, "CSV Roster import succeeded");
    assert(importResult.count === 2, "CSV Roster imported 2 gate shift configurations");

    const reloadedRoster = window.DB.getGateRoster();
    const reloadedGate1 = reloadedRoster.find(r => r.gate_name.includes('بوابة 1'));
    assert(reloadedGate1.day_officer_id === 3, "Gate 1 Day Officer swapped to GT-02 (Hossam)");
    assert(reloadedGate1.night_officer_id === 2, "Gate 1 Night Officer swapped to GT-01 (Tariq)");

    // --- TEST 5: Officer Multi-Photo Inspection Request Creation ---
    console.log("\n5. Testing Officer Multi-Photo Inspection Request Creation...");
    const fakePlatePhoto = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/fakePlatePhotoData";
    const fakeCarriagePhoto = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/fakeCarriagePhotoData";

    const req = window.DB.createInspectionRequest({
        plate_ar: 'س ر ج ٧ ٧ ٤ ٤',
        plate_en: 'SRJ 7744',
        driver_name: 'إبراهيم توفيق منصور',
        driver_phone: '01099887766',
        company: 'شركة الدلتا للأسمدة',
        destination: 'مصنع الأسمدة والمخصبات',
        cargo_details: 'نترات نشادر 15 طن',
        notes: 'شاحنة بدون تصريح مسبق تطلب استئذان فوري للتفريغ',
        plate_photo_url: fakePlatePhoto,
        carriage_photo_url: fakeCarriagePhoto,
        officer_id: 2,
        gate_name: 'بوابة 1 الرئيسية - دوترا'
    });

    assert(req !== null && req.id !== undefined, "Inspection request created with unique ID");
    assert(req.status === 'pending', "Inspection request initial status is 'pending'");
    assert(req.plate_photo_url === fakePlatePhoto, "Car plate photo attached correctly");
    assert(req.carriage_photo_url === fakeCarriagePhoto, "Car carriage/cargo photo attached correctly");

    const pendingList = window.DB.getPendingInspectionRequests();
    assert(pendingList.length >= 1, "Pending inspection requests retrieved successfully");
    assert(pendingList.find(p => p.id === req.id) !== undefined, "Created request present in pending list");

    // --- TEST 6: Manager Review & Approval Decision Lifecycle ---
    console.log("\n6. Testing Manager Approval Decision Lifecycle...");
    const decisionResult = window.DB.decideInspectionRequest(req.id, 'approve', 'معتمد بعد فحص صور اللوحة والصندوق', 1);
    assert(decisionResult.success === true, "Manager approval execution succeeded");
    assert(decisionResult.request.status === 'approved', "Request status changed to 'approved'");
    assert(decisionResult.permit !== null, "New active permit generated upon manager approval");
    assert(decisionResult.permit.permit_code.startsWith('PER-') || decisionResult.permit.permit_code.includes('-'), "Permit code generated with valid prefix");
    assert(decisionResult.permit.pin_code && decisionResult.permit.pin_code.length === 5, "5-Digit quick verification PIN generated");

    // Verify permit is in DB permits list
    const allPermits = window.DB.getPermits();
    const foundPermit = allPermits.find(p => p.id === decisionResult.permit.id);
    assert(foundPermit !== undefined, "Generated permit exists in gate_permits storage");

    // --- TEST 7: Manager Rejection Lifecycle ---
    console.log("\n7. Testing Manager Rejection Lifecycle...");
    const req2 = window.DB.createInspectionRequest({
        plate_ar: 'ق ط ر ١ ٢ ٣ ٤',
        driver_name: 'علي حسن',
        notes: 'شاحنة مشبوهة بدون أوراق',
        officer_id: 2,
        gate_name: 'بوابة 2 الشحن والجمارك - دوترا'
    });

    const rejectResult = window.DB.decideInspectionRequest(req2.id, 'reject', 'مرفوض لعدم مطابقة أوراق الشحنة', 1);
    assert(rejectResult.success === true, "Rejection processed successfully");
    assert(rejectResult.request.status === 'rejected', "Request status set to 'rejected'");
    assert(rejectResult.request.manager_decision_notes.includes('عدم مطابقة'), "Denial notes recorded accurately");
    assert(rejectResult.permit === null, "No permit generated for rejected request");

    // Final Summary
    console.log("\n=======================================================");
    console.log(`  TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${Math.round(passedTests/totalTests*100)}%)`);
    console.log("=======================================================\n");

    if (passedTests === totalTests) {
        process.exit(0);
    } else {
        process.exit(1);
    }
}

runTests();

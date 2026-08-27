// ============================================================
// Automated Test Suite: CEO Page & Complete Vehicle Movement Audit Log
// اختبارات شاملة لسجل حركات المركبات الكامل ولوحة المدير التنفيذي
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

const sessionStorageData = {};
global.sessionStorage = {
    getItem: (k) => sessionStorageData[k] || null,
    setItem: (k, v) => { sessionStorageData[k] = String(v); },
    removeItem: (k) => { delete sessionStorageData[k]; },
    clear: () => { Object.keys(sessionStorageData).forEach(k => delete sessionStorageData[k]); }
};

global.window = {
    DB: null,
    Auth: null,
    CEO: null,
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

// Load DB
eval(fs.readFileSync(path.join(__dirname, 'js/db.js'), 'utf8'));
// Load Auth
eval(fs.readFileSync(path.join(__dirname, 'js/auth.js'), 'utf8'));
// Load CEO
eval(fs.readFileSync(path.join(__dirname, 'js/ceo.js'), 'utf8'));

let passed = 0;
let failed = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${testName}`);
        failed++;
    }
}

async function runTests() {
    console.log('\n=================================================');
    console.log('🏛️ CEO PAGE & COMPLETE VEHICLE MOVEMENT AUDIT SUITE');
    console.log('=================================================\n');

    // Test 1: CEO User in Seed Database
    console.log('[1] CEO User Account Verification:');
    const users = window.DB.getUsers();
    const ceoUser = users.find(u => u.role === 'ceo');
    assert(ceoUser !== undefined, 'CEO user exists in database');
    assert(ceoUser && ceoUser.email === 'ceo@dotra.com', 'CEO email is correctly set to ceo@dotra.com');
    assert(ceoUser && ceoUser.badge_id === 'CEO-01', 'CEO badge_id is CEO-01');

    // Test 2: Full Lifecycle Simulation (Create Permit -> Approve -> Entry Gate 1 -> Exit Gate 4)
    console.log('\n[2] Complete Movement Lifecycle Simulation:');
    
    // Simulate Manager / Operations creating permit
    sessionStorage.setItem('gate_current_user', JSON.stringify({
        id: 1,
        badge_id: 'MGR-01',
        email: 'manager@dotra.com',
        name_ar: 'م. أحمد فؤاد (مدير العمليات)',
        role: 'manager'
    }));
    window.Auth.currentUser = JSON.parse(sessionStorage.getItem('gate_current_user'));

    // Create Vehicle
    const truck = window.DB.addVehicle({
        plate_ar: 'أ ب ج ٧ ٨ ٩ ٠',
        plate_en: 'ABG 7890',
        vehicle_type: 'truckHeavy',
        driver_name_ar: 'عادل عبدالرحمن سليم',
        driver_phone: '01099887766',
        company_ar: 'شركة النور للأسمدة والكيماويات'
    });

    // Create Permit with custom Creator & Approver
    const permit = window.DB.addPermit({
        vehicle_id: truck.id,
        permit_type: 'both',
        destination_ar: 'مصنع الأسمدة والمخصبات',
        cargo_details: '٢٥ طن يوريا ٤٦٪',
        invoice_no: 'INV-DOTRA-88301',
        created_by: 1,
        created_by_name: 'إدارة اللوجستيات والتخطيط (م. سامح)',
        approved_by: 1,
        approved_by_name: 'م. أحمد فؤاد (مدير العمليات المصنعية)'
    });

    assert(permit.created_by_name === 'إدارة اللوجستيات والتخطيط (م. سامح)', 'Permit retains creator name');
    assert(permit.approved_by_name === 'م. أحمد فؤاد (مدير العمليات المصنعية)', 'Permit retains approver name');

    // Officer 1 logs Entry at Gate 1
    const entryLog = window.DB.recordEntry(
        truck.id,
        permit.id,
        2, // Officer 2 (طارق محمود)
        'بوابة 1 الرئيسية - دوترا',
        'دخول نظامي مع إذن صرف رقم INV-DOTRA-88301'
    );

    assert(entryLog.action_type === 'entry', 'Entry log created');
    assert(entryLog.gate_name === 'بوابة 1 الرئيسية - دوترا', 'Entry gate recorded as Gate 1');
    assert(entryLog.officer_id === 2, 'Entry officer recorded as Officer #2');

    // Check Live State in Executive Movement Logs
    let execLogs = window.DB.getExecutiveMovementLogs();
    let currentMovement = execLogs.find(m => m.vehicle_id === truck.id);
    assert(currentMovement !== undefined, 'Movement present in Executive Logs');
    assert(currentMovement.status === 'inside', 'Vehicle status is inside factory');
    assert(currentMovement.created_by_name === 'إدارة اللوجستيات والتخطيط (م. سامح)', 'Executive log includes creator name');
    assert(currentMovement.approved_by_name === 'م. أحمد فؤاد (مدير العمليات المصنعية)', 'Executive log includes approver name');
    assert(currentMovement.entry_gate === 'بوابة 1 الرئيسية - دوترا', 'Executive log records entry gate');
    assert(currentMovement.entry_officer_name.includes('طارق'), 'Executive log records entry officer name');

    // Officer 2 logs Exit from a DIFFERENT Gate (Gate 4)
    const exitLog = window.DB.recordExit(
        truck.id,
        3, // Officer 3 (حسام حسن)
        'بوابة 4 خروج الإنتاج والشاحنات',
        'تم تفريغ الشحنة بالكامل ومطابقة الفاتورة'
    );

    assert(exitLog.exit_gate_name === 'بوابة 4 خروج الإنتاج والشاحنات', 'Exit gate recorded as Gate 4');
    assert(exitLog.exit_officer_id === 3, 'Exit officer recorded as Officer #3');

    // Verify Executive Movement Log after Exit
    execLogs = window.DB.getExecutiveMovementLogs();
    currentMovement = execLogs.find(m => m.vehicle_id === truck.id);

    assert(currentMovement.status === 'exited', 'Vehicle status updated to exited');
    assert(currentMovement.entry_gate === 'بوابة 1 الرئيسية - دوترا', 'Preserved Entry Gate (Gate 1)');
    assert(currentMovement.exit_gate === 'بوابة 4 خروج الإنتاج والشاحنات', 'Preserved Exit Gate (Gate 4)');
    assert(currentMovement.entry_officer_name.includes('طارق'), 'Preserved Entry Officer');
    assert(currentMovement.exit_officer_name.includes('حسام'), 'Preserved Exit Officer');
    assert(typeof currentMovement.duration_minutes === 'number', 'Accurate dwell time duration calculated');

    // Test 3: CEO Controller Rendering & Filters
    console.log('\n[3] CEO Controller Dashboard & Export Methods:');
    assert(typeof window.CEO.renderDashboard === 'function', 'CEO.renderDashboard is defined');
    assert(typeof window.CEO.exportToCSV === 'function', 'CEO.exportToCSV is defined');
    assert(typeof window.CEO.showJourneyTimeline === 'function', 'CEO.showJourneyTimeline is defined');
    assert(typeof window.CEO.printExecutiveReport === 'function', 'CEO.printExecutiveReport is defined');

    // Test CSV headers validation
    const sampleMovements = window.DB.getExecutiveMovementLogs();
    assert(sampleMovements.length > 0, 'Movement logs populated');
    const firstRow = sampleMovements[0];
    assert(firstRow.created_by_name !== undefined, 'Movement has created_by_name');
    assert(firstRow.approved_by_name !== undefined, 'Movement has approved_by_name');
    assert(firstRow.entry_gate !== undefined, 'Movement has entry_gate');
    assert(firstRow.exit_gate !== undefined, 'Movement has exit_gate');

    console.log('\n=================================================');
    console.log(`🏁 CEO PAGE & AUDIT TEST RESULTS:`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total:  ${passed + failed}`);
    console.log('=================================================');

    if (failed === 0) {
        console.log('🎉 ALL CEO PAGE & VEHICLE MOVEMENT AUDIT TESTS PASSED (100%)!\n');
    } else {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});

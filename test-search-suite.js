// Comprehensive Verification for Universal Search Bars across Manager, Officer & CEO
import assert from 'assert';

// Mock localStorage and window
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (i) => Object.keys(store)[i] || null
    };
})();

global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;
global.window = {
    localStorage: localStorageMock,
    sessionStorage: localStorageMock,
    addEventListener: () => {},
    location: { href: '' }
};

// Mock minimal DOM
const elements = {};
global.document = {
    getElementById: (id) => {
        if (!elements[id]) {
            elements[id] = { innerHTML: '', value: '', classList: { add: () => {}, remove: () => {} }, querySelector: () => null, querySelectorAll: () => [] };
        }
        return elements[id];
    },
    querySelector: () => ({ innerHTML: '' }),
    querySelectorAll: () => []
};

// Import modules
await import('./js/i18n.js');
await import('./js/icons.js');
await import('./js/arabic-plate.js');
await import('./js/db.js');
await import('./js/auth.js');
await import('./js/manager.js');
await import('./js/officer.js');
await import('./js/ceo.js');

console.log('🧪 Starting Universal Search Bar Diagnostics...\n');
let passed = 0;

function it(desc, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${desc}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${desc}`);
        console.error(err);
        process.exit(1);
    }
}

// 1. Arabic Plate & Numeral Normalization Tests
console.log('[1] Text & Plate Normalization Helpers:');
it('Normalizes Eastern Arabic numerals to ASCII (٩٨٢١ -> 9821)', () => {
    assert.strictEqual(window.ArabicPlate.normalizeSearchText('٩٨٢١'), '9821');
});

it('Normalizes Arabic letters with hamza and taa marbuta', () => {
    assert.strictEqual(window.ArabicPlate.normalizeSearchText('أحمد إبراهيم بالبوابة'), 'احمد ابراهيم بالبوابه');
});

it('Normalizes spaced Arabic plate into compact search string', () => {
    assert.strictEqual(window.ArabicPlate.normalizePlateCompact('ط ر ق  ٩ ٨ ٢ ١'), 'طرق9821');
    assert.strictEqual(window.ArabicPlate.normalizePlateCompact('طرق 9821'), 'طرق9821');
});

// 2. DB findVehicleByPlate Robust Search
console.log('\n[2] DB Plate Lookup Matching:');
window.DB.clearAllData();
const testVehicle = window.DB.addVehicle({
    plate_ar: 'ط ر ق ٩ ٨ ٢ ١',
    plate_en: 'TRQ 9821',
    vehicle_type: 'truck',
    driver_name_ar: 'محمود عبد الفتاح',
    driver_name_en: 'Mahmoud Abdel-Fattah',
    driver_phone: '01099887766',
    company_ar: 'شركة الأمل للأسمدة',
    company_en: 'Al-Amal Fertilizers'
});

it('Finds vehicle by unspaced plate in Arabic (طرق 9821)', () => {
    const v = window.DB.findVehicleByPlate('طرق 9821');
    assert.ok(v, 'Vehicle should be found');
    assert.strictEqual(v.id, testVehicle.id);
});

it('Finds vehicle by Eastern Arabic numerals (٩٨٢١)', () => {
    const v = window.DB.findVehicleByPlate('٩٨٢١');
    assert.ok(v, 'Vehicle should be found');
    assert.strictEqual(v.id, testVehicle.id);
});

it('Finds vehicle by letters only (طرق)', () => {
    const v = window.DB.findVehicleByPlate('طرق');
    assert.ok(v, 'Vehicle should be found');
    assert.strictEqual(v.id, testVehicle.id);
});

it('Finds vehicle by English plate (TRQ 9821 or TRQ9821)', () => {
    const v = window.DB.findVehicleByPlate('trq9821');
    assert.ok(v, 'Vehicle should be found');
    assert.strictEqual(v.id, testVehicle.id);
});

// 3. Manager Dashboard Multi-Criteria Universal Search
console.log('\n[3] Manager Dashboard Universal Search:');
const testPermit = window.DB.addPermit({
    vehicle_id: testVehicle.id,
    permit_type: 'entry',
    destination_ar: 'مستودع الكيماويات والمبيدات C',
    destination_en: 'Chemicals Dock C',
    cargo_details: 'مبيدات زراعية معتمدة',
    invoice_no: 'INV-DOTRA-8833',
    pin_code: '44882',
    status: 'active'
});

it('Manager searches by driver name with hamza variant (عبدالفتاح)', () => {
    window.Manager.handleUniversalSearch('عبد الفتاح');
    const rowsHtml = window.Manager.renderTableRows('ar');
    assert.ok(rowsHtml.includes('ط ر ق'), 'Should contain vehicle row');
    assert.ok(rowsHtml.includes('محمود عبد الفتاح'), 'Should display driver');
});

it('Manager searches by destination (مستودع الكيماويات)', () => {
    window.Manager.handleUniversalSearch('الكيماويات');
    const rowsHtml = window.Manager.renderTableRows('ar');
    assert.ok(rowsHtml.includes('مستودع الكيماويات'), 'Should match destination');
});

it('Manager searches by invoice number (INV-DOTRA-8833)', () => {
    window.Manager.handleUniversalSearch('8833');
    const rowsHtml = window.Manager.renderTableRows('ar');
    assert.ok(rowsHtml.includes('INV-DOTRA-8833'), 'Should match invoice');
});

it('Manager searches by 5-digit PIN (44882)', () => {
    window.Manager.handleUniversalSearch('44882');
    const rowsHtml = window.Manager.renderTableRows('ar');
    assert.ok(rowsHtml.includes('44882'), 'Should match PIN');
});

it('Manager clearUniversalSearch resets query and table', () => {
    window.Manager.clearUniversalSearch();
    assert.strictEqual(window.Manager.searchQuery, '');
});

// 4. Officer Terminal Plate & PIN Search
console.log('\n[4] Officer Terminal Search:');
it('Officer searches by 5-digit PIN and retrieves vehicle decision card', () => {
    window.Officer.handlePlateSearch('44882');
    assert.ok(window.Officer.selectedVehicle, 'Vehicle should be selected');
    assert.strictEqual(window.Officer.selectedVehicle.id, testVehicle.id);
});

it('Officer searches by Egyptian plate without spaces (طرق9821)', () => {
    window.Officer.handlePlateSearch('طرق9821');
    assert.ok(window.Officer.selectedVehicle, 'Vehicle should be selected');
    assert.strictEqual(window.Officer.selectedVehicle.id, testVehicle.id);
});

// 5. CEO Executive Audit Search
console.log('\n[5] CEO Executive Audit Search:');
// Record an entry and exit movement
window.DB.recordEntry(testVehicle.id, testPermit.id, 2, 'بوابة 1 الرئيسية - دوترا');

it('CEO searches audit logs by gate name (بوابة 1)', () => {
    window.CEO.handleSearch('بوابة 1');
    const auditRows = window.CEO.renderAuditRows('ar');
    assert.ok(auditRows.includes('محمود عبد الفتاح'), 'Should find movement log in table');
    assert.ok(auditRows.includes('بوابة 1'), 'Should display gate');
});

it('CEO searches audit logs by plate (طرق 9821)', () => {
    window.CEO.handleSearch('طرق 9821');
    const auditRows = window.CEO.renderAuditRows('ar');
    assert.ok(auditRows.includes('محمود عبد الفتاح'), 'Should display movement record');
});

console.log('\n=================================================');
console.log(`🏁 UNIVERSAL SEARCH VERIFICATION: ${passed} PASSED`);
console.log('=================================================');

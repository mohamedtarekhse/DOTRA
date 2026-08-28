// Verification for Native Excel (.xls) Multi-Cell Export Functionality
import assert from 'assert';

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

const elements = {};
global.document = {
    getElementById: (id) => elements[id] || { innerHTML: '', value: '', classList: { add: () => {}, remove: () => {} } },
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
await import('./js/ceo.js');

console.log('🧪 Starting Excel Multi-Cell Spreadsheet Export Verification...\n');
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

// 1. Setup Test Data
window.DB.clearAllData();
const testVehicle = window.DB.addVehicle({
    plate_ar: 'ط ر ق ٩ ٨ ٢ ١',
    plate_en: 'TRQ 9821',
    vehicle_type: 'truckHeavy',
    driver_name_ar: 'محمود عبد الفتاح',
    driver_phone: '01012345678',
    company_ar: 'شركة دوترا للتجارة والصناعة'
});

const testPermit = window.DB.addPermit({
    vehicle_id: testVehicle.id,
    permit_type: 'both',
    destination_ar: 'مستودع الكيماويات C',
    cargo_details: 'مبيدات زراعية ومخصبات',
    invoice_no: 'INV-DOTRA-8833',
    pin_code: '44882',
    status: 'active'
});

window.DB.recordEntry(testVehicle.id, testPermit.id, 2, 'بوابة 1 الرئيسية - دوترا');
window.DB.recordExit(testVehicle.id, 2, 'بوابة 4 - شحن وتفريغ', 'تم التفريغ والمغادرة');

// 2. Test CEO Excel Spreadsheet Export
console.log('[1] CEO Executive Audit Excel Export (.xls):');
it('CEO.exportToExcel returns valid Excel HTML workbook with Right-To-Left directive', () => {
    const excelContent = window.CEO.exportToExcel();
    assert.ok(excelContent.includes('xmlns:x="urn:schemas-microsoft-com:office:excel"'), 'Should contain Excel namespace');
    assert.ok(excelContent.includes('<x:DisplayRightToLeft/>'), 'Should set Excel Right-to-Left sheet option');
});

it('CEO Excel export contains individual table headers in separate <th> cells', () => {
    const excelContent = window.CEO.exportToExcel();
    assert.ok(excelContent.includes('<th>رقم اللوحة (عربي)</th>'), 'Should have separate plate cell');
    assert.ok(excelContent.includes('<th>رمز PIN</th>'), 'Should have separate PIN cell');
    assert.ok(excelContent.includes('<th>بوابة الدخول</th>'), 'Should have entry gate cell');
    assert.ok(excelContent.includes('<th>بوابة الخروج</th>'), 'Should have exit gate cell');
});

it('CEO Excel export contains row values in separate <td> cells with string format protection (mso-number-format)', () => {
    const excelContent = window.CEO.exportToExcel();
    assert.ok(excelContent.includes('mso-number-format'), 'Should preserve leading zeros and formatting in Excel');
    assert.ok(excelContent.includes('ط ر ق ٩ ٨ ٢ ١'), 'Should render Arabic plate');
    assert.ok(excelContent.includes('44882'), 'Should render 5-digit PIN');
    assert.ok(excelContent.includes('بوابة 1 الرئيسية - دوترا'), 'Should render Entry Gate');
    assert.ok(excelContent.includes('بوابة 4 - شحن وتفريغ'), 'Should render Exit Gate');
});

// 3. Test Manager Excel Spreadsheet Export
console.log('\n[2] Manager Dashboard Excel Export (.xls):');
it('Manager.exportExcel generates separate cells for permits and vehicle movement tables', () => {
    window.Manager.setFilter('permits');
    const excelContent = window.Manager.exportExcel();
    assert.ok(excelContent.includes('<table'), 'Should contain HTML table');
    assert.ok(excelContent.includes('<th>كود التصريح</th>'), 'Should contain permit code header');
    assert.ok(excelContent.includes('<th>رمز التحقق PIN</th>'), 'Should contain PIN header');
    assert.ok(excelContent.includes('44882'), 'Should contain PIN in table data');
    assert.ok(excelContent.includes('مستودع الكيماويات C'), 'Should contain destination cell');
});

console.log('\n=================================================');
console.log(`🏁 EXCEL EXPORT VERIFICATION: ${passed} PASSED (100%)`);
console.log('=================================================');

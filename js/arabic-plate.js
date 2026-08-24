// Arabic License Plate Utility & Renderer
// محرك لوحات المركبات العربية ولوحة المفاتيح التفاعلية

const ARABIC_PLATE_LETTERS = [
    { ar: 'أ', en: 'A' },
    { ar: 'ب', en: 'B' },
    { ar: 'ح', en: 'J' },
    { ar: 'د', en: 'D' },
    { ar: 'ر', en: 'R' },
    { ar: 'س', en: 'S' },
    { ar: 'ص', en: 'X' },
    { ar: 'ط', en: 'T' },
    { ar: 'ع', en: 'E' },
    { ar: 'ق', en: 'G' },
    { ar: 'ك', en: 'K' },
    { ar: 'ل', en: 'L' },
    { ar: 'م', en: 'Z' },
    { ar: 'ن', en: 'N' },
    { ar: 'هـ', en: 'H' },
    { ar: 'و', en: 'U' },
    { ar: 'ى', en: 'V' }
];

const ARABIC_DIGITS_MAP = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
    '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
};

function toEasternArabicDigits(numStr) {
    if (!numStr) return '';
    return numStr.toString().split('').map(d => ARABIC_DIGITS_MAP[d] || d).join('');
}

function getEnglishLetter(arLetter) {
    const found = ARABIC_PLATE_LETTERS.find(item => item.ar === arLetter || item.ar.replace('ـ', '') === arLetter);
    return found ? found.en : arLetter;
}

function getArabicLetter(enLetter) {
    const found = ARABIC_PLATE_LETTERS.find(item => item.en.toUpperCase() === enLetter.toUpperCase());
    return found ? found.ar : enLetter;
}

/**
 * Render an authentic Arabic & Gulf style license plate badge HTML
 */
function renderArabicPlate(plateAr, plateEn, size = 'normal', vehicleType = 'car') {
    // Parse parts e.g. "أ ب ج 1 2 3 4" or "ABC 1234"
    let arLetters = '';
    let arDigits = '';
    let enLetters = '';
    let enDigits = '';

    if (plateAr) {
        const arParts = plateAr.trim().split(/\s+/);
        // Extract digits vs letters
        const digits = arParts.filter(p => /^[\d٠-٩]+$/.test(p)).join(' ');
        const letters = arParts.filter(p => !/^[\d٠-٩]+$/.test(p)).join(' ');
        arLetters = letters || plateAr;
        arDigits = toEasternArabicDigits(digits.replace(/[^\d]/g, ''));
    }

    if (plateEn) {
        const enParts = plateEn.trim().split(/\s+/);
        const digits = enParts.filter(p => /^[\d]+$/.test(p)).join(' ');
        const letters = enParts.filter(p => !/^[\d]+$/.test(p)).join(' ');
        enLetters = letters || plateEn;
        enDigits = digits;
    } else if (plateAr) {
        // Auto derive English equivalent
        const cleanDigits = plateAr.replace(/[^\d٠-٩]/g, '');
        // Convert eastern arabic to standard digits
        let standardDigits = '';
        for (let char of cleanDigits) {
            const entry = Object.entries(ARABIC_DIGITS_MAP).find(([k, v]) => v === char);
            standardDigits += entry ? entry[0] : char;
        }
        enDigits = standardDigits;
        enLetters = arLetters.split(/\s+/).map(getEnglishLetter).join(' ');
    }

    const isTruck = vehicleType.includes('truck') || vehicleType.includes('tanker');
    const isCommercial = vehicleType.includes('van') || vehicleType.includes('pickup');
    
    let typeClass = '';
    let categoryBadge = 'KSA';
    if (isTruck) {
        typeClass = 'plate-truck';
        categoryBadge = 'نقل ثقيل | TRUCK';
    } else if (isCommercial) {
        typeClass = 'plate-commercial';
        categoryBadge = 'نقل عام | TRANS';
    }

    const sizeClass = size === 'large' ? 'plate-large' : size === 'compact' ? 'plate-compact' : '';

    return `
    <div class="license-plate-arabic ${typeClass} ${sizeClass} shadow-md inline-block">
        <div class="plate-header-band">
            <span>${categoryBadge}</span>
            <span class="text-[8px] opacity-80">🛡️ GATE ACCESS</span>
        </div>
        <div class="plate-content-grid">
            <div class="plate-arabic-section">
                <div class="arabic-letters font-bold text-slate-900">${arLetters || 'أ ب ج'}</div>
                <div class="arabic-digits text-slate-600">${arDigits || toEasternArabicDigits(enDigits) || '١ ٢ ٣ ٤'}</div>
            </div>
            <div class="plate-divider"></div>
            <div class="plate-latin-section">
                <div class="latin-letters font-extrabold text-slate-800">${enLetters || 'A B J'}</div>
                <div class="latin-digits font-bold text-sky-700">${enDigits || '1234'}</div>
            </div>
        </div>
    </div>
    `;
}

/**
 * Initialize on-screen Arabic letter keyboard for mobile gate officers
 */
function renderArabicKeypad(targetInputId) {
    const lettersHtml = ARABIC_PLATE_LETTERS.map(item => `
        <button type="button" class="arabic-key" onclick="ArabicPlate.insertKey('${targetInputId}', '${item.ar}')">
            <span class="flex flex-col items-center">
                <span>${item.ar}</span>
                <span class="text-[9px] text-slate-400 font-mono">${item.en}</span>
            </span>
        </button>
    `).join('');

    const digitsHtml = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => `
        <button type="button" class="arabic-key bg-slate-800 hover:bg-slate-700 font-mono" onclick="ArabicPlate.insertKey('${targetInputId}', '${d}')">
            <span class="flex flex-col items-center">
                <span>${d}</span>
                <span class="text-[9px] text-sky-400">${ARABIC_DIGITS_MAP[d]}</span>
            </span>
        </button>
    `).join('');

    return `
    <div class="bg-slate-900/90 border border-slate-700 p-3 rounded-xl shadow-lg mt-2">
        <div class="text-xs font-semibold text-slate-400 mb-2 flex justify-between items-center">
            <span>لوحة الحروف العربية والأرقام للوحات</span>
            <button type="button" class="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 bg-rose-950/40 rounded border border-rose-800/40" onclick="ArabicPlate.backspaceKey('${targetInputId}')">
                ⌫ حذف
            </button>
        </div>
        <div class="grid grid-cols-6 gap-1.5 mb-2">
            ${lettersHtml}
            <button type="button" class="arabic-key col-span-1 bg-sky-900/60 border-sky-600 text-sky-300 text-xs" onclick="ArabicPlate.insertKey('${targetInputId}', ' ')">
                مسافة
            </button>
        </div>
        <div class="grid grid-cols-5 gap-1.5">
            ${digitsHtml}
        </div>
    </div>
    `;
}

function insertKey(inputId, char) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.value = (input.value || '') + (char === ' ' ? ' ' : char);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
}

function backspaceKey(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.value = (input.value || '').slice(0, -1);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
}

window.ArabicPlate = {
    LETTERS: ARABIC_PLATE_LETTERS,
    renderArabicPlate,
    renderArabicKeypad,
    insertKey,
    backspaceKey,
    toEasternArabicDigits,
    getEnglishLetter,
    getArabicLetter
};

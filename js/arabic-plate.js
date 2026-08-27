// Egyptian License Plate Utility & Renderer (لوحات السيارات في مصر)
// نظام ونموذج لوحات المركبات المعتمدة في جمهورية مصر العربية

/**
 * Official 17 Arabic Letters used in Egyptian License Plates
 * الحروف الـ 17 المعتمدة رسمياً في المرور المصري (لتجنب التشابه واللبس):
 * أ، ب، ج، د، ر، س، ص، ط، ع، ف، ق، ل، م، ن، هـ، و، ي
 */
const EGYPTIAN_PLATE_LETTERS = [
    { ar: 'أ', name: 'ألف' },
    { ar: 'ب', name: 'باء' },
    { ar: 'ج', name: 'جيم' },
    { ar: 'د', name: 'دال' },
    { ar: 'ر', name: 'راء' },
    { ar: 'س', name: 'سين' },
    { ar: 'ص', name: 'صاد' },
    { ar: 'ط', name: 'طاء' },
    { ar: 'ع', name: 'عين' },
    { ar: 'ف', name: 'فاء' },
    { ar: 'ق', name: 'قاف' },
    { ar: 'ل', name: 'لام' },
    { ar: 'م', name: 'ميم' },
    { ar: 'ن', name: 'نون' },
    { ar: 'هـ', name: 'هاء' },
    { ar: 'و', name: 'واو' },
    { ar: 'ي', name: 'ياء' }
];

const ARABIC_DIGITS_MAP = {
    '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
    '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
};

function toEasternArabicDigits(numStr) {
    if (!numStr) return '';
    return numStr.toString().split('').map(d => ARABIC_DIGITS_MAP[d] || d).join('');
}

function parsePlateParts(plateStr) {
    if (!plateStr) return { letters: '', numbers: '' };
    const cleaned = plateStr.trim();
    // Split letters and numbers
    const parts = cleaned.split(/\s+/);
    const digitsList = [];
    const lettersList = [];

    parts.forEach(p => {
        if (/^[\d٠-٩]+$/.test(p)) {
            digitsList.push(p);
        } else {
            lettersList.push(p);
        }
    });

    // If not separated by space, parse character by character
    if (lettersList.length === 0 && digitsList.length === 0) {
        let l = '';
        let d = '';
        for (let char of cleaned) {
            if (/[\d٠-٩]/.test(char)) d += char;
            else if (char !== ' ') l += char + ' ';
        }
        return { letters: l.trim(), numbers: d.trim() };
    }

    return {
        letters: lettersList.join(' '),
        numbers: digitsList.join(' ')
    };
}

/**
 * Render authentic Egyptian License Plate Badge HTML
 * ألوان اللوحات المصرية:
 * - نقل (شاحنات): شريط علوي أحمر
 * - ملاكي (خاص): شريط علوي أزرق سماوي
 * - أجرة / نقل عام: شريط برتقالي / رمادي
 * - مقطورة / تجاري: شريط أصفر
 */
function renderEgyptianPlate(plateInput, size = 'normal', vehicleType = 'car') {
    const { letters, numbers } = parsePlateParts(plateInput || 'س ف ر ٤ ٥ ٢ ٠');
    const easternDigits = toEasternArabicDigits(numbers.replace(/[^\d٠-٩]/g, ''));
    
    // Category Header Styling according to Egyptian Traffic Authority
    let headerBg = 'bg-sky-500';      // Default: ملاكي (Private)
    let headerBorder = 'border-sky-600';
    let categoryText = 'ملاكي';

    const isTruck = vehicleType.includes('truck') || vehicleType.includes('tanker');
    const isCommercial = vehicleType.includes('van') || vehicleType.includes('pickup');

    if (isTruck) {
        headerBg = 'bg-red-600';       // نقل (Trucks / Transport)
        headerBorder = 'border-red-700';
        categoryText = 'نقل';
    } else if (isCommercial) {
        headerBg = 'bg-amber-500';     // تجاري / نقل خفيف
        headerBorder = 'border-amber-600';
        categoryText = 'نقل خفيف';
    }

    const isLarge = size === 'large';
    const isCompact = size === 'compact';

    const containerStyle = isLarge 
        ? 'w-[250px] h-[92px] text-lg' 
        : isCompact 
        ? 'w-[165px] h-[58px] text-xs' 
        : 'w-[210px] h-[76px] text-sm';

    const headerHeight = isLarge ? 'h-6 text-[11px]' : isCompact ? 'h-4 text-[8px]' : 'h-5 text-[9px]';
    const letterFontSize = isLarge ? 'text-2xl' : isCompact ? 'text-base' : 'text-xl';
    const numberFontSize = isLarge ? 'text-2xl' : isCompact ? 'text-base' : 'text-xl';

    return `
    <div class="egyptian-plate ${containerStyle} bg-white rounded-lg border-2 border-slate-900 shadow-xl overflow-hidden flex flex-col select-none inline-block font-sans">
        <!-- Top Band: EGYPT & مصر with Official Color Code -->
        <div class="${headerBg} ${headerHeight} text-white font-extrabold px-3 flex items-center justify-between tracking-wider border-b ${headerBorder}">
            <span class="font-mono font-black tracking-widest">EGYPT</span>
            <span class="text-[9px] bg-black/25 px-1 rounded font-normal">${categoryText}</span>
            <span class="font-bold text-sm leading-none font-arabic">مصر</span>
        </div>

        <!-- Plate Main Content: Numbers on Left / Letters on Right (Egyptian Standard) -->
        <div class="flex-1 grid grid-cols-2 items-center bg-slate-50 px-2 py-1 relative">
            <!-- Numbers Section -->
            <div class="flex items-center justify-center font-black text-slate-950 ${numberFontSize} font-mono tracking-widest border-r-2 border-slate-300 h-full">
                <span>${easternDigits || '٤٥٢٠'}</span>
            </div>

            <!-- Letters Section (Egyptian Arabic Letters) -->
            <div class="flex items-center justify-center font-black text-slate-950 ${letterFontSize} font-arabic tracking-widest h-full">
                <span class="space-x-1 space-x-reverse">${letters || 'س ف ر'}</span>
            </div>

            <!-- Central Hologram Watermark Simulation -->
            <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200/60 border border-slate-300/80 flex items-center justify-center text-[7px] text-slate-500 font-mono pointer-events-none">
                🇪🇬
            </div>
        </div>
    </div>
    `;
}

/**
 * On-Screen Keypad for Egyptian License Plates
 */
function renderArabicKeypad(targetInputId) {
    const lettersHtml = EGYPTIAN_PLATE_LETTERS.map(item => `
        <button type="button" class="arabic-key-btn bg-white hover:bg-[#0070f2] text-[#002b66] hover:text-white border-2 border-[#b0cfee] hover:border-[#0070f2] rounded-xl shadow-sm h-11 flex items-center justify-center transition-all active:scale-95 group font-bold text-xl select-none" onclick="ArabicPlate.insertKey('${targetInputId}', '${item.ar}')" title="${item.name}">
            <span class="group-hover:scale-110 transition-transform">${item.ar}</span>
        </button>
    `).join('');

    const digitsHtml = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => `
        <button type="button" class="arabic-key-btn bg-[#f0f4f8] hover:bg-[#0070f2] text-[#002b66] hover:text-white border-2 border-[#b0cfee] hover:border-[#0070f2] rounded-xl shadow-sm h-11 flex items-center justify-center transition-all active:scale-95 group select-none" onclick="ArabicPlate.insertKey('${targetInputId}', '${ARABIC_DIGITS_MAP[d]}')">
            <span class="flex items-center gap-1.5 font-bold">
                <span class="text-lg font-black">${ARABIC_DIGITS_MAP[d]}</span>
                <span class="text-[11px] opacity-75 font-mono">(${d})</span>
            </span>
        </button>
    `).join('');

    return `
    <div class="bg-[#f8fafc] border-2 border-[#b0cfee] p-3.5 rounded-2xl shadow-xl mt-2 text-right select-none animate-fadeIn" dir="rtl">
        <div class="text-xs font-black text-[#002b66] mb-2.5 flex justify-between items-center border-b border-[#d7e2ee] pb-2">
            <span class="flex items-center gap-1.5">
                <span class="px-2 py-0.5 bg-[#ebf3fb] text-[#0070f2] rounded-md font-bold text-[10px] border border-[#b3d5fa]">لوحة الحروف المصرية</span>
                <span class="text-[11px] text-[#556b82]">اختر الحروف والأرقام مباشرة:</span>
            </span>
            <div class="flex items-center gap-1.5">
                <button type="button" class="text-xs text-rose-700 hover:text-white font-bold px-3 py-1 bg-rose-50 hover:bg-rose-600 rounded-lg border border-rose-200 transition-all flex items-center gap-1" onclick="ArabicPlate.backspaceKey('${targetInputId}')">
                    <span>⌫</span>
                    <span>حذف حرف</span>
                </button>
            </div>
        </div>

        <!-- Egyptian Letters Grid (6 columns) -->
        <div class="grid grid-cols-6 gap-1.5 mb-3">
            ${lettersHtml}
            <button type="button" class="col-span-1 bg-[#e7eff7] hover:bg-[#0070f2] text-[#002b66] hover:text-white border-2 border-[#b0cfee] hover:border-[#0070f2] rounded-xl shadow-sm text-xs font-black flex items-center justify-center transition-all active:scale-95" onclick="ArabicPlate.insertKey('${targetInputId}', ' ')">
                مسافة ␣
            </button>
        </div>

        <!-- Numerals Sub-header & Grid -->
        <div class="text-[11px] font-bold text-[#556b82] mb-1.5 flex items-center gap-1">
            <span>🔢 الأرقام:</span>
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

function normalizeSearchText(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .toLowerCase()
        // Convert Arabic/Persian digits to standard ASCII digits
        .replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48))
        .replace(/[\u06F0-\u06F9]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 48))
        // Normalize Arabic letters
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/[ىيئ]/g, 'ي')
        .replace(/[ةهـ]/g, 'ه')
        .replace(/[\u064B-\u065F\u0670]/g, '') // Remove tashkeel / diacritics
        .trim();
}

function normalizePlateCompact(str) {
    return normalizeSearchText(str).replace(/[\s\-_/.,]+/g, '');
}

window.ArabicPlate = {
    LETTERS: EGYPTIAN_PLATE_LETTERS,
    renderArabicPlate: renderEgyptianPlate,
    renderEgyptianPlate,
    renderArabicKeypad,
    insertKey,
    backspaceKey,
    toEasternArabicDigits,
    parsePlateParts,
    normalizeSearchText,
    normalizePlateCompact
};

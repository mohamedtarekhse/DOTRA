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
        <button type="button" class="arabic-key hover:bg-sky-600 hover:border-sky-400" onclick="ArabicPlate.insertKey('${targetInputId}', '${item.ar}')">
            <span class="font-bold text-lg text-white">${item.ar}</span>
        </button>
    `).join('');

    const digitsHtml = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(d => `
        <button type="button" class="arabic-key bg-slate-800 hover:bg-slate-700" onclick="ArabicPlate.insertKey('${targetInputId}', '${ARABIC_DIGITS_MAP[d]}')">
            <span class="flex flex-col items-center">
                <span class="text-base text-amber-300 font-bold">${ARABIC_DIGITS_MAP[d]}</span>
                <span class="text-[9px] text-slate-400 font-mono">${d}</span>
            </span>
        </button>
    `).join('');

    return `
    <div class="bg-slate-900/95 border border-slate-700 p-3 rounded-2xl shadow-2xl mt-2 text-right" dir="rtl">
        <div class="text-xs font-bold text-slate-300 mb-2 flex justify-between items-center border-b border-slate-800 pb-1.5">
            <span class="flex items-center gap-1">
                <span>🇪🇬</span>
                <span>الحروف الـ 17 المعتمدة في المرور المصري والأرقام:</span>
            </span>
            <button type="button" class="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 bg-rose-950/50 rounded-lg border border-rose-800/50" onclick="ArabicPlate.backspaceKey('${targetInputId}')">
                ⌫ حذف
            </button>
        </div>

        <!-- Egyptian Letters Grid (6 columns) -->
        <div class="grid grid-cols-6 gap-1.5 mb-2.5">
            ${lettersHtml}
            <button type="button" class="arabic-key col-span-1 bg-sky-900/80 border-sky-600 text-sky-200 text-xs font-bold" onclick="ArabicPlate.insertKey('${targetInputId}', ' ')">
                مسافة
            </button>
        </div>

        <!-- Eastern Arabic Numerals Grid -->
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
    LETTERS: EGYPTIAN_PLATE_LETTERS,
    renderArabicPlate: renderEgyptianPlate,
    renderEgyptianPlate,
    renderArabicKeypad,
    insertKey,
    backspaceKey,
    toEasternArabicDigits,
    parsePlateParts
};

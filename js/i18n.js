// Translations Dictionary - Arabic & English
// قاموس الترجمة - العربية والإنجليزية

const translations = {
    ar: {
        appName: "نظام تصاريح بوابات المركبات",
        appSubtitle: "إدارة وتصريح دخول وخروج الشاحنات والمركبات",
        loginTitle: "تسجيل الدخول للنظام",
        loginDesc: "اختر نوع الحساب للمتابعة",
        managerTab: "🏢 مدير المكتب (PC)",
        officerTab: "👮 حارس البوابة (Mobile)",
        emailLabel: "البريد الإلكتروني",
        passwordLabel: "كلمة المرور",
        badgeLabel: "رقم شارة الضابط",
        pinLabel: "رمز المرور (PIN)",
        signInBtn: "تسجيل الدخول للمكتب",
        openGateBtn: "فتح بوابة التفتيش",
        logout: "تسجيل الخروج",
        currentGate: "البوابة الحالية",
        activeOfficer: "الضابط المناوب",
        officeManager: "مدير العمليات والمكتب",
        
        // Navigation
        navDashboard: "لوحة التحكم",
        navPermits: "إصدار التصاريح",
        navInside: "المركبات بالداخل",
        navLogs: "سجل الحركات",
        navWhitelist: "القائمة المعتمدة والمحظورة",
        
        // Metrics
        metricInside: "مركبات بالداخل الآن",
        metricToday: "إجمالي الدخول اليوم",
        metricOverstay: "تنبيهات تجاوز المدة",
        metricPending: "تصاريح قيد الانتظار",
        
        // Plate & Vehicles
        plateNumber: "رقم اللوحة",
        plateArabicLetters: "الحروف العربية",
        plateDigits: "الأرقام",
        vehicleType: "نوع المركبة",
        driverName: "اسم السائق",
        driverPhone: "رقم الجوال",
        company: "الشركة / الجهة",
        destination: "الوجهة / المستودع",
        purpose: "الغرض من الزيارة",
        cargo: "بيانات الحمولة",
        validFrom: "صالح من",
        validUntil: "صالح حتى",
        status: "الحالة",
        actions: "الإجراءات",
        
        // Vehicle Types
        truckHeavy: "شاحنة ثقيلة / تريلا",
        truckMedium: "شاحنة متوسطة / دينا",
        van: "فان بضائع",
        tanker: "صهريج وقود/كيماويات",
        car: "سيارة ركاب / سيدان",
        pickup: "وانيت / بيك آب",
        
        // Statuses
        statusInside: "داخل المصنع",
        statusAuthorized: "مصرح بالدخول",
        statusExited: "غادر المنشأة",
        statusOverstay: "متأخر / متجاوز",
        statusPending: "بانتظار الموافقة",
        statusBanned: "محظور من الدخول",
        statusWhitelist: "معتمد دائم",
        
        // Gate Officer Actions
        searchPlatePlaceholder: "ابحث برقم اللوحة (عربي أو إنجليزي)...",
        openScanner: "📷 مسح تصريح QR بكاميرا الجوال",
        closeScanner: "إغلاق الكاميرا",
        arabicKeyboard: "لوحة المفاتيح العربية للوحات",
        allowEntry: "✅ السماح بالدخول (تسجيل دخول)",
        recordExit: "🚪 تسجيل خروج المركبة",
        denyAccess: "⛔ منع الدخول / مخالفة",
        unplannedEntry: "➕ تسجيل زائر غير مسبق",
        entrySuccess: "تم تسجيل الدخول بنجاح وتوثيق الوقت",
        exitSuccess: "تم تسجيل الخروج بنجاح وحساب مدة البقاء",
        deniedSuccess: "تم حظر الدخول وتسجيل الملاحظة",
        
        // Manager Features
        issueNewPermit: "إصدار تصريح دخول جديد",
        printPass: "طباعة / مشاركة التصريح",
        downloadQr: "تحميل رمز QR",
        shareWhatsapp: "إرسال للسائق عبر واتساب",
        exportCsv: "تصدير السجل (Excel / CSV)",
        durationInside: "مدة البقاء بالداخل",
        timeEntered: "وقت الدخول",
        timeExited: "وقت الخروج",
        gateName: "البوابة",
        filterAll: "الكل",
        filterInside: "بالداخل فقط",
        filterOverstay: "المتجاوزين فقط",
        
        // Modal & Alerts
        confirmDeny: "تأكيد منع المركبة من الدخول",
        denyReasonPrompt: "يرجى كتابة سبب المنع:",
        successSaved: "تم حفظ البيانات بنجاح",
        plateNotFound: "لم يتم العثور على تصريح مسبق لهذه اللوحة",
        blacklistedAlert: "⚠️ تحذير أمني: هذه المركبة مدرجة في القائمة السوداء والمحظورة!"
    },
    en: {
        appName: "Vehicle Gate Access System",
        appSubtitle: "Gate Authorization & Fleet Entry Control",
        loginTitle: "System Login",
        loginDesc: "Select your account portal to continue",
        managerTab: "🏢 Office Manager (PC)",
        officerTab: "👮 Gate Officer (Mobile)",
        emailLabel: "Email Address",
        passwordLabel: "Password",
        badgeLabel: "Officer Badge ID",
        pinLabel: "Security PIN",
        signInBtn: "Sign In to Office",
        openGateBtn: "Open Gate Terminal",
        logout: "Logout",
        currentGate: "Current Gate",
        activeOfficer: "Officer on Duty",
        officeManager: "Operations Manager",
        
        // Navigation
        navDashboard: "Dashboard",
        navPermits: "Issue Permits",
        navInside: "Vehicles Inside",
        navLogs: "Access Logs",
        navWhitelist: "Whitelist / Blacklist",
        
        // Metrics
        metricInside: "Vehicles Inside Now",
        metricToday: "Total Entries Today",
        metricOverstay: "Overstay Alerts",
        metricPending: "Pending Passes",
        
        // Plate & Vehicles
        plateNumber: "License Plate",
        plateArabicLetters: "Arabic Letters",
        plateDigits: "Digits",
        vehicleType: "Vehicle Type",
        driverName: "Driver Name",
        driverPhone: "Phone Number",
        company: "Company / Vendor",
        destination: "Destination / Bay",
        purpose: "Visit Purpose",
        cargo: "Cargo Details",
        validFrom: "Valid From",
        validUntil: "Valid Until",
        status: "Status",
        actions: "Actions",
        
        // Vehicle Types
        truckHeavy: "Heavy Truck / Trailer",
        truckMedium: "Medium Truck",
        van: "Cargo Van",
        tanker: "Fuel / Chemical Tanker",
        car: "Passenger Car",
        pickup: "Pickup Truck",
        
        // Statuses
        statusInside: "Inside Plant",
        statusAuthorized: "Authorized",
        statusExited: "Exited",
        statusOverstay: "Overstayed",
        statusPending: "Pending",
        statusBanned: "Banned / Blacklisted",
        statusWhitelist: "Permanent Whitelist",
        
        // Gate Officer Actions
        searchPlatePlaceholder: "Search plate (Arabic or English)...",
        openScanner: "📷 Scan Driver QR Code",
        closeScanner: "Close Camera",
        arabicKeyboard: "Arabic Plate Keyboard",
        allowEntry: "✅ Authorize Entry (Check-In)",
        recordExit: "🚪 Record Exit (Check-Out)",
        denyAccess: "⛔ Deny Access / Flag",
        unplannedEntry: "➕ Unplanned Visitor Pass",
        entrySuccess: "Vehicle entry logged successfully",
        exitSuccess: "Vehicle exit logged successfully",
        deniedSuccess: "Access denied and incident logged",
        
        // Manager Features
        issueNewPermit: "Issue New Vehicle Permit",
        printPass: "Print / Share Permit",
        downloadQr: "Download QR Pass",
        shareWhatsapp: "Share with Driver via WhatsApp",
        exportCsv: "Export Logs (Excel / CSV)",
        durationInside: "Duration Inside",
        timeEntered: "Entry Time",
        timeExited: "Exit Time",
        gateName: "Gate",
        filterAll: "All",
        filterInside: "Inside Only",
        filterOverstay: "Overstayed Only",
        
        // Modal & Alerts
        confirmDeny: "Confirm Access Denial",
        denyReasonPrompt: "Enter reason for denial:",
        successSaved: "Data saved successfully",
        plateNotFound: "No active permit found for this plate",
        blacklistedAlert: "⚠️ SECURITY WARNING: This vehicle is BLACKLISTED and banned from entry!"
    }
};

let currentLang = localStorage.getItem('gate_lang') || 'ar';

function t(key) {
    return translations[currentLang][key] || key;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('gate_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Update active lang buttons
    const arBtn = document.getElementById('lang-btn-ar');
    const enBtn = document.getElementById('lang-btn-en');
    if (arBtn && enBtn) {
        if (lang === 'ar') {
            arBtn.classList.add('bg-sky-600', 'text-white');
            arBtn.classList.remove('text-slate-400');
            enBtn.classList.remove('bg-sky-600', 'text-white');
            enBtn.classList.add('text-slate-400');
        } else {
            enBtn.classList.add('bg-sky-600', 'text-white');
            enBtn.classList.remove('text-slate-400');
            arBtn.classList.remove('bg-sky-600', 'text-white');
            arBtn.classList.add('text-slate-400');
        }
    }
    
    // Re-render UI with new translations
    if (window.App && typeof window.App.refreshUI === 'function') {
        window.App.refreshUI();
    }
}

// Export to window
window.i18n = {
    t,
    setLanguage,
    getLang: () => currentLang
};

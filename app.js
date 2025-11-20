/*
 * =================================================================================
 * APP.JS - Tawal Academy Client Logic
 * Version: 13.0.0 (Final Comprehensive Production Build)
 * =================================================================================
 * * هذا الملف هو المحرك الرئيسي للواجهة الأمامية (Frontend).
 * * يحتوي على كافة العمليات المنطقية لربط الطالب بالخادم وعرض المحتوى.
 *
 * 📋 جدول المحتويات:
 * 1. إعدادات الاتصال والمتغيرات العامة (Configuration).
 * 2. قائمة المواد الدراسية (Subjects Database).
 * 3. دوال المساعدة والتحقق (Helpers & Validation).
 * 4. دوال الاتصال بالخادم (Backend API Calls).
 * 5. نظام المصادقة والحماية (Authentication & Security).
 * - تسجيل ذكي (Smart Registration).
 * - بصمة الجهاز (Fingerprinting).
 * - الحظر (Blocking).
 * 6. نقطة الانطلاق الرئيسية (Main Execution).
 * 7. إدارة الصفحات (Page Controllers):
 * - الصفحة الرئيسية (Index).
 * - صفحة الملخص (Summary).
 * - لوحة التقدم (Dashboard).
 * 8. نظام الاختبارات والمستويات (Quiz & Levels Engine).
 * - دعم الملفات المنفصلة (Quiz 1, 2, 3).
 * - شرط فتح المستوى (80%).
 * =================================================================================
 */

/* -------------------------------------------------------------------------- */
/* 1. إعدادات الاتصال والمتغيرات العامة                                      */
/* -------------------------------------------------------------------------- */

// رابط الخادم (Backend API URL)
const API_URL = 'https://tawal-backend-production.up.railway.app/api';

// مفاتيح التخزين المحلي (Local Storage Keys)
// تم تحديث الإصدار لـ v4 لإجبار المتصفحات على اعتبار المستخدمين "جدد" وإعادة التسجيل
const STORAGE_KEY_ID = 'tawal_studentId_v4'; 
const STORAGE_KEY_NAME = 'tawal_studentName_v4';

// متغيرات الجلسة الحالية (Session Variables)
let STUDENT_ID = localStorage.getItem(STORAGE_KEY_ID);
let FINGERPRINT_ID = null;

// المفتاح الافتراضي للمواد
const DEFAULT_SUBJECT = 'gis_networks';

// إعدادات المستويات (للتعامل مع الملفات المنفصلة)
// هذا الجزء يحدد أسماء الملفات وعناوين المستويات وشرط النجاح
const LEVEL_CONFIG = [
    { 
        id: 1, 
        suffix: '_quiz_1.json', 
        titleSuffix: 'المستوى 1', 
        name: 'المستوى الأول (مبتدئ)', 
        requiredScore: 0 
    },
    { 
        id: 2, 
        suffix: '_quiz_2.json', 
        titleSuffix: 'المستوى 2', 
        name: 'المستوى الثاني (متوسط)', 
        requiredScore: 80 
    },
    { 
        id: 3, 
        suffix: '_quiz_3.json', 
        titleSuffix: 'المستوى 3', 
        name: 'المستوى الثالث (متقدم)', 
        requiredScore: 80 
    }
];

// شعار الأكاديمية (SVG Code)
const LOGO_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M40 8H8c-2.21 0-4 1.79-4 4v24c0 2.21 1.79 4 4 4h32c2.21 0 4-1.79 4-4V12c0-2.21-1.79-4-4-4z" fill="currentColor"/>
        <path d="M18 20l6 12 6-12" stroke="white" stroke-width="2"/>
        <line x1="16" y1="20" x2="32" y2="20" stroke="white" stroke-width="2"/>
    </svg>
`;

/* -------------------------------------------------------------------------- */
/* 2. قائمة المواد الدراسية (Subjects List)                                  */
/* -------------------------------------------------------------------------- */

const SUBJECTS = {
    gis_networks: {
        title: "تطبيقات نظم المعلومات الجغرافية فى الشبكات",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
    },
    transport: {
        title: "جغرافية النقل والمواصلات",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 17l5 5"></path><path d="M10 17l5 5"></path><path d="M8 17l-5 5"></path><path d="M14 17l-5 5"></path><path d="M2 17h20"></path><path d="M2.6 10.5h18.8"></path><path d="M7 10.5l5 6.5"></path><path d="M17 10.5l-5 6.5"></path><path d="M12 10.5V17"></path><path d="M5.5 10.5C5.5 8 8.45 2 12 2s6.5 6 6.5 8.5Z"></path></svg>'
    },
    geo_maps: {
        title: "الخرائط الجيولوجية",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m10 14-2 2 2 2"></path><path d="m14 18 2-2-2-2"></path></svg>'
    },
    projections: {
        title: "كتاب مساقط الخرائط",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>'
    },
    research: {
        title: "مقرر مناهج البحث الجغرافى",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15.09 13.6-2.2-2.2 2.2-2.2"></path><path d="m10.39 18.4 2.2-2.2-2.2-2.2"></path><path d="M3 22v-3.5a2.5 2.5 0 0 1 2.5-2.5h13A2.5 2.5 0 0 1 21 18.5V22"></path><path d="M2 13.3V3a1 1 0 0 1 1-1h11l5 5v10.3"></path><path d="M14 2v6h6"></path></svg>'
    },
    surveying_texts: {
        title: "نصوص جغرافية فى المساحة والحرائط",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 16 4-4-4-4"></path><path d="m8 16 4-4-4-4"></path><path d="M2 12h20"></path></svg>'
    },
    arid_lands: {
        title: "جغرافيا الاراضي الجافة",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.1 12.4C17.1 12.4 17 14 17 15s.9 3 2.1 3.6c1.2.6 2.4.6 3.1.3 1-.4 1.9-1.3 2-2.5.1-1.1-.5-2.1-1.2-2.8-.7-.7-1.7-1-2.5-1.1-1.2-.1-2.2.4-2.8 1-.6.6-1.1 1.4-1.1 2.2z"></path><path d="M5.1 12.4C5.1 12.4 5 14 5 15s.9 3 2.1 3.6c1.2.6 2.4.6 3.1.3 1-.4 1.9-1.3 2-2.5.1-1.1-.5-2.1-1.2-2.8-.7-.7-1.7-1-2.5-1.1-1.2-.1-2.2.4-2.8 1-.6.6-1.1 1.4-1.1 2.2z"></path><path d="M11.1 12.4C11.1 12.4 11 14 11 15s.9 3 2.1 3.6c1.2.6 2.4.6 3.1.3 1-.4 1.9-1.3 2-2.5.1-1.1-.5-2.1-1.2-2.8-.7-.7-1.7-1-2.5-1.1-1.2-.1-2.2.4-2.8 1-.6.6-1.1 1.4-1.1 2.2z"></path><path d="M12 2v2"></path><path d="m4.9 4.9 1.4 1.4"></path><path d="M2 12h2"></path><path d="m4.9 19.1 1.4-1.4"></path><path d="M12 22v-2"></path><path d="m19.1 19.1-1.4-1.4"></path><path d="M22 12h-2"></path><path d="m19.1 4.9-1.4 1.4"></path></svg>'
    }
};

/* -------------------------------------------------------------------------- */
/* 3. دوال المساعدة والتحقق (Helpers & Validation)                           */
/* -------------------------------------------------------------------------- */

// دالة لاختصار الوصول للعناصر عبر ID
function $(id) {
    return document.getElementById(id);
}

// دالة للحصول على مفتاح المادة الحالية من الرابط
function getSubjectKey() {
    try {
        const params = new URLSearchParams(window.location.search);
        return params.get('subject') || DEFAULT_SUBJECT;
    } catch (e) {
        return DEFAULT_SUBJECT;
    }
}

// دالة التحقق من صحة الاسم (مرن: يقبل 3 حروف فأكثر، عربي أو إنجليزي)
function isValidName(name) {
    const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]{3,50}$/;
    return nameRegex.test(name.trim());
}

// دالة التحقق من صحة البريد الإلكتروني
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

// دالة للتحقق من وجود ملف على الخادم قبل محاولة عرضه
async function fileExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (e) {
        console.warn(`File check failed for ${url}`);
        return false;
    }
}

// دالة لإخفاء المحتوى وعرض رسالة (للحظر أو الأخطاء)
function hideContent(title, message) {
    const quizContainer = document.querySelector('.quiz-container');
    const mainContainer = document.querySelector('.main-container');

    const htmlContent = `
        <div class="quiz-header"><h2>${title}</h2></div>
        <div class="quiz-body">
            <p class="placeholder" style="color: var(--color-incorrect);">${message}</p>
        </div>`;

    const mainHtml = `
        <header class="main-header"><h1 class="logo">${title}</h1></header>
        <main>
            <p class="placeholder" style="color: var(--color-incorrect); text-align: center; padding: 3rem;">${message}</p>
        </main>`;

    if (quizContainer) {
        quizContainer.innerHTML = htmlContent;
    } else if (mainContainer) {
        mainContainer.innerHTML = mainHtml;
    } else {
        document.body.innerHTML = `<h1 style="color: red; text-align: center; margin-top: 50px;">${title}</h1><p style="text-align: center;">${message}</p>`;
    }
}

/* -------------------------------------------------------------------------- */
/* 4. دوال الاتصال بالخادم (Backend API Calls)                               */
/* -------------------------------------------------------------------------- */

// تسجيل نشاط المستخدم
function logActivity(activityType, subjectName = null) {
    if (!STUDENT_ID) return; 
    fetch(`${API_URL}/log-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            studentId: STUDENT_ID,
            activityType: activityType,
            subjectName: subjectName
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.id) console.log(`✓ تم تسجيل النشاط: ${activityType}`);
    })
    .catch(err => console.error('فشل تسجيل النشاط:', err));
}

// حفظ نتيجة الاختبار
function saveQuizResult(quizName, score, totalQuestions, correctAnswers) {
    if (!STUDENT_ID) return;
    
    // تنظيف الاسم من المسافات الزائدة
    const cleanQuizName = quizName.trim();
    
    fetch(`${API_URL}/quiz-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            studentId: STUDENT_ID,
            quizName: cleanQuizName,
            score: score,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers
        })
    })
    .then(res => res.json())
    .then(data => console.log('✓ تم حفظ النتيجة بنجاح:', cleanQuizName))
    .catch(err => console.error('خطأ في حفظ النتيجة:', err));
}

// تحميل بيانات المادة (JSON) مع منع الكاش
function loadSubjectData(subjectKey) {
    return new Promise((resolve, reject) => {
        if (!subjectKey || !SUBJECTS[subjectKey]) {
            reject(new Error('Invalid subject'));
            return;
        }
        const qUrl = `data_${subjectKey}/data_${subjectKey}_quiz.json?v=${Date.now()}`;
        const sUrl = `data_${subjectKey}/data_${subjectKey}_summary.json?v=${Date.now()}`;

        Promise.all([
            fetch(qUrl).then(r => r.ok ? r.json() : {}).catch(() => ({})),
            fetch(sUrl).then(r => r.ok ? r.json() : {}).catch(() => ({}))
        ])
        .then(results => {
            resolve({ quizData: results[0], summaryData: results[1] });
        })
        .catch(reject);
    });
}

/* -------------------------------------------------------------------------- */
/* 5. نظام المصادقة والحماية (Authentication System)                         */
/* -------------------------------------------------------------------------- */

// الحصول على بصمة الجهاز الفريدة
async function getFingerprint() {
    try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return result.visitorId;
    } catch (err) {
        console.error('فشل الحصول على بصمة الجهاز:', err);
        return null;
    }
}

// دالة تسجيل الطالب الجديد
async function registerStudent(fingerprint) {
    let name = prompt('أهلاً بك في منصة Tawal Academy!\n\nالرجاء كتابة اسمك:');
    
    // التحقق من الاسم
    while (!name || !isValidName(name)) {
        if (name === null) return false; 
        name = prompt('الرجاء كتابة اسمك (حروف فقط):');
    }

    let email = prompt('الرجاء كتابة البريد الإلكتروني:');
    
    // التحقق من البريد
    while (!email || !isValidEmail(email)) {
        if (email === null) return false; 
        email = prompt('الرجاء كتابة البريد الإلكتروني بشكل صحيح:');
    }

    try {
        const response = await fetch(`${API_URL}/students/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, fingerprint })
        });
        
        const data = await response.json();

        // حالة الحظر
        if (response.status === 403) {
            hideContent('الجهاز محظور', data.error);
            return false;
        }

        // في حالة النجاح (أو استرجاع حساب موجود)
        if (data.id) {
            STUDENT_ID = data.id;
            localStorage.setItem(STORAGE_KEY_ID, data.id);
            localStorage.setItem(STORAGE_KEY_NAME, data.name);
            
            if (data.message && data.message.includes('موجود')) {
                alert(`أهلاً بعودتك يا ${data.name}!`);
            } else {
                alert(`أهلاً بك يا ${data.name}! تم التسجيل بنجاح.`);
            }
            return true;
        } 
        
        // في حالة وجود مشكلة أخرى
        else if (data.error && data.error.includes('البريد الإلكتروني مسجل بالفعل')) {
            alert('⚠️ هذا البريد مسجل بالفعل. حاول مرة أخرى.');
            return false;
        } else {
            alert('حدث خطأ: ' + data.error);
            return false;
        }

    } catch (err) {
        console.error(err);
        alert('فشل الاتصال بالخادم.');
        return false;
    }
}

// التحقق من صلاحية المستخدم الحالي
async function verifyStudent(localId) {
    if (!localId) return { status: 'new_user' };

    try {
        const response = await fetch(`${API_URL}/students/${localId}`);
        if (response.ok) {
            const student = await response.json();
            // التحقق من الحظر
            if (student.isblocked) {
                return { status: 'account_blocked' };
            }
            STUDENT_ID = localId;
            return { status: 'valid' };
        } else {
            // المعرف قديم أو غير موجود
            return { status: 'id_mismatch' };
        }
    } catch (err) {
        return { status: 'network_error', error: err };
    }
}

// تسجيل الدخول بالبصمة (للتحقق من حظر الجهاز)
async function loginWithFingerprint(studentId, fingerprint) {
    if (!studentId || !fingerprint) return { status: 'error' };
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, fingerprint })
        });
        const data = await response.json();
        
        if (response.status === 403) {
            return { status: 'fingerprint_blocked', message: data.error };
        }
        if (response.ok) {
            return { status: 'success', logId: data.logId };
        }
        return { status: 'error', message: data.error };
    } catch (e) {
        return { status: 'error' };
    }
}

// سؤال الأمان في الصفحة الرئيسية
function checkAccessPermission() {
    const ans = prompt("هل صليت على النبي اليوم؟\n\nمفتاح الدخول: صلى الله عليه وسلم", "");
    if (!ans) return false;
    
    const norm = ans.replace(/[\u064B-\u0652]/g, '')
                    .replace(/ـ/g, '')
                    .replace(/[ى]/g, 'ي')
                    .replace(/صلِ/g, 'صل')
                    .trim();
                    
    return ["صلي", "الله", "عليه", "وسلم", "صل"].some(k => norm.includes(k));
}

/* -------------------------------------------------------------------------- */
/* 6. نقطة الانطلاق الرئيسية (Main Execution Point)                           */
/* -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', async () => {
    initThemeToggle(); // تفعيل الوضع الليلي
    
    // 1. جلب البصمة
    FINGERPRINT_ID = await getFingerprint();

    // 2. التحقق من المستخدم
    const localId = localStorage.getItem(STORAGE_KEY_ID);
    const verification = await verifyStudent(localId);

    // أ. الحساب محظور
    if (verification.status === 'account_blocked') {
        hideContent('الحساب محظور', 'تم إيقاف هذا الحساب. الرجاء التواصل مع الإدارة.');
        return;
    }
    
    // ب. مستخدم جديد أو بيانات غير متطابقة
    if (verification.status === 'id_mismatch' || verification.status === 'new_user') {
        localStorage.removeItem(STORAGE_KEY_ID);
        localStorage.removeItem(STORAGE_KEY_NAME);
        
        const isRegistered = await registerStudent(FINGERPRINT_ID);
        if (!isRegistered) return; // إلغاء أو فشل
    }

    // 3. سؤال الصلاة (في الرئيسية فقط)
    const subjectsGrid = $('subjects-grid'); 
    if (subjectsGrid) {
        if (!checkAccessPermission()) {
            hideContent('الوصول مرفوض', 'الإجابة غير صحيحة.');
            return; 
        }
    }
    
    // 4. تسجيل الدخول بالبصمة
    const loginResult = await loginWithFingerprint(STUDENT_ID, FINGERPRINT_ID);
    
    if (loginResult.status === 'fingerprint_blocked') {
        hideContent('الجهاز محظور', loginResult.message);
        return;
    }

    // 5. توجيه وتحميل المحتوى المناسب
    const subjectKey = getSubjectKey();
    const quizBody = $('quiz-body');
    const summaryFilesContent = $('summary-content-files'); 
    const dashboardContent = $('dashboard-content'); 

    try {
        if (subjectsGrid) {
            initIndexPage();
        } else if (quizBody) {
            await initQuizPage(subjectKey); // صفحة الاختبار (نظام المستويات)
        } else if (summaryFilesContent) {
            await initSummaryPage(subjectKey);
        } else if (dashboardContent) { 
            initDashboardPage(); 
        }
    } catch (err) {
        console.error('Initialization error', err);
    }
});


/* -------------------------------------------------------------------------- */
/* 7. دوال إدارة الصفحات (Page Controllers)                                  */
/* -------------------------------------------------------------------------- */

function initThemeToggle() {
    const btn = $('theme-toggle-btn');
    const saved = localStorage.getItem('theme') || 'dark';
    if (saved === 'light') {
        document.body.classList.add('light-mode');
    }
    if (btn) {
        btn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
        });
    }
}

// --- الصفحة الرئيسية ---
async function initIndexPage() {
    const grid = $('subjects-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const logoEl = document.querySelector('.main-header .logo');
    if(logoEl) logoEl.innerHTML = LOGO_SVG;
    
    for (const key in SUBJECTS) {
        const s = SUBJECTS[key];
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.dataset.subjectKey = key; 

        card.innerHTML = `
            <div class="card-icon">${s.icon || '📘'}</div> 
            <h3 class="card-title">${s.title}</h3>
            <div class="card-actions">
                <a href="quiz.html?subject=${encodeURIComponent(key)}" class="card-btn btn-quiz disabled" aria-disabled="true">🧠 اختبار (قريباً)</a>
                <a href="summary.html?subject=${encodeURIComponent(key)}" class="card-btn btn-summary disabled" aria-disabled="true">📖 ملخص (قريباً)</a>
            </div>
        `;
        grid.appendChild(card);
    }
    
    const allCards = grid.querySelectorAll('.subject-card');

    for (const card of allCards) {
        await loadAndEnableCard(card.dataset.subjectKey, card);
    }

    const searchBar = $('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim().toLowerCase();
            let visibleCount = 0;
            allCards.forEach(card => {
                const title = SUBJECTS[card.dataset.subjectKey].title.toLowerCase();
                const vis = title.normalize("NFKD").replace(/[\u064B-\u0652]/g, "").includes(searchTerm.normalize("NFKD").replace(/[\u064B-\u0652]/g, ""));
                card.style.display = vis ? 'flex' : 'none';
                if(vis) visibleCount++;
            });
            $('no-results-message').style.display = (visibleCount === 0) ? 'block' : 'none';
        });
    }
}

async function loadAndEnableCard(key, cardElement) {
    try {
        const data = await loadSubjectData(key); 
        // تفعيل زر الاختبار إذا كان هناك مستويات أو أسئلة
        const quizAvailable = (data.quizData?.questions && data.quizData.questions.length > 0) || true;
        if (quizAvailable) {
            const quizBtn = cardElement.querySelector('.btn-quiz');
            if(quizBtn) {
                quizBtn.classList.remove('disabled');
                quizBtn.innerText = '🧠 اختبار';
                quizBtn.setAttribute('aria-disabled', 'false');
            }
        }
        if (data && (data.summaryData.files?.length > 0 || data.summaryData.images?.length > 0 || data.summaryData.content?.length > 100)) { 
            const summaryBtn = cardElement.querySelector('.btn-summary');
            if(summaryBtn) {
                summaryBtn.classList.remove('disabled');
                summaryBtn.innerText = '📖 ملخص';
                summaryBtn.setAttribute('aria-disabled', 'false');
            }
        }
    } catch (e) {}
}

// --- صفحة الملخص ---
async function initSummaryPage(subjectKey) {
    const titleEl = $('summary-title');
    const tabsContainer = document.querySelector('.summary-tabs');
    const filesContentEl = $('summary-content-files');
    const imagesContentEl = $('summary-content-images');

    if (!subjectKey) {
        titleEl.innerText = 'خطأ';
        return;
    }
    
    try {
        const data = await loadSubjectData(subjectKey); 
        const subjectTitle = data.summaryData.title || SUBJECTS[subjectKey].title;
        titleEl.innerText = subjectTitle;
        
        const backBtn = document.createElement('a');
        backBtn.href = 'index.html';
        backBtn.className = 'card-btn next-btn';
        backBtn.innerText = '🏠 العودة للرئيسية';
        backBtn.style.marginTop = '2rem';

        const hasFiles = data.summaryData.files?.length > 0;
        const hasImages = data.summaryData.images?.length > 0;
        const hasOldContent = data.summaryData.content?.length > 100;

        if (hasFiles || hasImages) {
            tabsContainer.style.display = 'flex';
            
            // تبويب الملفات
            if (hasFiles) {
                let filesHtml = '<ul class="file-download-list">';
                const checks = data.summaryData.files.map(async f => {
                    if(await fileExists(f.path)) {
                        let icon = f.type==='pdf'?'📕':f.type==='doc'?'📘':'📄';
                        return `<li class="file-download-item"><a href="${f.path}" target="_blank" class="file-download-link"><span class="file-download-icon">${icon}</span><span class="file-download-name">${f.name}</span></a></li>`;
                    } return '';
                });
                const res = await Promise.all(checks);
                filesContentEl.innerHTML = res.join('') || '<p class="placeholder">لا توجد ملفات متاحة.</p>';
            } else { filesContentEl.innerHTML = '<p class="placeholder">لا توجد ملفات.</p>'; }
            
            // تبويب الصور
            if (hasImages) {
                let imgHtml = '<div class="gallery-grid">';
                const checks = data.summaryData.images.map(async i => {
                    if(await fileExists(i.path)) {
                        return `<div class="gallery-item"><img src="${i.path}" alt="صورة"><p>${i.caption||'صورة'}</p></div>`;
                    } return '';
                });
                const res = await Promise.all(checks);
                imagesContentEl.innerHTML = res.join('') ? (imgHtml + res.join('') + '</div>') : '<p class="placeholder">لا توجد صور.</p>';
            } else { imagesContentEl.innerHTML = '<p class="placeholder">لا توجد صور.</p>'; }

            filesContentEl.appendChild(backBtn.cloneNode(true));
            imagesContentEl.appendChild(backBtn.cloneNode(true));
        
            const fTab = $('btn-summary-files');
            const iTab = $('btn-summary-images');

            fTab.addEventListener('click', () => {
                filesContentEl.style.display = 'block';
                imagesContentEl.style.display = 'none';
                fTab.classList.add('active');
                iTab.classList.remove('active');
                logActivity('Viewed Summary Files', subjectTitle);
            });

            iTab.addEventListener('click', () => {
                filesContentEl.style.display = 'none';
                imagesContentEl.style.display = 'block';
                fTab.classList.remove('active');
                iTab.classList.add('active');
                logActivity('Viewed Image Gallery', subjectTitle);
            });
            
            // التبويب الافتراضي
            if (filesContentEl.innerHTML.includes('li')) fTab.click(); 
            else if (imagesContentEl.innerHTML.includes('img')) iTab.click();
            else fTab.click();

            // Lightbox
            const modal = $('lightbox-modal');
            if (modal) {
                const modalImg = $('lightbox-img');
                const closeModal = $('lightbox-close');
                
                const closeLightbox = () => modal.classList.remove('show');
                closeModal.onclick = closeLightbox;
                modal.onclick = (e) => { if (e.target === modal) closeLightbox(); };
                
                setTimeout(() => {
                    document.querySelectorAll('.gallery-item img').forEach(img => img.onclick = () => { modal.classList.add('show'); modalImg.src = img.src; });
                    filesContentEl.querySelectorAll('img').forEach(img => img.onclick = () => { modal.classList.add('show'); modalImg.src = img.src; });
                }, 500);
            }

        } else if (hasOldContent) {
            tabsContainer.style.display = 'none';
            imagesContentEl.style.display = 'none';
            filesContentEl.innerHTML = data.summaryData.content;
            filesContentEl.appendChild(backBtn);
            logActivity('Viewed Summary (Old)', subjectTitle);
        } else {
            tabsContainer.style.display = 'none';
            imagesContentEl.style.display = 'none';
            filesContentEl.innerHTML = '<p class="placeholder">الملخص غير متاح.</p>';
        }
    } catch (e) {
        console.error(e);
        titleEl.innerText = 'خطأ في التحميل';
    }
}

// --- لوحة التقدم ---
async function initDashboardPage() {
    const container = $('dashboard-content');
    if (!container) return;

    if (!STUDENT_ID) {
        container.innerHTML = '<p class="dashboard-empty-state">الرجاء تسجيل الدخول أولاً.</p>';
        return;
    }
    
    container.innerHTML = '<p class="dashboard-empty-state">جاري تحميل إحصائياتك...</p>';

    try {
        const [stats, results] = await Promise.all([
            fetch(`${API_URL}/students/${STUDENT_ID}/stats`).then(r=>r.json()),
            fetch(`${API_URL}/students/${STUDENT_ID}/results`).then(r=>r.json())
        ]);

        if (stats.error) throw new Error('فشل التحميل');

        let html = `
            <div class="dashboard-summary-grid">
                <div class="summary-box"><p class="summary-box-label">الاختبارات</p><p class="summary-box-value">${stats.totalQuizzes}</p></div>
                <div class="summary-box"><p class="summary-box-label">المتوسط</p><p class="summary-box-value ${stats.averageScore>=50?'correct':'incorrect'}">${stats.averageScore}</p></div>
                <div class="summary-box"><p class="summary-box-label">الأفضل</p><p class="summary-box-value level-excellent">${stats.bestScore}</p></div>
            </div><div class="results-divider"></div>`;

        const byQuiz = {};
        results.forEach(r => { if(!byQuiz[r.quizName]) byQuiz[r.quizName]=[]; byQuiz[r.quizName].push(r); });

        for (const q in byQuiz) {
            html += `<div class="subject-history-card"><h3>${q}</h3><ul class="history-list">`;
            byQuiz[q].forEach(r => {
                let cls = r.score>=300?'excellent':r.score>=150?'good':r.score>=50?'pass':'fail';
                html += `<li class="history-item"><span class="score level-${cls}">${r.score} نقطة</span><span class="score-details">(${r.correctAnswers}/${r.totalQuestions})</span><span class="history-date">${new Date(r.completedAt).toLocaleDateString('ar-EG')}</span></li>`;
            });
            html += '</ul></div>';
        }
        container.innerHTML = results.length ? html : '<p class="dashboard-empty-state">لا توجد اختبارات.</p>';
    } catch (e) { container.innerHTML = '<p class="dashboard-empty-state" style="color:red">فشل التحميل.</p>'; }
}

/* -------------------------------------------------------------------------- */
/* 7. منطق الاختبار الجديد (Levels & Locking)                               */
/* -------------------------------------------------------------------------- */

async function initQuizPage(subjectKey) {
    if(!subjectKey) return;
    const titleEl = $('quiz-title');
    const body = $('quiz-body');
    const footer = $('quiz-footer');

    if (!SUBJECTS[subjectKey]) { titleEl.innerText = 'خطأ'; return; }
    titleEl.innerText = SUBJECTS[subjectKey].title;
    footer.style.display = 'none';

    // 1. جلب نتائج الطالب لمعرفة المستويات المفتوحة
    let results = [];
    try {
        const res = await fetch(`${API_URL}/students/${STUDENT_ID}/results`);
        results = await res.json();
    } catch (e) { console.error(e); }

    // 2. بناء واجهة المستويات
    let html = '<div class="levels-grid">';

    // التكرار على المستويات الثلاثة
    LEVEL_CONFIG.forEach((lvl, idx) => {
        // اسم الاختبار كما يخزن في قاعدة البيانات
        const quizTitlePart = lvl.titleSuffix; 

        // حساب أفضل درجة لهذا المستوى
        let myScore = 0;
        const myAttempts = results.filter(r => r.quizName.includes(SUBJECTS[subjectKey].title) && r.quizName.includes(quizTitlePart));
        if (myAttempts.length) {
            myScore = Math.max(...myAttempts.map(r => Math.round((r.correctAnswers/r.totalQuestions)*100)));
        }

        // التحقق من القفل (هل نجح في المستوى السابق؟)
        let locked = false;
        if (idx > 0) {
            const prevLvlName = LEVEL_CONFIG[idx-1].titleSuffix;
            const prevAttempts = results.filter(r => r.quizName.includes(SUBJECTS[subjectKey].title) && r.quizName.includes(prevLvlName));
            
            const passed = prevAttempts.some(r => (r.correctAnswers/r.totalQuestions) >= 0.8);
            if (!passed) locked = true;
        }

        const btnCls = locked ? 'locked-btn' : 'start';
        const btnTxt = locked ? `🔒 مغلق (مطلوب 80% في المستوى ${idx})` : '🚀 ابدأ الاختبار';
        // استخدام دالة عامة
        const action = locked ? '' : `loadLevelFile('${subjectKey}', ${idx})`;
        const badge = myScore > 0 ? `<div style="color:${myScore>=80?'var(--color-correct)':'var(--color-pass)'};margin-bottom:10px;font-weight:bold;">أفضل درجة: ${myScore}%</div>` : '';

        html += `
            <div class="level-card ${locked?'locked':''}">
                <div class="level-icon">${locked?'🔒':'🔓'}</div>
                <h3 class="level-title">${lvl.name}</h3>
                ${badge}
                <button class="level-btn ${btnCls}" onclick="${action}">${btnTxt}</button>
            </div>
        `;
    });
    
    body.innerHTML = html + '</div>';
}

// دالة تحميل ملف المستوى وتشغيله (Global)
window.loadLevelFile = async (subjectKey, levelIndex) => {
    const config = LEVEL_CONFIG[levelIndex];
    const fileName = `data_${subjectKey}/data_${subjectKey}${config.suffix}`; 
    const url = `${fileName}?v=${Date.now()}`;

    $('quiz-body').innerHTML = '<p style="text-align:center; padding:3rem;">جاري تحميل الاختبار...</p>';

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('ملف الاختبار غير موجود');
        const quizData = await res.json();
        
        // تشغيل المحرك مع الاسم الكامل
        const fullTitle = `${SUBJECTS[subjectKey].title} - ${config.titleSuffix}`;
        initAndStartQuiz(quizData.questions, fullTitle);
    } catch (e) {
        alert('عذراً، ملف الأسئلة غير موجود حالياً.');
        initQuizPage(subjectKey); // العودة للقائمة
    }
};


/* -------------------------------------------------------------------------- */
/* 8. محرك الاختبار (Quiz Engine - Global Scope)                             */
/* -------------------------------------------------------------------------- */

// تعريف المتغيرات العامة للمحرك
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let currentCorrectCount = 0;
let incorrectQuestions = [];
let quizStartTime = 0;
let questionStartTime = 0;
let currentQuizTitle = "";

// دالة البدء
function initAndStartQuiz(questions, title) {
    currentQuestions = [...questions].sort(() => Math.random() - 0.5);
    currentQuizTitle = title;
    currentQuestionIndex = 0;
    currentScore = 0;
    currentCorrectCount = 0;
    incorrectQuestions = [];

    // إعادة بناء الهيكل
    $('quiz-body').innerHTML = `
        <h3 id="question-text"></h3>
        <div id="opts" class="options-container"></div>
        <p id="feedback" class="feedback"></p>
    `;
    $('results-container').style.display = 'none';
    $('quiz-footer').style.display = 'block';
    
    const btn = $('next-btn');
    btn.style.display = 'block';
    btn.innerText = 'التالي';
    btn.onclick = handleNextButton;

    loadQuestion();
}

function loadQuestion() {
    const q = currentQuestions[currentQuestionIndex];
    $('question-text').innerText = q.question;
    $('question-counter').innerText = `${currentQuestionIndex + 1} / ${currentQuestions.length}`;
    $('progress-bar').style.width = `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%`;
    
    const feedback = $('feedback');
    feedback.innerText = ''; 
    feedback.className = 'feedback';
    
    $('next-btn').disabled = true;
    questionStartTime = Date.now();

    const optsDiv = $('opts');
    optsDiv.innerHTML = '';

    if (q.type === 'tf') {
        ['صح', 'خطأ'].forEach((txt, i) => {
            const isTrue = i === 0; 
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `<span class="option-text">${txt}</span><span class="icon"></span>`;
            btn.onclick = () => checkAnswer(btn, isTrue === q.answer);
            optsDiv.appendChild(btn);
        });
    } else {
        q.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `<span class="option-text">${opt}</span><span class="icon"></span>`;
            btn.onclick = () => checkAnswer(btn, i === q.answer);
            optsDiv.appendChild(btn);
        });
    }
    
    $('quiz-body').style.display = 'block';
}

// دالة التحقق (Global)
window.checkAnswer = function(btn, isCorrect) {
    document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    
    if (isCorrect) {
        currentCorrectCount++;
        let pts = 20; // نقاط أساسية
        if (timeTaken < 5) pts += 5; // بونص سرعة
        
        currentScore += pts;
        btn.classList.add('correct');
        $('feedback').innerText = `✅ إجابة صحيحة! (+${pts} نقطة)`;
        $('feedback').classList.add('correct');
    } else {
        btn.classList.add('incorrect');
        $('feedback').innerText = '❌ إجابة خاطئة';
        $('feedback').classList.add('incorrect');
        incorrectQuestions.push(currentQuestions[currentQuestionIndex]);
    }
    
    const nextBtn = $('next-btn');
    nextBtn.disabled = false;
    
    if (currentQuestionIndex === currentQuestions.length - 1) {
        nextBtn.innerText = 'عرض النتيجة';
    } else {
        nextBtn.innerText = 'السؤال التالي ←';
    }
};

function handleNextButton() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    $('quiz-body').style.display = 'none';
    $('quiz-footer').style.display = 'none';
    const resDiv = $('results-container');
    resDiv.style.display = 'flex';

    // حفظ النتيجة إذا لم تكن مراجعة
    if (!currentQuizTitle.includes('مراجعة')) {
        saveQuizResult(currentQuizTitle, currentScore, currentQuestions.length, currentCorrectCount);
    }

    const percent = Math.round((currentCorrectCount / currentQuestions.length) * 100);
    
    let reviewBtn = '';
    if (incorrectQuestions.length > 0) {
        reviewBtn = `<button onclick="startReview()" class="card-btn btn-summary" style="background-color: var(--color-incorrect); color: white;">🔁 مراجعة الأخطاء (${incorrectQuestions.length})</button>`;
    }

    resDiv.innerHTML = `
        <div class="results-chart" style="--percentage-value:${percent*3.6}deg"><span class="percentage-text">${percent}%</span></div>
        <h3>${currentQuizTitle}</h3>
        <h2 style="color:var(--primary-color)">${currentScore} نقطة</h2>
        <p>أجبت ${currentCorrectCount} من ${currentQuestions.length} بشكل صحيح.</p>
        <div class="results-actions" style="flex-wrap:wrap; justify-content:center; gap:10px;">
            ${reviewBtn}
            <button onclick="location.reload()" class="card-btn btn-summary">القائمة الرئيسية</button>
            <button onclick="location.reload()" class="next-btn">إعادة</button>
        </div>
    `;
}

window.startReview = function() {
    initAndStartQuiz(incorrectQuestions, `${currentQuizTitle} (مراجعة)`);
};

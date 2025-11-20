/*
 * =================================================================================
 * APP.JS - Tawal Academy Client Logic
 * Version: 14.0.0 (Final Fixed Full Version - Multi-Level Support)
 * =================================================================================
 * * هذا الملف يحتوي على المنطق الكامل للواجهة الأمامية.
 * * تم إصلاح مسارات الملفات لدعم (quiz_1, quiz_2, quiz_3).
 * * تم دمج كافة الميزات (المستويات، الحظر، البصمة، التسجيل الذكي).
 * =================================================================================
 */

/* -------------------------------------------------------------------------- */
/* 1. إعدادات الاتصال والمتغيرات العامة                                      */
/* -------------------------------------------------------------------------- */

// رابط الخادم (Backend)
const API_URL = 'https://tawal-backend-production.up.railway.app/api';

// مفاتيح التخزين
const STORAGE_KEY_ID = 'tawal_studentId_v4'; 
const STORAGE_KEY_NAME = 'tawal_studentName_v4';

// متغيرات الجلسة
let STUDENT_ID = localStorage.getItem(STORAGE_KEY_ID);
let FINGERPRINT_ID = null;

// إعدادات أخرى
const DEFAULT_SUBJECT = 'gis_networks';

// متغيرات الاختبار العامة
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let currentCorrectCount = 0;
let incorrectQuestions = [];
let questionStartTime = 0;
let currentQuizTitle = "";

// إعدادات المستويات (Level Config) - هذه الأسماء تطابق نهايات ملفاتك
const LEVEL_CONFIG = [
    { id: 1, suffix: '_quiz_1.json', titleSuffix: 'المستوى 1', name: 'المستوى الأول (مبتدئ)', requiredScore: 0 },
    { id: 2, suffix: '_quiz_2.json', titleSuffix: 'المستوى 2', name: 'المستوى الثاني (متوسط)', requiredScore: 80 },
    { id: 3, suffix: '_quiz_3.json', titleSuffix: 'المستوى 3', name: 'المستوى الثالث (متقدم)', requiredScore: 80 }
];

// شعار الأكاديمية
const LOGO_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M40 8H8c-2.21 0-4 1.79-4 4v24c0 2.21 1.79 4 4 4h32c2.21 0 4-1.79 4-4V12c0-2.21-1.79-4-4-4z" fill="currentColor"/>
        <path d="M18 20l6 12 6-12" stroke="white" stroke-width="2"/>
        <line x1="16" y1="20" x2="32" y2="20" stroke="white" stroke-width="2"/>
    </svg>
`;

/* -------------------------------------------------------------------------- */
/* 2. قائمة المواد الدراسية (Subjects)                                       */
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
        title: "نصوص جغرافية فى المساحة والخرائط",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 16 4-4-4-4"></path><path d="m8 16 4-4-4-4"></path><path d="M2 12h20"></path></svg>'
    },
    arid_lands: {
        title: "جغرافيا الاراضي الجافة",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.1 12.4C17.1 12.4 17 14 17 15s.9 3 2.1 3.6c1.2.6 2.4.6 3.1.3 1-.4 1.9-1.3 2-2.5.1-1.1-.5-2.1-1.2-2.8-.7-.7-1.7-1-2.5-1.1-1.2-.1-2.2.4-2.8 1-.6.6-1.1 1.4-1.1 2.2z"></path><path d="M5.1 12.4C5.1 12.4 5 14 5 15s.9 3 2.1 3.6c1.2.6 2.4.6 3.1.3 1-.4 1.9-1.3 2-2.5.1-1.1-.5-2.1-1.2-2.8-.7-.7-1.7-1-2.5-1.1-1.2-.1-2.2.4-2.8 1-.6.6-1.1 1.4-1.1 2.2z"></path><path d="M11.1 12.4C11.1 12.4 11 14 11 15s.9 3 2.1 3.6c1.2.6 2.4.6 3.1.3 1-.4 1.9-1.3 2-2.5.1-1.1-.5-2.1-1.2-2.8-.7-.7-1.7-1-2.5-1.1-1.2-.1-2.2.4-2.8 1-.6.6-1.1 1.4-1.1 2.2z"></path><path d="M12 2v2"></path><path d="m4.9 4.9 1.4 1.4"></path><path d="M2 12h2"></path><path d="m4.9 19.1 1.4-1.4"></path><path d="M12 22v-2"></path><path d="m19.1 19.1-1.4-1.4"></path><path d="M22 12h-2"></path><path d="m19.1 4.9-1.4 1.4"></path></svg>'
    }
};

/* -------------------------------------------------------------------------- */
/* 3. دوال المساعدة والتحقق (Helpers)                                        */
/* -------------------------------------------------------------------------- */

function $(id) { return document.getElementById(id); }

function getSubjectKey() {
    try {
        const params = new URLSearchParams(window.location.search);
        return params.get('subject') || DEFAULT_SUBJECT;
    } catch (e) {
        return DEFAULT_SUBJECT;
    }
}

function isValidName(name) {
    const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]{3,50}$/;
    return nameRegex.test(name.trim());
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

async function fileExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (e) { return false; }
}

function hideContent(title, message) {
    const quizContainer = document.querySelector('.quiz-container');
    const mainContainer = document.querySelector('.main-container');
    const htmlContent = `<div class="quiz-header"><h2>${title}</h2></div><div class="quiz-body"><p class="placeholder" style="color: var(--color-incorrect);">${message}</p></div>`;
    const mainHtml = `<header class="main-header"><h1 class="logo">${title}</h1></header><main><p class="placeholder" style="color: var(--color-incorrect); text-align: center; padding: 3rem;">${message}</p></main>`;
    if (quizContainer) quizContainer.innerHTML = htmlContent;
    else if (mainContainer) mainContainer.innerHTML = mainHtml;
    else document.body.innerHTML = `<h1 style="color: red; text-align: center; margin-top: 50px;">${title}</h1><p style="text-align: center;">${message}</p>`;
}

/* -------------------------------------------------------------------------- */
/* 4. دوال الاتصال بالخادم (API Calls)                                      */
/* -------------------------------------------------------------------------- */

function logActivity(activityType, subjectName = null) {
    if (!STUDENT_ID) return; 
    fetch(`${API_URL}/log-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: STUDENT_ID, activityType, subjectName })
    }).catch(err => console.error('Log Error:', err));
}

function saveQuizResult(quizName, score, totalQuestions, correctAnswers) {
    if (!STUDENT_ID) return;
    fetch(`${API_URL}/quiz-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: STUDENT_ID, quizName: quizName.trim(), score, totalQuestions, correctAnswers })
    })
    .then(() => console.log('✓ Result Saved'))
    .catch(err => console.error('Save Error:', err));
}

// دالة الفحص الذكية: تتحقق من وجود المستوى الأول والملخص لتمكين الأزرار
function loadSubjectData(subjectKey) {
    return new Promise((resolve, reject) => {
        if (!subjectKey || !SUBJECTS[subjectKey]) {
            reject(new Error('Invalid subject'));
            return;
        }
        // نبحث تحديداً عن المستوى الأول لاختبار الوجود
        const qUrl = `data_${subjectKey}/data_${subjectKey}_quiz_1.json?v=${Date.now()}`;
        const sUrl = `data_${subjectKey}/data_${subjectKey}_summary.json?v=${Date.now()}`;

        Promise.all([
            fetch(qUrl).then(r => r.ok ? r.json() : null).catch(() => null),
            fetch(sUrl).then(r => r.ok ? r.json() : null).catch(() => null)
        ])
        .then(results => {
            resolve({ hasQuiz: !!results[0], summaryData: results[1] || {} });
        })
        .catch(reject);
    });
}

/* -------------------------------------------------------------------------- */
/* 5. نظام المصادقة (Auth)                                                  */
/* -------------------------------------------------------------------------- */

async function getFingerprint() {
    try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return result.visitorId;
    } catch (err) { return null; }
}

async function registerStudent(fingerprint) {
    let name = prompt('أهلاً بك في منصة Tawal Academy!\n\nالرجاء كتابة اسمك ثلاثي:');
    while (!name || !isValidName(name)) {
        if (name === null) return false; 
        name = prompt('الرجاء كتابة اسمك بشكل صحيح (حروف فقط، 3 أحرف فأكثر):');
    }
    let email = prompt('الرجاء كتابة البريد الإلكتروني:');
    while (!email || !isValidEmail(email)) {
        if (email === null) return false; 
        email = prompt('الرجاء كتابة بريد إلكتروني صالح:');
    }

    try {
        const response = await fetch(`${API_URL}/students/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, fingerprint })
        });
        const data = await response.json();

        if (response.status === 403) {
            hideContent('الجهاز محظور', data.error);
            return false;
        }
        if (data.id) {
            STUDENT_ID = data.id;
            localStorage.setItem(STORAGE_KEY_ID, data.id);
            localStorage.setItem(STORAGE_KEY_NAME, data.name);
            alert(`أهلاً بك يا ${data.name}! تم التسجيل بنجاح.`);
            return true;
        } else if (data.error && data.error.includes('موجود')) {
            alert('⚠️ هذا البريد مسجل بالفعل.');
            return false;
        } else {
            alert('حدث خطأ: ' + data.error);
            return false;
        }
    } catch (err) {
        alert('فشل الاتصال بالخادم.');
        return false;
    }
}

async function verifyStudent(localId) {
    if (!localId) return { status: 'new_user' };
    try {
        const response = await fetch(`${API_URL}/students/${localId}`);
        if (response.ok) {
            const student = await response.json();
            if (student.isblocked) return { status: 'account_blocked' };
            STUDENT_ID = localId;
            return { status: 'valid' };
        } else { return { status: 'id_mismatch' }; }
    } catch (err) { return { status: 'network_error' }; }
}

async function loginWithFingerprint(studentId, fingerprint) {
    if (!studentId || !fingerprint) return { status: 'error' };
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, fingerprint })
        });
        const data = await response.json();
        if (response.status === 403) return { status: 'fingerprint_blocked', message: data.error };
        return response.ok ? { status: 'success' } : { status: 'error' };
    } catch (e) { return { status: 'error' }; }
}

/* -------------------------------------------------------------------------- */
/* 6. نقطة الانطلاق الرئيسية (Main Execution)                                */
/* -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', async () => {
    initThemeToggle();
    FINGERPRINT_ID = await getFingerprint();

    const localId = localStorage.getItem(STORAGE_KEY_ID);
    const verification = await verifyStudent(localId);

    if (verification.status === 'account_blocked') {
        hideContent('الحساب محظور', 'تم إيقاف هذا الحساب. الرجاء التواصل مع الإدارة.');
        return;
    }
    if (verification.status === 'id_mismatch' || verification.status === 'new_user') {
        localStorage.removeItem(STORAGE_KEY_ID);
        const isRegistered = await registerStudent(FINGERPRINT_ID);
        if (!isRegistered) return; 
    }

    const loginResult = await loginWithFingerprint(STUDENT_ID, FINGERPRINT_ID);
    if (loginResult.status === 'fingerprint_blocked') {
        hideContent('الجهاز محظور', loginResult.message);
        return;
    }

    // توجيه المستخدم للصفحة المناسبة
    const subjectKey = getSubjectKey();
    if ($('subjects-grid')) initIndexPage();
    else if ($('quiz-body')) initQuizPage(subjectKey);
    else if ($('summary-content-files')) initSummaryPage(subjectKey);
    else if ($('dashboard-content')) initDashboardPage(); 
});

/* -------------------------------------------------------------------------- */
/* 7. إدارة الصفحات (Page Controllers)                                       */
/* -------------------------------------------------------------------------- */

function initThemeToggle() {
    const btn = $('theme-toggle-btn');
    const saved = localStorage.getItem('theme') || 'dark';
    if (saved === 'light') document.body.classList.add('light-mode');
    if (btn) btn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    });
}

// الصفحة الرئيسية
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
                <a href="quiz.html?subject=${encodeURIComponent(key)}" class="card-btn btn-quiz disabled" aria-disabled="true">🧠 اختبار</a>
                <a href="summary.html?subject=${encodeURIComponent(key)}" class="card-btn btn-summary disabled" aria-disabled="true">📖 ملخص</a>
            </div>
        `;
        grid.appendChild(card);
    }
    
    const allCards = grid.querySelectorAll('.subject-card');
    for (const card of allCards) { await loadAndEnableCard(card.dataset.subjectKey, card); }

    // تفعيل البحث
    const searchBar = $('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            const term = e.target.value.trim().toLowerCase();
            let visibleCount = 0;
            allCards.forEach(card => {
                const title = SUBJECTS[card.dataset.subjectKey].title.toLowerCase();
                const vis = title.includes(term);
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
        if (data.hasQuiz) {
            const quizBtn = cardElement.querySelector('.btn-quiz');
            if(quizBtn) quizBtn.classList.remove('disabled');
        }
        if (data.summaryData.files?.length > 0 || data.summaryData.images?.length > 0) { 
            const summaryBtn = cardElement.querySelector('.btn-summary');
            if(summaryBtn) summaryBtn.classList.remove('disabled');
        }
    } catch (e) {}
}

// صفحة الملخص
async function initSummaryPage(subjectKey) {
    const titleEl = $('summary-title');
    const filesContentEl = $('summary-content-files');
    const imagesContentEl = $('summary-content-images');
    const fTab = $('btn-summary-files');
    const iTab = $('btn-summary-images');

    if (!SUBJECTS[subjectKey]) { titleEl.innerText = 'خطأ'; return; }
    
    try {
        // هنا نستخدم الرابط الصحيح للملخص _summary.json
        const res = await fetch(`data_${subjectKey}/data_${subjectKey}_summary.json?v=${Date.now()}`);
        if (!res.ok) throw new Error('No summary');
        const data = await res.json();

        titleEl.innerText = data.title || SUBJECTS[subjectKey].title;
        
        // عرض الملفات
        if (data.files?.length) {
            let filesHtml = '<ul class="file-download-list">';
            for (const f of data.files) {
                if(await fileExists(f.path)) {
                    let icon = f.type==='pdf'?'📕':f.type==='doc'?'📘':'📄';
                    filesHtml += `<li class="file-download-item"><a href="${f.path}" target="_blank" class="file-download-link"><span class="file-download-icon">${icon}</span><span class="file-download-name">${f.name}</span></a></li>`;
                }
            }
            filesContentEl.innerHTML = filesHtml + '</ul>';
        } else {
            filesContentEl.innerHTML = '<p class="placeholder">لا توجد ملفات متاحة.</p>';
        }

        // عرض الصور
        if (data.images?.length) {
            let imgHtml = '<div class="gallery-grid">';
            for (const img of data.images) {
                if(await fileExists(img.path)) {
                    imgHtml += `<div class="gallery-item"><img src="${img.path}" alt="صورة"><p>${img.caption||''}</p></div>`;
                }
            }
            imagesContentEl.innerHTML = imgHtml + '</div>';
            setupLightbox(); // تفعيل العرض المكبر
        } else {
            imagesContentEl.innerHTML = '<p class="placeholder">لا توجد صور متاحة.</p>';
        }

        // التبديل بين التبويبات
        document.querySelector('.summary-tabs').style.display = 'flex';
        fTab.addEventListener('click', () => {
            filesContentEl.style.display = 'block'; imagesContentEl.style.display = 'none';
            fTab.classList.add('active'); iTab.classList.remove('active');
        });
        iTab.addEventListener('click', () => {
            filesContentEl.style.display = 'none'; imagesContentEl.style.display = 'block';
            fTab.classList.remove('active'); iTab.classList.add('active');
        });
        fTab.click();

    } catch (e) {
        titleEl.innerText = 'الملخص غير متاح حالياً';
        filesContentEl.innerHTML = '<p class="placeholder">لم يتم رفع ملف الملخص لهذه المادة بعد.</p>';
    }
}

function setupLightbox() {
    const modal = $('lightbox-modal');
    const modalImg = $('lightbox-img');
    if(!modal) return;
    
    document.querySelectorAll('.gallery-item img').forEach(img => {
        img.onclick = () => { modal.classList.add('show'); modalImg.src = img.src; };
    });
    $('lightbox-close').onclick = () => modal.classList.remove('show');
    modal.onclick = (e) => { if(e.target === modal) modal.classList.remove('show'); };
}

/* -------------------------------------------------------------------------- */
/* 8. صفحة الاختبار (Quiz Logic & Levels)                                    */
/* -------------------------------------------------------------------------- */

async function initQuizPage(subjectKey) {
    if(!subjectKey || !SUBJECTS[subjectKey]) return;
    
    const titleEl = $('quiz-title');
    const body = $('quiz-body');
    const footer = $('quiz-footer');
    
    titleEl.innerText = SUBJECTS[subjectKey].title;
    footer.style.display = 'none';

    // جلب نتائج الطالب السابقة لتحديد المستويات المفتوحة
    let pastResults = [];
    try {
        const res = await fetch(`${API_URL}/students/${STUDENT_ID}/results`);
        pastResults = await res.json();
    } catch (e) {}

    // بناء واجهة المستويات
    let html = '<div class="levels-grid">';
    
    LEVEL_CONFIG.forEach((lvl, idx) => {
        // التحقق من القفل: المستوى 1 مفتوح دائماً، الباقي يعتمد على السابق
        let locked = false;
        if (idx > 0) {
            const prevLvl = LEVEL_CONFIG[idx - 1];
            const prevAttempts = pastResults.filter(r => 
                r.quizName.includes(SUBJECTS[subjectKey].title) && 
                r.quizName.includes(prevLvl.titleSuffix)
            );
            // هل نجح في المستوى السابق؟
            const passed = prevAttempts.some(r => {
                const percent = (r.correctAnswers / r.totalQuestions) * 100;
                return percent >= prevLvl.requiredScore;
            });
            if (!passed) locked = true;
        }

        // عرض أفضل درجة
        const myAttempts = pastResults.filter(r => 
            r.quizName.includes(SUBJECTS[subjectKey].title) && 
            r.quizName.includes(lvl.titleSuffix)
        );
        const bestScore = myAttempts.length ? Math.max(...myAttempts.map(r => Math.round((r.correctAnswers/r.totalQuestions)*100))) : 0;

        const btnClass = locked ? 'locked-btn' : 'start';
        const btnText = locked ? `🔒 مغلق (مطلوب ${LEVEL_CONFIG[idx-1]?.requiredScore}% في المستوى السابق)` : '🚀 ابدأ الاختبار';
        const onClick = locked ? '' : `loadLevelFile('${subjectKey}', ${idx})`;
        const badge = bestScore > 0 ? `<div style="color:${bestScore>=lvl.requiredScore?'var(--color-correct)':'var(--color-pass)'};margin-bottom:10px;font-weight:bold;">أفضل درجة: ${bestScore}%</div>` : '';

        html += `
            <div class="level-card ${locked?'locked':''}">
                <div class="level-icon">${locked?'🔒':'🔓'}</div>
                <h3 class="level-title">${lvl.name}</h3>
                ${badge}
                <button class="level-btn ${btnClass}" onclick="${onClick}">${btnText}</button>
            </div>
        `;
    });
    
    body.innerHTML = html + '</div>';
}

// دالة تحميل ملف الاختبار المحدد
window.loadLevelFile = async (subjectKey, levelIndex) => {
    const config = LEVEL_CONFIG[levelIndex];
    // بناء المسار: data_subject/data_subject_quiz_X.json
    const fileName = `data_${subjectKey}${config.suffix}`;
    const url = `data_${subjectKey}/${fileName}?v=${Date.now()}`;

    $('quiz-body').innerHTML = '<p style="text-align:center; padding:3rem;">جاري تحميل الأسئلة...</p>';

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('File not found');
        const quizData = await res.json();
        
        const fullTitle = `${SUBJECTS[subjectKey].title} - ${config.titleSuffix}`;
        initAndStartQuiz(quizData.questions, fullTitle);
    } catch (e) {
        alert('عذراً، ملف أسئلة هذا المستوى غير متوفر حالياً.');
        initQuizPage(subjectKey); // العودة للقائمة
    }
};

function initAndStartQuiz(questions, title) {
    currentQuestions = [...questions].sort(() => Math.random() - 0.5);
    currentQuizTitle = title;
    currentQuestionIndex = 0;
    currentScore = 0;
    currentCorrectCount = 0;
    incorrectQuestions = [];

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
    $('question-counter').innerText = `السؤال ${currentQuestionIndex + 1} / ${currentQuestions.length}`;
    $('progress-bar').style.width = `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%`;
    $('feedback').innerText = '';
    $('next-btn').disabled = true;
    
    questionStartTime = Date.now();
    const optsDiv = $('opts');
    optsDiv.innerHTML = '';

    const options = q.type === 'tf' ? ['صح', 'خطأ'] : q.options;
    
    options.forEach((txt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="option-text">${txt}</span><span class="icon"></span>`;
        
        // تحديد الإجابة الصحيحة
        let isCorrect = false;
        if (q.type === 'tf') isCorrect = (i === 0) === q.answer; // 0=صح
        else isCorrect = (i === q.answer);

        btn.onclick = () => checkAnswer(btn, isCorrect);
        optsDiv.appendChild(btn);
    });
    
    $('quiz-body').style.display = 'block';
}

function checkAnswer(btn, isCorrect) {
    document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    
    if (isCorrect) {
        currentCorrectCount++;
        let pts = 10;
        if (timeTaken < 5) pts += 5; // نقاط سرعة
        currentScore += pts;
        btn.classList.add('correct');
        $('feedback').innerText = `✅ إجابة صحيحة! (+${pts})`;
        $('feedback').classList.add('correct');
        $('feedback').classList.remove('incorrect');
    } else {
        btn.classList.add('incorrect');
        $('feedback').innerText = '❌ إجابة خاطئة';
        $('feedback').classList.add('incorrect');
        $('feedback').classList.remove('correct');
        incorrectQuestions.push(currentQuestions[currentQuestionIndex]);
    }
    
    const nextBtn = $('next-btn');
    nextBtn.disabled = false;
    nextBtn.innerText = (currentQuestionIndex === currentQuestions.length - 1) ? 'عرض النتيجة' : 'السؤال التالي ←';
}

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

    if (!currentQuizTitle.includes('مراجعة')) {
        saveQuizResult(currentQuizTitle, currentScore, currentQuestions.length, currentCorrectCount);
    }

    const percent = Math.round((currentCorrectCount / currentQuestions.length) * 100);
    let reviewBtn = incorrectQuestions.length ? `<button onclick="startReview()" class="card-btn btn-summary" style="background-color:var(--color-incorrect);color:white;">🔁 مراجعة الأخطاء (${incorrectQuestions.length})</button>` : '';

    resDiv.innerHTML = `
        <div class="results-chart" style="--percentage-value:${percent*3.6}deg"><span class="percentage-text">${percent}%</span></div>
        <h3>${currentQuizTitle}</h3>
        <h2 style="color:var(--primary-color)">${currentScore} نقطة</h2>
        <p>أجبت ${currentCorrectCount} من ${currentQuestions.length} بشكل صحيح.</p>
        <div class="results-actions">
            ${reviewBtn}
            <a href="index.html" class="card-btn btn-summary">القائمة الرئيسية</a>
            <button onclick="location.reload()" class="next-btn">إعادة الاختبار</button>
        </div>
    `;
}

window.startReview = function() {
    initAndStartQuiz(incorrectQuestions, `${currentQuizTitle} (مراجعة)`);
};

/* -------------------------------------------------------------------------- */
/* 9. لوحة التقدم (Dashboard)                                                */
/* -------------------------------------------------------------------------- */

async function initDashboardPage() {
    const container = $('dashboard-content');
    if (!STUDENT_ID) { container.innerHTML = '<p class="dashboard-empty-state">الرجاء تسجيل الدخول.</p>'; return; }
    
    try {
        const [stats, results] = await Promise.all([
            fetch(`${API_URL}/students/${STUDENT_ID}/stats`).then(r=>r.json()),
            fetch(`${API_URL}/students/${STUDENT_ID}/results`).then(r=>r.json())
        ]);

        if (stats.error) throw new Error();

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
                html += `<li class="history-item"><span class="score">${r.score} نقطة</span><span class="score-details">(${r.correctAnswers}/${r.totalQuestions})</span><span class="history-date">${new Date(r.completedAt).toLocaleDateString('ar-EG')}</span></li>`;
            });
            html += '</ul></div>';
        }
        container.innerHTML = results.length ? html : '<p class="dashboard-empty-state">لا توجد اختبارات.</p>';
    } catch (e) { container.innerHTML = '<p class="dashboard-empty-state">فشل التحميل.</p>'; }
}

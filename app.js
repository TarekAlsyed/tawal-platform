/*
 * =================================================================================
 * APP.JS - Tawal Academy Client Logic
 * Version: 11.4.0 (Final Production Build)
 * =================================================================================
 * * هذا الملف يحتوي على منطق الواجهة الأمامية بالكامل.
 * * تم دمج جميع الميزات: التسجيل الذكي، الحظر، البصمة، الامتحانات، والملخصات.
 * =================================================================================
 */

/* -------------------------------------------------------------------------- */
/* 1. إعدادات الاتصال والمتغيرات العامة                                      */
/* -------------------------------------------------------------------------- */

// رابط الخادم (Backend)
const API_URL = 'https://tawal-backend-production.up.railway.app/api';

// مفاتيح التخزين (v4 لإجبار التحديث)
const STORAGE_KEY_ID = 'tawal_studentId_v4'; 
const STORAGE_KEY_NAME = 'tawal_studentName_v4';

// متغيرات الجلسة
let STUDENT_ID = localStorage.getItem(STORAGE_KEY_ID);
let FINGERPRINT_ID = null;

// إعدادات أخرى
const PROGRESS_KEY = 'tawalAcademyProgress_v1';
const DEFAULT_SUBJECT = 'gis_networks';

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
        title: "نصوص جغرافية فى المساحة والحرائط",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 16 4-4-4-4"></path><path d="m8 16 4-4-4-4"></path><path d="M2 12h20"></path></svg>'
    },
    arid_lands: {
        title: "جغرافيا الاراضي الجافة",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.1 12.4C17.1 12.4 17 14 17 15s.9 3 2.1 3.6c1.2.6 2.4.6 3.1.3 1-.4 1.9-1.3 2-2.5.1-1.1-.5-2.1-1.2-2.8-.7-.7-1.7-1-2.5-1.1-1.2-.1-2.2.4-2.8 1-.6.6-1.1 1.4-1.1 2.2z"></path><path d="M5.1 12.4C5.1 12.4 5 14 5 15s.9 3 2.1 3.6c1.2.6 2.4.6 3.1.3 1-.4 1.9-1.3 2-2.5.1-1.1-.5-2.1-1.2-2.8-.7-.7-1.7-1-2.5-1.1-1.2-.1-2.2.4-2.8 1-.6.6-1.1 1.4-1.1 2.2z"></path><path d="M11.1 12.4C11.1 12.4 11 14 11 15s.9 3 2.1 3.6c1.2.6 2.4.6 3.1.3 1-.4 1.9-1.3 2-2.5.1-1.1-.5-2.1-1.2-2.8-.7-.7-1.7-1-2.5-1.1-1.2-.1-2.2.4-2.8 1-.6.6-1.1 1.4-1.1 2.2z"></path><path d="M12 2v2"></path><path d="m4.9 4.9 1.4 1.4"></path><path d="M2 12h2"></path><path d="m4.9 19.1 1.4-1.4"></path><path d="M12 22v-2"></path><path d="m19.1 19.1-1.4-1.4"></path><path d="M22 12h-2"></path><path d="m19.1 4.9-1.4 1.4"></path></svg>'
    }
};

/* -------------------------------------------------------------------------- */
/* 2. دوال المساعدة والتحقق                                                */
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

// التحقق من صحة الاسم (3 حروف فأكثر)
function isValidName(name) {
    const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]{3,50}$/;
    return nameRegex.test(name.trim());
}

// التحقق من الإيميل
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

// التحقق من وجود الملفات
async function fileExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (e) {
        console.warn(`File check failed for ${url}`);
        return false;
    }
}

// إخفاء المحتوى عند الحظر
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
/* 3. دوال الاتصال بالخادم (API Calls)                                      */
/* -------------------------------------------------------------------------- */

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

function saveQuizResult(quizName, score, totalQuestions, correctAnswers) {
    if (!STUDENT_ID) return;
    fetch(`${API_URL}/quiz-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            studentId: STUDENT_ID,
            quizName: quizName,
            score: score,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers
        })
    })
    .then(res => res.json())
    .then(data => console.log('✓ تم حفظ النتيجة'))
    .catch(err => console.error('خطأ حفظ النتيجة:', err));
}

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
        .then(res => resolve({ quizData: res[0], summaryData: res[1] }))
        .catch(reject);
    });
}

/* -------------------------------------------------------------------------- */
/* 4. نظام المصادقة (Auth)                                                  */
/* -------------------------------------------------------------------------- */

async function getFingerprint() {
    try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return result.visitorId;
    } catch (err) {
        console.error('فشل جلب البصمة:', err);
        return null;
    }
}

// (*** التسجيل الذكي: لا تكرار ***)
async function registerStudent(fingerprint) {
    let name = prompt('أهلاً بك في منصة Tawal Academy!\n\nالرجاء كتابة اسمك:');
    while (!name || !isValidName(name)) {
        if (name === null) return false; 
        name = prompt('الرجاء كتابة اسمك (حروف فقط):');
    }

    let email = prompt('الرجاء كتابة البريد الإلكتروني:');
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

        if (response.status === 403) {
            hideContent('الجهاز محظور', data.error);
            return false;
        }

        // في حال النجاح (أو الحساب موجود والخادم أعاد بياناته)
        if (data.id) {
            STUDENT_ID = data.id;
            localStorage.setItem(STORAGE_KEY_ID, data.id);
            localStorage.setItem(STORAGE_KEY_NAME, data.name);
            
            if (data.message && data.message.includes('موجود')) {
                alert(`أهلاً بعودتك يا ${data.name}!`);
            } else {
                alert(`أهلاً بك يا ${data.name}! تم تسجيلك بنجاح.`);
            }
            return true;
        } 
        
        // في حال فشل الخادم في إرجاع البيانات للحساب المكرر
        else if (data.error && data.error.includes('البريد الإلكتروني مسجل بالفعل')) {
            alert('⚠️ هذا البريد مسجل بالفعل، لكن الخادم لم يستطع استرجاع بياناتك.\nحاول مرة أخرى لاحقاً.');
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

async function verifyStudent(localId) {
    if (!localId) return { status: 'new_user' };
    try {
        const response = await fetch(`${API_URL}/students/${localId}`);
        if (response.ok) {
            const student = await response.json();
            if (student.isblocked) return { status: 'account_blocked' };
            STUDENT_ID = localId;
            return { status: 'valid' };
        } else {
            return { status: 'id_mismatch' };
        }
    } catch (err) {
        return { status: 'network_error', error: err };
    }
}

async function loginWithFingerprint(studentId, fingerprint) {
    if (!studentId || !fingerprint) return { status: 'error' };
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, fingerprint })
        });
        const data = await response.json();
        if (response.status === 403) return { status: 'fingerprint_blocked', message: data.error };
        if (response.ok) return { status: 'success', logId: data.logId };
        return { status: 'error', message: data.error };
    } catch (e) { return { status: 'error' }; }
}

function checkAccessPermission() {
    const ans = prompt("هل صليت على النبي اليوم؟\n\nمفتاح الدخول: صلى الله عليه وسلم", "");
    if (!ans) return false;
    const norm = ans.replace(/[\u064B-\u0652]/g, '').replace(/ـ/g, '').replace(/[ى]/g, 'ي').replace(/صلِ/g, 'صل').trim();
    return ["صلي", "الله", "عليه", "وسلم", "صل"].some(k => norm.includes(k));
}

/* -------------------------------------------------------------------------- */
/* 5. نقطة الانطلاق الرئيسية (Main Execution)                                */
/* -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', async () => {
    initThemeToggle();
    
    // 1. جلب البصمة
    FINGERPRINT_ID = await getFingerprint();

    // 2. التحقق من المستخدم (Storage v4)
    const localId = localStorage.getItem(STORAGE_KEY_ID);
    const verification = await verifyStudent(localId);

    if (verification.status === 'account_blocked') {
        hideContent('الحساب محظور', 'تم إيقاف هذا الحساب. الرجاء التواصل مع الإدارة.');
        return;
    }
    
    // 3. التسجيل (إذا كان جديداً أو التخزين قديم)
    if (verification.status === 'id_mismatch' || verification.status === 'new_user') {
        localStorage.removeItem(STORAGE_KEY_ID);
        localStorage.removeItem(STORAGE_KEY_NAME);
        
        const isRegistered = await registerStudent(FINGERPRINT_ID);
        if (!isRegistered) return; 
    }

    // 4. سؤال الأمان (فقط في الرئيسية)
    const subjectsGrid = $('subjects-grid'); 
    if (subjectsGrid) {
        if (!checkAccessPermission()) {
            hideContent('الوصول مرفوض', 'الإجابة غير صحيحة.');
            return; 
        }
    }
    
    // 5. تسجيل الدخول في الخلفية
    const loginResult = await loginWithFingerprint(STUDENT_ID, FINGERPRINT_ID);
    if (loginResult.status === 'fingerprint_blocked') {
        hideContent('الجهاز محظور', loginResult.message);
        return;
    }

    // 6. تحميل المحتوى
    const subjectKey = getSubjectKey();
    const quizBody = $('quiz-body');
    const summaryFilesContent = $('summary-content-files'); 
    const dashboardContent = $('dashboard-content'); 

    try {
        if (subjectsGrid) {
            initIndexPage();
        } else if (quizBody) {
            await initQuizPage(subjectKey);
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
/* 6. إدارة الصفحات (Page Controllers)                                       */
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
    for (const card of allCards) { await loadAndEnableCard(card.dataset.subjectKey, card); }

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
        if (data && data.quizData && data.quizData.questions && data.quizData.questions.length > 0) {
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

// --- الملخص ---
async function initSummaryPage(subjectKey) {
    const titleEl = $('summary-title');
    const tabsContainer = document.querySelector('.summary-tabs');
    const filesContentEl = $('summary-content-files');
    const imagesContentEl = $('summary-content-images');

    if (!subjectKey) { titleEl.innerText = 'خطأ'; return; }
    
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
        
        let foundFilesCount = 0;
        let foundImagesCount = 0;

        if (hasFiles || hasImages) {
            tabsContainer.style.display = 'flex';
            
            if (hasFiles) {
                let filesHtml = '<ul class="file-download-list">';
                const checks = data.summaryData.files.map(async f => {
                    if(await fileExists(f.path)) {
                        foundFilesCount++; 
                        let icon = f.type==='pdf'?'📕':f.type==='doc'?'📘':'📄';
                        return `<li class="file-download-item"><a href="${f.path}" target="_blank" class="file-download-link"><span class="file-download-icon">${icon}</span><span class="file-download-name">${f.name}</span></a></li>`;
                    } return '';
                });
                const res = await Promise.all(checks);
                filesContentEl.innerHTML = res.join('') || '<p class="placeholder">لا توجد ملفات.</p>';
            } else { filesContentEl.innerHTML = '<p class="placeholder">لا توجد ملفات.</p>'; }
            
            if (hasImages) {
                let imgHtml = '<div class="gallery-grid">';
                const checks = data.summaryData.images.map(async i => {
                    if(await fileExists(i.path)) {
                        foundImagesCount++;
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
            fTab.addEventListener('click', () => { filesContentEl.style.display='block'; imagesContentEl.style.display='none'; fTab.classList.add('active'); iTab.classList.remove('active'); logActivity('Viewed Summary Files', subjectTitle); });
            iTab.addEventListener('click', () => { filesContentEl.style.display='none'; imagesContentEl.style.display='block'; fTab.classList.remove('active'); iTab.classList.add('active'); logActivity('Viewed Image Gallery', subjectTitle); });
            
            const modal = $('lightbox-modal');
            if(modal) {
                const mImg = $('lightbox-img');
                const closeModal = $('lightbox-close');
                closeModal.onclick = () => modal.classList.remove('show');
                modal.onclick = (e) => { if(e.target===modal) modal.classList.remove('show'); };
                setTimeout(() => {
                    document.querySelectorAll('.gallery-item img').forEach(img => img.onclick = () => { modal.classList.add('show'); mImg.src = img.src; });
                    filesContentEl.querySelectorAll('img').forEach(img => img.onclick = () => { modal.classList.add('show'); mImg.src = img.src; });
                }, 500);
            }
            if (foundFilesCount > 0) fTab.click(); 
            else if (foundImagesCount > 0) iTab.click();
            else fTab.click();

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
    } catch (e) { console.error(e); titleEl.innerText = 'خطأ في التحميل'; }
}

// --- لوحة التقدم ---
async function initDashboardPage() {
    const container = $('dashboard-content');
    if (!container || !STUDENT_ID) return;
    container.innerHTML = '<p class="dashboard-empty-state">جاري التحميل...</p>';

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

// --- الاختبار ---
async function initQuizPage(subjectKey) {
    if(!subjectKey) return;
    try {
        const data = await loadSubjectData(subjectKey);
        if (data.quizData?.questions?.length > 0) {
            logActivity('Started Quiz', data.quizData.title);
            runQuizEngine(data.quizData, subjectKey);
        } else {
            $('quiz-title').innerText = SUBJECTS[subjectKey]?.title || 'خطأ';
            $('question-text').innerText = 'لا توجد أسئلة.';
            $('quiz-footer').style.display = 'none';
        }
    } catch (e) { console.error(e); }
}

/* -------------------------------------------------------------------------- */
/* 7. محرك الاختبارات (Quiz Engine)                                          */
/* -------------------------------------------------------------------------- */
function runQuizEngine(quizObj, subjectKey) {
    const questions = quizObj.questions;
    let currentIdx = 0, score = 0, correct = 0, incorrectList = [];
    let questionStartTime = 0;

    const qTitle = $('quiz-title'), qText = $('question-text'), feedback = $('feedback');
    const tfDiv = $('tf-options-container'), mcDiv = $('mc-options-container');
    const nextBtn = $('next-btn'), resDiv = $('results-container'), bodyDiv = $('quiz-body');

    qTitle.innerText = quizObj.title || 'اختبار';
    let shuffled = [...questions].sort(() => Math.random() - 0.5);

    function startQuiz(questionsToUse = questions) {
        const isReviewMode = questionsToUse !== questions;
        if (isReviewMode) {
            questionsShuffled = [...questionsToUse]; 
            qTitle.innerText = `${quizObj.title} (مراجعة الأخطاء)`;
        } else {
            questionsShuffled = [...questionsToUse].sort(() => Math.random() - 0.5);
            qTitle.innerText = quizObj.title;
            incorrectList = []; 
        }
        currentIdx = 0; score = 0; correct = 0;
        bodyDiv.style.display = 'block';
        $('quiz-footer').style.display = 'block';
        resDiv.style.display = 'none';
        nextBtn.innerText = 'السؤال التالي ←';
        nextBtn.disabled = true;
        loadQuestion();
    }

    function loadQuestion() {
        const q = shuffled[currentIdx];
        qText.innerText = q.question;
        $('question-counter').innerText = `السؤال ${currentIdx+1} / ${shuffled.length}`;
        $('progress-bar').style.width = `${((currentIdx+1)/shuffled.length)*100}%`;
        feedback.innerText = '';
        feedback.className = 'feedback';
        nextBtn.disabled = true;
        questionStartTime = Date.now();
        
        const resetBtns = (div) => {
            div.style.display = 'flex';
            div.querySelectorAll('.option-btn').forEach(b => {
                b.disabled = false; b.classList.remove('correct', 'incorrect'); b.onclick = null;
            });
        };

        if (q.type === 'tf') {
            mcDiv.style.display = 'none'; resetBtns(tfDiv);
            tfDiv.querySelectorAll('.option-btn').forEach(b => {
                b.onclick = () => checkAnswer(b, String(b.dataset.answer) === String(q.answer));
            });
        } else {
            tfDiv.style.display = 'none'; resetBtns(mcDiv);
            const opts = mcDiv.querySelectorAll('.option-btn');
            opts.forEach((b, i) => {
                if(q.options[i]) {
                    b.style.display='flex'; b.querySelector('.option-text').innerText=q.options[i];
                    b.onclick = () => checkAnswer(b, i === q.answer);
                } else b.style.display='none';
            });
        }
    }

    function checkAnswer(btn, isCorrect) {
        document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
        const timeTaken = (Date.now() - questionStartTime) / 1000;
        
        if (isCorrect) {
            correct++;
            let basePoints = 20;
            if(shuffled[currentIdx].difficulty === 'hard') basePoints = 30;
            else if(shuffled[currentIdx].difficulty === 'easy') basePoints = 10;
            
            let bonus = (timeTaken < 5) ? 10 : (timeTaken < 10 ? 5 : 0);
            score += (basePoints + bonus);
            
            btn.classList.add('correct'); 
            feedback.innerText = `إجابة صحيحة! +${basePoints+bonus} نقطة`; 
            feedback.classList.add('correct');
        } else {
            btn.classList.add('incorrect'); 
            feedback.innerText = 'إجابة خاطئة.'; 
            feedback.classList.add('incorrect');
            incorrectList.push(shuffled[currentIdx]);
            
            const q = shuffled[currentIdx];
            if(q.type==='tf') tfDiv.querySelector(`[data-answer="${q.answer}"]`).classList.add('correct');
            else mcDiv.querySelectorAll('.option-btn')[q.answer].classList.add('correct');
        }
        nextBtn.disabled = false;
        nextBtn.innerText = (currentIdx === shuffled.length - 1) ? 'عرض النتيجة' : 'السؤال التالي ←';
        nextBtn.onclick = () => {
            if(currentIdx < shuffled.length - 1) { currentIdx++; loadQ(); } else showRes();
        };
    }

    function showRes() {
        bodyDiv.style.display = 'none';
        $('quiz-footer').style.display = 'none';
        resDiv.style.display = 'flex';
        
        const isReview = shuffled.length !== questions.length;
        if (!isReview) saveQuizResult(quizObj.title, score, shuffled.length, correct);

        const percent = Math.round((correct / shuffled.length) * 100);
        let reviewBtnHtml = incorrectList.length > 0 ? `<button id="review-btn" class="card-btn btn-summary" style="background-color: var(--color-incorrect); color: white;">🔁 مراجعة الأخطاء (${incorrectList.length})</button>` : '';

        resDiv.innerHTML = `
            <div class="results-chart" style="--percentage-value: ${percent*3.6}deg;"><span class="percentage-text">${percent}%</span></div>
            <h3>النتيجة النهائية</h3>
            <h2 style="color:var(--primary-color)">${score} نقطة</h2>
            <p>أجبت ${correct} من ${shuffled.length} بشكل صحيح.</p>
            <div class="results-actions" style="flex-wrap: wrap; justify-content: center; gap: 10px;">
                ${reviewBtnHtml}
                <a href="index.html" class="card-btn btn-summary back-home">الرئيسية</a>
                <button onclick="location.reload()" class="next-btn">إعادة الاختبار</button>
            </div>
        `;
        
        if(incorrectList.length > 0) {
            $('review-btn').onclick = () => {
                shuffled = [...incorrectList];
                currentIdx = 0; score = 0; correct = 0; incorrectList = [];
                resDiv.style.display = 'none'; bodyDiv.style.display = 'block'; $('quiz-footer').style.display = 'block';
                loadQ();
            };
        }
        $('retry-btn').onclick = () => { window.location.reload(); };
    }

    startQuiz(questions);
}

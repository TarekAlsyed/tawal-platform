/*
 * =================================================================================
 * APP.JS - Tawal Academy Client Logic
 * Version: 11.4.0 (Final Production Build)
 * =================================================================================
 * * This file contains the entire frontend logic.
 * * All features merged: Smart Registration, Blocking, Fingerprinting, Quizzes, and Summaries.
 * =================================================================================
 */

/* -------------------------------------------------------------------------- */
/* 1. Connection Settings and Global Variables                                */
/* -------------------------------------------------------------------------- */

// Server URL (Backend)
const API_URL = 'https://tawal-backend-production.up.railway.app/api';

// Storage Keys (v4 to force update)
const STORAGE_KEY_ID = 'tawal_studentId_v4'; 
const STORAGE_KEY_NAME = 'tawal_studentName_v4';

// Session Variables
let STUDENT_ID = localStorage.getItem(STORAGE_KEY_ID);
let FINGERPRINT_ID = null;

// Other Settings
const PROGRESS_KEY = 'tawalAcademyProgress_v1';
const DEFAULT_SUBJECT = 'gis_networks';

// Academy Logo
const LOGO_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M40 8H8c-2.21 0-4 1.79-4 4v24c0 2.21 1.79 4 4 4h32c2.21 0 4-1.79 4-4V12c0-2.21-1.79-4-4-4z" fill="currentColor"/>
        <path d="M18 20l6 12 6-12" stroke="white" stroke-width="2"/>
        <line x1="16" y1="20" x2="32" y2="20" stroke="white" stroke-width="2"/>
    </svg>
`;

/* -------------------------------------------------------------------------- */
/* 2. Subject List                                                            */
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
/* 3. Helper and Validation Functions                                         */
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

// Name Validation (3+ chars)
function isValidName(name) {
    const nameRegex = /^[\u0600-\u06FFa-zA-Z\s]{3,50}$/;
    return nameRegex.test(name.trim());
}

// Email Validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

// File Existence Check
async function fileExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (e) {
        console.warn(`File check failed for ${url}`);
        return false;
    }
}

// Hide Content on Block
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
/* 4. Server API Calls                                                        */
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
    .then(data => {
        if (data.id) console.log('✓ تم حفظ النتيجة في قاعدة البيانات:', data.message);
        else console.error('فشل حفظ النتيجة في قاعدة البيانات:', data.error);
    })
    .catch(err => console.error('خطأ فادح في الاتصال لحفظ النتيجة:', err));
}

function loadSubjectData(subjectKey) {
    return new Promise((resolve, reject) => {
        if (!subjectKey || !SUBJECTS[subjectKey]) {
            reject(new Error('Invalid subject key'));
            return;
        }

        const quizUrl = `data_${subjectKey}/data_${subjectKey}_quiz.json?v=${Date.now()}`;
        const summaryUrl = `data_${subjectKey}/data_${subjectKey}_summary.json?v=${Date.now()}`;

        const fetchQuiz = fetch(quizUrl)
            .then(response => response.ok ? response.json() : {})
            .catch(error => {
                console.warn(`Could not load quiz file for ${subjectKey}:`, error.message);
                return {};
            });

        const fetchSummary = fetch(summaryUrl)
            .then(response => response.ok ? response.json() : {})
            .catch(error => {
                console.warn(`Could not load summary file for ${subjectKey}:`, error.message);
                return {};
            });

        Promise.all([fetchQuiz, fetchSummary])
            .then(results => {
                const quizData = results[0];
                const summaryData = results[1];
                const combinedData = { quizData: quizData, summaryData: summaryData };
                resolve(combinedData);
            })
            .catch(error => {
                console.error(`Unexpected error loading data for ${subjectKey}:`, error);
                reject(error);
            });
    });
}

/* -------------------------------------------------------------------------- */
/* 5. Authentication System (Register, Login, Security)                       */
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

// (Smart Registration)
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

        if (data.id) {
            STUDENT_ID = data.id;
            localStorage.setItem(STORAGE_KEY_ID, data.id);
            localStorage.setItem(STORAGE_KEY_NAME, data.name);
            
            if (data.message && data.message.includes('موجود')) {
                alert(`أهلاً بعودتك يا ${data.name}! (تم استرجاع حسابك)`);
            } else {
                alert(`أهلاً بك يا ${data.name}! تم التسجيل بنجاح.`);
            }
            return true;
        } 
        
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
/* 6. Main Execution                                                          */
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
        localStorage.removeItem(STORAGE_KEY_NAME);
        
        const isRegistered = await registerStudent(FINGERPRINT_ID);
        if (!isRegistered) return; 
    }

    const subjectsGrid = $('subjects-grid'); 
    if (subjectsGrid) {
        if (!checkAccessPermission()) {
            hideContent('الوصول مرفوض', 'الإجابة غير صحيحة.');
            return; 
        }
    }
    
    const loginResult = await loginWithFingerprint(STUDENT_ID, FINGERPRINT_ID);
    if (loginResult.status === 'fingerprint_blocked') {
        hideContent('الجهاز محظور', loginResult.message);
        return;
    }

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
/* 7. Page Logic                                                              */
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
                const modalImg = $('lightbox-img');
                const closeModal = $('lightbox-close');
                closeModal.onclick = () => modal.classList.remove('show');
                modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };
                setTimeout(() => {
                    document.querySelectorAll('.gallery-item img').forEach(img => img.onclick = () => { modal.classList.add('show'); modalImg.src = img.src; });
                    filesContentEl.querySelectorAll('img').forEach(img => img.onclick = () => { modal.classList.add('show'); modalImg.src = img.src; });
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
    } catch (e) {
        console.error('Failed to load summary', e);
        titleEl.innerText = 'خطأ في التحميل';
    }
}

async function initDashboardPage() {
    const container = $('dashboard-content');
    if (!container) return;

    if (!STUDENT_ID) {
        container.innerHTML = '<p class="dashboard-empty-state">الرجاء تسجيل الدخول أولاً.</p>';
        return;
    }
    
    container.innerHTML = '<p class="dashboard-empty-state">جاري تحميل إحصائياتك...</p>';

    try {
        const statsResponse = await fetch(`${API_URL}/students/${STUDENT_ID}/stats`);
        const stats = await statsResponse.json();

        const resultsResponse = await fetch(`${API_URL}/students/${STUDENT_ID}/results`);
        const results = await resultsResponse.json();

        if (stats.error || results.error) {
            throw new Error('فشل جلب البيانات');
        }

        if (stats.totalQuizzes === 0) {
            container.innerHTML = '<p class="dashboard-empty-state">لم تقم بإجراء أي اختبارات بعد.</p>';
            return;
        }

        const summaryHtml = `
            <div class="dashboard-summary-grid">
                <div class="summary-box">
                    <p class="summary-box-label">إجمالي الاختبارات</p>
                    <p class="summary-box-value">${stats.totalQuizzes}</p>
                </div>
                <div class="summary-box">
                    <p class="summary-box-label">متوسط النقاط</p>
                    <p class="summary-box-value ${stats.averageScore >= 50 ? 'correct' : 'incorrect'}">${stats.averageScore}</p>
                </div>
                <div class="summary-box">
                    <p class="summary-box-label">أفضل نتيجة</p>
                    <p class="summary-box-value level-excellent">${stats.bestScore}</p>
                </div>
            </div>
            <div class="results-divider"></div>
        `;

        const resultsByQuiz = {};
        results.forEach(att => {
            if (!resultsByQuiz[att.quizName]) {
                resultsByQuiz[att.quizName] = [];
            }
            resultsByQuiz[att.quizName].push(att);
        });

        let subjectCardsHtml = '';
        for (const quizName in resultsByQuiz) {
            let historyListHtml = '<ul class="history-list">';
            resultsByQuiz[quizName].forEach(att => {
                let scoreClass = 'level-fail';
                if (att.score >= 300) scoreClass = 'level-excellent';
                else if (att.score >= 150) scoreClass = 'level-good';
                else if (att.score >= 50) scoreClass = 'level-pass';

                historyListHtml += `
                    <li class="history-item">
                        <span class="score ${scoreClass}">📈 ${att.score} نقطة</span>
                        <span class="score-details">( ${att.correctAnswers} / ${att.totalQuestions} )</span>
                        <span class="history-date">${new Date(att.completedAt).toLocaleDateString('ar-EG')}</span>
                    </li>
                `;
            });
            historyListHtml += '</ul>';

            subjectCardsHtml += `
                <div class="subject-history-card">
                    <h3>${quizName}</h3>
                    ${historyListHtml}
                </div>
            `;
        }

        container.innerHTML = summaryHtml + subjectCardsHtml;

    } catch (err) {
        console.error('فشل تحميل لوحة التقدم:', err);
        container.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل الإحصائيات.</p>';
    }
}

async function initQuizPage(subjectKey) {
    const titleEl = $('quiz-title');
    const questionTextEl = $('question-text');
    const quizFooter = $('quiz-footer');

    if (!subjectKey) {
        titleEl.innerText = 'خطأ';
        return;
    }

    try {
        const data = await loadSubjectData(subjectKey); 
        let quizObj = undefined;

        if (data && data.quizData && data.quizData.questions) {
             quizObj = data.quizData;
        }

        if (!quizObj || !Array.isArray(quizObj.questions) || quizObj.questions.length === 0) {
            titleEl.innerText = (SUBJECTS[subjectKey] ? SUBJECTS[subjectKey].title : 'خطأ');
            questionTextEl.innerText = 'هذا الاختبار غير متاح حالياً.';
            quizFooter.style.display = 'none';
            return;
        }
        
        logActivity('Started Quiz', quizObj.title || SUBJECTS[subjectKey].title);
        runQuizEngine(quizObj, subjectKey);

    } catch (e) {
        console.error('Failed to init quiz page', e);
        titleEl.innerText = 'خطأ';
    }
}

/* -------------------------------------------------------------------------- */
/* 8. Quiz Engine                                                            */
/* -------------------------------------------------------------------------- */
function runQuizEngine(quizObj, subjectKey) {
    const questions = quizObj.questions;
    let currentIdx = 0;
    let totalScore = 0; 
    let correctCount = 0; 
    let incorrectList = []; 
    let questionStartTime = 0;

    const quizTitleEl = $('quiz-title');
    const questionTextEl = $('question-text');
    const tfContainer = $('tf-options-container');
    const mcContainer = $('mc-options-container');
    const progressBar = $('progress-bar');
    const questionCounter = $('question-counter');
    const feedbackEl = $('feedback');
    const resultsContainer = $('results-container');
    const quizBody = $('quiz-body');
    const quizFooter = $('quiz-footer');
    const nextBtn = $('next-btn');

    quizTitleEl.innerText = quizObj.title || 'اختبار';
    let questionsShuffled = [...questions].sort(() => Math.random() - 0.5);

    function startQuiz(questionsToUse = questions) {
        const isReviewMode = questionsToUse !== questions;
        if (isReviewMode) {
            questionsShuffled = [...questionsToUse]; 
            quizTitleEl.innerText = `${quizObj.title} (مراجعة الأخطاء)`;
        } else {
            questionsShuffled = [...questionsToUse].sort(() => Math.random() - 0.5);
            quizTitleEl.innerText = quizObj.title;
            incorrectList = []; 
        }
        
        currentIdx = 0;
        totalScore = 0;
        correctCount = 0;
        
        quizBody.style.display = 'block';
        quizFooter.style.display = 'block';
        resultsContainer.style.display = 'none';
        nextBtn.innerText = 'السؤال التالي ←';
        nextBtn.disabled = true;
        loadQuestion();
    }

    function loadQuestion() {
        const currentQuestion = questionsShuffled[currentIdx];
        questionTextEl.innerText = currentQuestion.question || '';
        questionCounter.innerText = `السؤال ${currentIdx + 1} / ${questionsShuffled.length}`;
        progressBar.style.width = `${((currentIdx + 1) / questionsShuffled.length) * 100}%`;
        feedbackEl.innerText = '';
        feedbackEl.className = 'feedback';
        nextBtn.disabled = true;
        questionStartTime = Date.now();
        
        const resetBtns = (container) => {
            container.style.display = 'flex';
            container.querySelectorAll('.option-btn').forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('correct', 'incorrect');
                btn.onclick = null;
            });
        };

        if (currentQuestion.type === 'tf') {
            mcContainer.style.display = 'none';
            resetBtns(tfContainer);
            tfContainer.querySelectorAll('.option-btn').forEach(btn => {
                btn.onclick = () => {
                    const val = String(btn.dataset.answer).toLowerCase() === 'true';
                    const correct = String(currentQuestion.answer).toLowerCase() === 'true';
                    finalizeAnswer(btn, val === correct);
                };
            });
        } else if (currentQuestion.type === 'mc') {
            tfContainer.style.display = 'none';
            resetBtns(mcContainer);
            const mcBtns = mcContainer.querySelectorAll('.option-btn');
            mcBtns.forEach((btn, i) => {
                if (currentQuestion.options && currentQuestion.options[i]) {
                    btn.style.display = 'flex';
                    btn.querySelector('.option-text').innerText = currentQuestion.options[i];
                    btn.onclick = () => finalizeAnswer(btn, i === currentQuestion.answer);
                } else {
                    btn.style.display = 'none';
                }
            });
        }
    }

    function finalizeAnswer(buttonClicked, isCorrect) {
        document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
        const timeTaken = (Date.now() - questionStartTime) / 1000;
        
        if (isCorrect) {
            correctCount++;
            let basePoints = 20;
            if (questionsShuffled[currentIdx].difficulty === 'easy') basePoints = 10;
            if (questionsShuffled[currentIdx].difficulty === 'hard') basePoints = 30;

            let timeBonus = 0;
            if (questionsShuffled.length === questions.length) { 
                if (timeTakenInSeconds < 5) timeBonus = 10; 
                else if (timeTakenInSeconds < 10) timeBonus = 5;
            }

            totalScore += (basePoints + timeBonus); 
            buttonClicked.classList.add('correct');
            feedbackEl.innerText = `إجابة صحيحة! +${basePoints + timeBonus} نقطة`;
            feedbackEl.classList.add('correct');

        } else {
            buttonClicked.classList.add('incorrect');
            feedbackEl.innerText = 'إجابة خاطئة.';
            feedbackEl.classList.add('incorrect');
            
            if (questionsShuffled.length === questions.length) { 
                 incorrectList.push(questionsShuffled[currentIdx]);
            }
            
            if (questionsShuffled[currentIdx].type === 'tf') {
                const want = String(questionsShuffled[currentIdx].answer).toLowerCase();
                tfContainer.querySelector(`.option-btn[data-answer="${want}"]`).classList.add('correct');
            } else {
                mcContainer.querySelectorAll('.option-btn')[questionsShuffled[currentIdx].answer].classList.add('correct');
            }
        }
        
        nextBtn.disabled = false;
        if (currentIdx === questionsShuffled.length - 1) {
            nextBtn.innerText = 'عرض النتيجة';
        }
        
        nextBtn.onclick = () => {
            if (currentIdx < questionsShuffled.length - 1) {
                currentIdx++;
                loadQuestion();
            } else {
                showResults();
            }
        };
    }

    function showResults() {
        quizBody.style.display = 'none';
        quizFooter.style.display = 'none';
        resultsContainer.style.display = 'flex';
        
        const isReviewMode = questionsShuffled.length !== questions.length;
        if (!isReviewMode) { 
            saveQuizResult(
                quizObj.title || 'اختبار', 
                totalScore, 
                totalQuestions,
                correctCount
            );
        }

        const percent = Math.round((correctCount / questionsShuffled.length) * 100);
        const chartPercent = percent > 100 ? 100 : percent;
        
        let reviewBtnHtml = incorrectList.length > 0 ? `<button id="review-btn" class="card-btn btn-summary" style="background-color: var(--color-incorrect); border-color: var(--color-incorrect); color: white;">🔁 مراجعة الأخطاء (${incorrectList.length})</button>` : '';

        resultsContainer.innerHTML = `
            <div class="results-chart" style="--percentage-value: ${chartPercent * 3.6}deg;">
               <span class="percentage-text">${chartPercent}%</span>
            </div>
            <h3 style="font-size: 1.3rem; margin-bottom: 5px;">النتيجة النهائية</h3>
            <h2 style="margin-top: 0; color: var(--primary-color);">${totalScore} نقطة</h2>
            <p class="results-explanation">أجبت ${correctCount} من ${questionsShuffled.length} بشكل صحيح.</p>
            <div class="results-actions" style="margin-top:12px; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; width: 100%;">
                ${reviewBtnHtml}
                <a href="index.html" class="card-btn btn-summary back-home">الرئيسية</a>
                <button id="retry-btn" class="next-btn">إعادة الاختبار</button>
            </div>
        `;
        
        const chart = resultsContainer.querySelector('.results-chart');
        if (chart) {
            if (chartPercent >= 90) chart.classList.add('level-excellent');
            else if (chartPercent >= 75) chart.classList.add('level-good');
            else if (chartPercent >= 50) chart.classList.add('level-pass');
            else chart.classList.add('level-fail');
        }

        if (incorrectList.length > 0) {
            $('review-btn').onclick = () => {
                startQuiz(incorrectList); 
            };
        }
        $('retry-btn').onclick = () => {
            window.location.reload();
        };
    }

    startQuiz(questions);
}

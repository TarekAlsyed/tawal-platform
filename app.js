/*
 * =================================================================================
 * APP.JS - Tawal Academy Client Logic (COMPLETE VERSION)
 * Version: 17.0.0 (Full Featured - Production Ready)
 * =================================================================================
 */

const API_URL = 'https://tawal-backend-production.up.railway.app/api';

const STORAGE_KEY_STUDENT_ID = 'tawal_student_id_v2';
const STORAGE_KEY_USER = 'tawal_user_data_v2';

let CURRENT_STUDENT_ID = localStorage.getItem(STORAGE_KEY_STUDENT_ID);
let USER_DATA = null;
let FINGERPRINT_ID = null;

const DEFAULT_SUBJECT = 'gis_networks';

const DATA_CACHE = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

const LEVEL_CONFIG = [
    { id: 1, suffix: '_quiz_1.json', titleSuffix: 'المستوى 1', name: 'المستوى الأول (مبتدئ)', requiredScore: 50 },
    { id: 2, suffix: '_quiz_2.json', titleSuffix: 'المستوى 2', name: 'المستوى الثاني (متوسط)', requiredScore: 80 },
    { id: 3, suffix: '_quiz_3.json', titleSuffix: 'المستوى 3', name: 'المستوى الثالث (متقدم)', requiredScore: 85 }
];

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4"><path d="M40 8H8c-2.21 0-4 1.79-4 4v24c0 2.21 1.79 4 4 4h32c2.21 0 4-1.79 4-4V12c0-2.21-1.79-4-4-4z" fill="currentColor"/><path d="M18 20l6 12 6-12" stroke="white" stroke-width="2"/><line x1="16" y1="20" x2="32" y2="20" stroke="white" stroke-width="2"/></svg>`;

const SUBJECTS = {
    gis_networks: {
        id: 'gis_networks',
        title: "تطبيقات نظم المعلومات الجغرافية فى الشبكات",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>'
    },
    transport: {
        id: 'transport',
        title: "جغرافية النقل والمواصلات",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 17l5 5"></path><path d="M10 17l5 5"></path></svg>'
    },
    geo_maps: {
        id: 'geo_maps',
        title: "الخرائط الجيولوجية",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path></svg>'
    },
    projections: {
        id: 'projections',
        title: "كتاب مساقط الخرائط",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path></svg>'
    },
    research: {
        id: 'research',
        title: "مقرر مناهج البحث الجغرافى",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 13.3V3a1 1 0 0 1 1-1h11l5 5v10.3"></path></svg>'
    },
    surveying_texts: {
        id: 'surveying_texts',
        title: "نصوص جغرافية فى المساحة والخرائط",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20"></path></svg>'
    },
    arid_lands: {
        id: 'arid_lands',
        title: "جغرافيا الاراضي الجافة",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v2"></path><path d="M22 12h-2"></path></svg>'
    }
};

function $(id) { return document.getElementById(id); }

function getSubjectKey() {
    try {
        const params = new URLSearchParams(window.location.search);
        const key = params.get('subject') || DEFAULT_SUBJECT;
        return SUBJECTS[key] ? key : DEFAULT_SUBJECT;
    } catch (e) { return DEFAULT_SUBJECT; }
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getCachedData(key) {
    const cached = DATA_CACHE.get(key);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
    }
    DATA_CACHE.delete(key);
    return null;
}

function setCachedData(key, data) {
    DATA_CACHE.set(key, { data, timestamp: Date.now() });
}

async function fileExists(url) {
    const cacheKey = `exists_${url}`;
    const cached = getCachedData(cacheKey);
    if (cached !== null) return cached;

    try {
        const response = await fetch(url, { method: 'HEAD' });
        const exists = response.ok;
        setCachedData(cacheKey, exists);
        return exists;
    } catch (e) {
        return false;
    }
}

function showError(title, message) {
    const quizContainer = document.querySelector('.quiz-container');
    const mainContainer = document.querySelector('.main-container');
    const htmlContent = `
        <div class="quiz-header"><h2>${title}</h2></div>
        <div class="quiz-body">
            <p class="placeholder" style="color: var(--color-incorrect);">${message}</p>
        </div>
    `;
    
    if (quizContainer) quizContainer.innerHTML = htmlContent;
    else if (mainContainer) mainContainer.innerHTML = `<header class="main-header"><h1 class="logo">${title}</h1></header><main><p class="placeholder" style="color: var(--color-incorrect); text-align: center; padding: 3rem;">${message}</p></main>`;
    else document.body.innerHTML = `<div style="text-align:center;padding:3rem;"><h1 style="color:red;">${title}</h1><p>${message}</p></div>`;
}

function showLoading(element, message = 'جاري التحميل...') {
    element.innerHTML = `
        <div style="text-align:center; padding:3rem;">
            <div class="spinner" style="border: 4px solid rgba(0,0,0,0.1); border-radius: 50%; border-top: 4px solid var(--primary-color); width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <p>${message}</p>
        </div>
    `;
}

async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok && response.status !== 403) {
            throw new Error(`HTTP ${response.status}`);
        }

        return response;
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}

function logActivity(activityType, subjectName = null) {
    if (!CURRENT_STUDENT_ID) return;
    
    apiRequest('/log-activity', {
        method: 'POST',
        body: JSON.stringify({ 
            studentId: CURRENT_STUDENT_ID,
            activityType, 
            subjectName 
        })
    }).catch(err => console.error('Log Error:', err));
}

async function saveQuizResult(quizName, score, totalQuestions, correctAnswers) {
    if (!CURRENT_STUDENT_ID) {
        console.error('❌ لا يوجد studentId محفوظ');
        return;
    }
    
    try {
        await apiRequest('/quiz-results', {
            method: 'POST',
            body: JSON.stringify({
                studentId: CURRENT_STUDENT_ID,
                quizName: quizName.trim(),
                score,
                totalQuestions,
                correctAnswers
            })
        });
        console.log('✓ Result Saved');
        
        DATA_CACHE.delete('user_results');
    } catch (err) {
        console.error('Save Error:', err);
    }
}

async function loadSubjectData(subjectKey) {
    const cacheKey = `subject_${subjectKey}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    if (!subjectKey || !SUBJECTS[subjectKey]) {
        throw new Error('المادة غير صالحة');
    }

    const timestamp = Date.now();
    const qUrl = `data_${subjectKey}/data_${subjectKey}_quiz_1.json?v=${timestamp}`;
    const sUrl = `data_${subjectKey}/data_${subjectKey}_summary.json?v=${timestamp}`;

    try {
        const [quizRes, summaryRes] = await Promise.all([
            fetch(qUrl).catch(() => null),
            fetch(sUrl).catch(() => null)
        ]);

        const data = {
            hasQuiz: quizRes && quizRes.ok,
            quizFirstLevel: quizRes && quizRes.ok ? await quizRes.json() : null,
            summaryData: summaryRes && summaryRes.ok ? await summaryRes.json() : {}
        };

        setCachedData(cacheKey, data);
        return data;
    } catch (err) {
        throw new Error('فشل تحميل بيانات المادة');
    }
}

async function getFingerprint() {
    try {
        if (!window.FingerprintJS) {
            console.warn('FingerprintJS not loaded');
            return 'fallback_' + Math.random().toString(36).substr(2, 9);
        }
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return result.visitorId;
    } catch (err) {
        console.error('Fingerprint Error:', err);
        return 'fallback_' + Math.random().toString(36).substr(2, 9);
    }
}

function showRegistrationModal() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';
        
        modal.innerHTML = `
            <div style="background:white;padding:2rem;border-radius:12px;max-width:400px;width:90%;">
                <h2 style="margin-bottom:1.5rem;color:#333;">مرحباً بك في Tawal Academy 🎓</h2>
                <form id="registration-form">
                    <div style="margin-bottom:1rem;">
                        <label style="display:block;margin-bottom:0.5rem;color:#555;">الاسم الثلاثي:</label>
                        <input type="text" id="reg-name" required style="width:100%;padding:0.75rem;border:2px solid #ddd;border-radius:8px;font-size:1rem;" placeholder="محمد أحمد علي">
                    </div>
                    <div style="margin-bottom:1.5rem;">
                        <label style="display:block;margin-bottom:0.5rem;color:#555;">البريد الإلكتروني:</label>
                        <input type="email" id="reg-email" required style="width:100%;padding:0.75rem;border:2px solid #ddd;border-radius:8px;font-size:1rem;" placeholder="example@email.com">
                    </div>
                    <div id="reg-error" style="color:red;margin-bottom:1rem;display:none;"></div>
                    <div style="display:flex;gap:1rem;">
                        <button type="submit" style="flex:1;padding:0.75rem;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:bold;">تسجيل</button>
                        <button type="button" id="reg-cancel" style="flex:1;padding:0.75rem;background:#ccc;color:#333;border:none;border-radius:8px;cursor:pointer;font-size:1rem;">إلغاء</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const form = modal.querySelector('#registration-form');
        const nameInput = modal.querySelector('#reg-name');
        const emailInput = modal.querySelector('#reg-email');
        const errorDiv = modal.querySelector('#reg-error');
        const cancelBtn = modal.querySelector('#reg-cancel');
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            
            if (name.length < 3) {
                errorDiv.textContent = 'الرجاء كتابة اسم صحيح';
                errorDiv.style.display = 'block';
                return;
            }
            
            if (!email.includes('@')) {
                errorDiv.textContent = 'الرجاء كتابة بريد إلكتروني صحيح';
                errorDiv.style.display = 'block';
                return;
            }
            
            document.body.removeChild(modal);
            resolve({ name, email });
        };
        
        cancelBtn.onclick = () => {
            document.body.removeChild(modal);
            resolve(null);
        };
        
        nameInput.focus();
    });
}

async function registerStudent(fingerprint) {
    const userData = await showRegistrationModal();
    if (!userData) return false;

    try {
        const response = await fetch(`${API_URL}/students/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: userData.name,
                email: userData.email,
                fingerprint
            })
        });

        const data = await response.json();

        if (response.status === 403) {
            showError('الجهاز محظور', data.error);
            return false;
        }

        if (data.id) {
            CURRENT_STUDENT_ID = data.id;
            USER_DATA = data;
            
            localStorage.setItem(STORAGE_KEY_STUDENT_ID, data.id);
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data));
            
            alert(`أهلاً بك يا ${data.name}! تم التسجيل بنجاح.`);
            return true;
        } else if (data.error && data.error.includes('موجود')) {
            alert('⚠️ هذا البريد مسجل بالفعل.');
            return false;
        } else {
            alert('حدث خطأ: ' + (data.error || 'غير معروف'));
            return false;
        }
    } catch (err) {
        console.error('Registration Error:', err);
        alert('فشل الاتصال بالخادم.');
        return false;
    }
}

async function verifyExistingStudent() {
    const storedId = localStorage.getItem(STORAGE_KEY_STUDENT_ID);
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    
    if (!storedId || !storedUser) {
        return false;
    }

    try {
        const response = await apiRequest(`/students/${storedId}`);
        
        if (!response || !response.ok) {
            localStorage.clear();
            return false;
        }

        const student = await response.json();
        
        if (student.isblocked) {
            showError('الحساب محظور', 'تم إيقاف هذا الحساب. الرجاء التواصل مع الإدارة.');
            return false;
        }

        CURRENT_STUDENT_ID = student.id;
        USER_DATA = student;
        
        console.log('✅ تم التحقق من الطالب:', student.name);
        return true;

    } catch (err) {
        console.error('Verification Error:', err);
        localStorage.clear();
        return false;
    }
}

async function loginWithFingerprint(fingerprint) {
    if (!CURRENT_STUDENT_ID || !fingerprint) return { status: 'error' };

    try {
        const response = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ 
                studentId: CURRENT_STUDENT_ID, 
                fingerprint 
            })
        });

        if (!response) return { status: 'error' };
        
        if (response.status === 403) {
            const data = await response.json();
            return { status: 'fingerprint_blocked', message: data.error };
        }

        return response.ok ? { status: 'success' } : { status: 'error' };
    } catch (e) {
        return { status: 'error' };
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        initThemeToggle();
        
        FINGERPRINT_ID = await getFingerprint();

        const isVerified = await verifyExistingStudent();

        if (!isVerified) {
            const isRegistered = await registerStudent(FINGERPRINT_ID);
            if (!isRegistered) return;
        }

        const loginResult = await loginWithFingerprint(FINGERPRINT_ID);
        if (loginResult.status === 'fingerprint_blocked') {
            showError('الجهاز محظور', loginResult.message);
            return;
        }

        const subjectKey = getSubjectKey();
        
        if ($('subjects-grid')) {
            await initIndexPage();
        } else if ($('quiz-body')) {
            await initQuizPage(subjectKey);
        } else if ($('summary-content-files')) {
            await initSummaryPage(subjectKey);
        } else if ($('dashboard-content')) {
            await initDashboardPage();
        }
    } catch (error) {
        console.error('Critical Error:', error);
        showError('خطأ في التطبيق', 'حدث خطأ غير متوقع. الرجاء تحديث الصفحة.');
    }
});

function initThemeToggle() {
    const btn = $('theme-toggle-btn');
    const saved = localStorage.getItem('theme') || 'dark';
    if (saved === 'light') document.body.classList.add('light-mode');
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
    
    showLoading(grid, 'جاري تحميل المواد...');
    
    const logoEl = document.querySelector('.main-header .logo');
    if (logoEl) logoEl.innerHTML = LOGO_SVG;
    
    grid.innerHTML = '';
    
    const cards = [];
    for (const key in SUBJECTS) {
        const s = SUBJECTS[key];
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.dataset.subjectKey = key;
        card.innerHTML = `
            <div class="card-icon">${s.icon || '📘'}</div>
            <h3 class="card-title">${s.title}</h3>
            <div class="card-actions">
                <a href="quiz.html?subject=${encodeURIComponent(key)}" class="card-btn btn-quiz disabled" aria-disabled="true">🧠 الاختبارات</a>
                <a href="summary.html?subject=${encodeURIComponent(key)}" class="card-btn btn-summary disabled" aria-disabled="true">📖 ملخص</a>
            </div>
        `;
        grid.appendChild(card);
        cards.push({ key, card });
    }
    
    for (const { key, card } of cards) {
        loadAndEnableCard(key, card).catch(err => {
            console.error(`Error loading ${key}:`, err);
        });
    }

    const searchBar = $('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            const term = e.target.value.trim().toLowerCase();
            let visibleCount = 0;
            
            cards.forEach(({ key, card }) => {
                const title = SUBJECTS[key].title.toLowerCase();
                const visible = title.includes(term);
                card.style.display = visible ? 'flex' : 'none';
                if (visible) visibleCount++;
            });
            
            const noResults = $('no-results-message');
            if (noResults) {
                noResults.style.display = visibleCount === 0 ? 'block' : 'none';
            }
        });
    }
}

async function loadAndEnableCard(key, cardElement) {
    try {
        const data = await loadSubjectData(key);
        
        if (data.hasQuiz) {
            const quizBtn = cardElement.querySelector('.btn-quiz');
            if (quizBtn) {
                quizBtn.classList.remove('disabled');
                quizBtn.removeAttribute('aria-disabled');
            }
        }
        
        if (data.summaryData && (data.summaryData.files?.length > 0 || data.summaryData.images?.length > 0)) {
            const summaryBtn = cardElement.querySelector('.btn-summary');
            if (summaryBtn) {
                summaryBtn.classList.remove('disabled');
                summaryBtn.removeAttribute('aria-disabled');
            }
        }
    } catch (e) {
        console.error(`Error loading card for ${key}:`, e);
    }
}

async function initSummaryPage(subjectKey) {
    const titleEl = $('summary-title');
    const filesContentEl = $('summary-content-files');
    const imagesContentEl = $('summary-content-images');
    const fTab = $('btn-summary-files');
    const iTab = $('btn-summary-images');

    if (!SUBJECTS[subjectKey]) {
        showError('خطأ', 'المادة غير موجودة');
        return;
    }
    
    showLoading(filesContentEl, 'جاري تحميل الملخص...');

    try {
        const timestamp = Date.now();
        const res = await fetch(`data_${subjectKey}/data_${subjectKey}_summary.json?v=${timestamp}`);
        
        if (!res.ok) throw new Error('No summary');
        
        const data = await res.json();
        titleEl.innerText = data.title || SUBJECTS[subjectKey].title;
        
        if (data.files?.length) {
            const fileChecks = await Promise.all(
                data.files.map(async (f) => ({
                    ...f,
                    exists: await fileExists(f.path)
                }))
            );
            
            const existingFiles = fileChecks.filter(f => f.exists);
            
            if (existingFiles.length) {
                let filesHtml = '<ul class="file-download-list">';
                existingFiles.forEach(f => {
                    const icon = f.type === 'pdf' ? '📕' : f.type === 'doc' ? '📘' : '📄';
                    filesHtml += `
                        <li class="file-download-item">
                            <a href="${f.path}" target="_blank" class="file-download-link">
                                <span class="file-download-icon">${icon}</span>
                                <span class="file-download-name">${f.name}</span>
                            </a>
                        </li>
                    `;
                });
                filesContentEl.innerHTML = filesHtml + '</ul>';
            } else {
                filesContentEl.innerHTML = '<p class="placeholder">لا توجد ملفات متاحة حالياً.</p>';
            }
        } else {
            filesContentEl.innerHTML = '<p class="placeholder">لا توجد ملفات.</p>';
        }

        if (data.images?.length) {
            const imageChecks = await Promise.all(
                data.images.map(async (img) => ({
                    ...img,
                    exists: await fileExists(img.path)
                }))
            );
            
            const existingImages = imageChecks.filter(img => img.exists);
            
            if (existingImages.length) {
                let imgHtml = '<div class="gallery-grid">';
                existingImages.forEach(img => {
                    imgHtml += `
                        <div class="gallery-item">
                            <img src="${img.path}" alt="${img.caption || 'صورة'}" loading="lazy">
                            ${img.caption ? `<p>${img.caption}</p>` : ''}
                        </div>
                    `;
                });
                imagesContentEl.innerHTML = imgHtml + '</div>';
                setupLightbox();
            } else {
                imagesContentEl.innerHTML = '<p class="placeholder">لا توجد صور متاحة حالياً.</p>';
            }
        } else {
            imagesContentEl.innerHTML = '<p class="placeholder">لا توجد صور.</p>';
        }

        document.querySelector('.summary-tabs').style.display = 'flex';
        
        fTab.addEventListener('click', () => {
            filesContentEl.style.display = 'block';
            imagesContentEl.style.display = 'none';
            fTab.classList.add('active');
            iTab.classList.remove('active');
        });
        
        iTab.addEventListener('click', () => {
            filesContentEl.style.display = 'none';
            imagesContentEl.style.display = 'block';
            fTab.classList.remove('active');
            iTab.classList.add('active');
        });
        
        fTab.click();

        logActivity('viewed_summary', SUBJECTS[subjectKey].title);

    } catch (e) {
        console.error('Summary Error:', e);
        titleEl.innerText = 'الملخص غير متاح حالياً';
        filesContentEl.innerHTML = '<p class="placeholder">لم يتم رفع ملف الملخص لهذه المادة بعد.</p>';
    }
}

function setupLightbox() {
    const modal = $('lightbox-modal');
    const modalImg = $('lightbox-img');
    if (!modal || !modalImg) return;

    document.querySelectorAll('.gallery-item img').forEach(img => {
        img.onclick = () => {
            modal.classList.add('show');
            modalImg.src = img.src;
            modalImg.alt = img.alt;
        };
    });

    const closeBtn = $('lightbox-close');
    if (closeBtn) {
        closeBtn.onclick = () => modal.classList.remove('show');
    }

    modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('show');
    };
}

async function initQuizPage(subjectKey) {
    if (!subjectKey || !SUBJECTS[subjectKey]) {
        showError('خطأ', 'المادة غير موجودة');
        return;
    }
    
    const titleEl = $('quiz-title');
    const body = $('quiz-body');
    const footer = $('quiz-footer');
    
    titleEl.innerText = SUBJECTS[subjectKey].title;
    footer.style.display = 'none';
    
    showLoading(body, 'جاري تحميل المستويات...');

    let pastResults = [];
    try {
        if (CURRENT_STUDENT_ID) {
            const cacheKey = 'user_results';
            const cached = getCachedData(cacheKey);
            
            if (cached) {
                pastResults = cached;
            } else {
                const timestamp = Date.now();
                const res = await apiRequest(`/students/${CURRENT_STUDENT_ID}/results?t=${timestamp}`);
                if (res && res.ok) {
                    pastResults = await res.json();
                    setCachedData(cacheKey, pastResults);
                }
            }
        }
    } catch (e) {
        console.error('Results Error:', e);
    }

    let html = '<div class="levels-grid" style="display:grid; gap:1rem; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));">';
    
    const subjectId = SUBJECTS[subjectKey].id;
    
    LEVEL_CONFIG.forEach((lvl, idx) => {
        let locked = false;
        let lockReason = '';
        
        if (idx > 0) {
            const prevLvl = LEVEL_CONFIG[idx - 1];
            
            const prevAttempts = pastResults.filter(r => {
                if (!r.quizname) return false;
                
                const quizName = r.quizname.toLowerCase();
                const subjectTitle = SUBJECTS[subjectKey].title.toLowerCase();
                
                return quizName.includes(subjectTitle.substring(0, 15)) && 
                       quizName.includes(prevLvl.titleSuffix.toLowerCase());
            });
            
            const bestPrevScore = prevAttempts.length > 0 
                ? Math.max(...prevAttempts.map(r => (r.correctanswers / r.totalquestions) * 100))
                : 0;
            
            if (bestPrevScore < prevLvl.requiredScore) {
                locked = true;
                lockReason = `يجب تحقيق ${prevLvl.requiredScore}% في ${prevLvl.name}`;
            }
        }

        const myAttempts = pastResults.filter(r => {
            if (!r.quizname) return false;
            const quizName = r.quizname.toLowerCase();
            const subjectTitle = SUBJECTS[subjectKey].title.toLowerCase();
            
            return quizName.includes(subjectTitle.substring(0, 15)) && 
                   quizName.includes(lvl.titleSuffix.toLowerCase());
        });
        
        const bestScore = myAttempts.length 
            ? Math.max(...myAttempts.map(r => Math.round((r.correctanswers / r.totalquestions) * 100)))
            : 0;

        const btnClass = locked ? 'locked-btn' : 'start';
        const btnStyle = locked 
            ? 'background:#999; cursor:not-allowed; opacity:0.6;' 
            : 'background:var(--primary-color-gradient); color:white;';
        
        const btnText = locked ? `🔒 ${lockReason}` : '🚀 ابدأ الاختبار';
        const onClick = locked ? '' : `loadLevelFile('${subjectKey}', ${idx})`;
        
        let badge = '';
        if (bestScore > 0) {
            const badgeColor = bestScore >= lvl.requiredScore 
                ? 'var(--color-correct)' 
                : 'var(--color-pass)';
            badge = `
                <div style="color:${badgeColor}; margin-bottom:10px; font-weight:bold; font-size:1.1rem;">
                    ⭐ أفضل درجة: ${bestScore}%
                </div>
            `;
        }

        const statusIcon = locked ? '🔒' : bestScore >= lvl.requiredScore ? '✅' : bestScore > 0 ? '📝' : '🔓';

        html += `
            <div class="level-card subject-card" style="${locked ? 'opacity:0.7;' : ''}">
                <div class="level-icon" style="font-size:2.5rem; margin-bottom:10px;">${statusIcon}</div>
                <h3 class="level-title" style="margin-bottom:0.5rem;">${lvl.name}</h3>
                <p style="color:#666; font-size:0.9rem; margin-bottom:1rem;">
                    ${locked ? lockReason : `الحد الأدنى: ${lvl.requiredScore}%`}
                </p>
                ${badge}
                <button 
                    class="card-btn ${btnClass}" 
                    style="${btnStyle} width:100%; padding:0.875rem; font-size:1rem;" 
                    onclick="${onClick}"
                    ${locked ? 'disabled' : ''}
                >
                    ${btnText}
                </button>
            </div>
        `;
    });
    
    body.innerHTML = html + '</div>';
    
    logActivity('viewed_quizzes', SUBJECTS[subjectKey].title);
}

window.loadLevelFile = async (subjectKey, levelIndex) => {
    const config = LEVEL_CONFIG[levelIndex];
    const fileName = `data_${subjectKey}${config.suffix}`;
    const timestamp = Date.now();
    const url = `data_${subjectKey}/${fileName}?v=${timestamp}`;

    const body = $('quiz-body');
    showLoading(body, 'جاري تحميل الأسئلة...');

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('File not found');
        
        const quizData = await res.json();
        
        if (!quizData.questions || quizData.questions.length === 0) {
            throw new Error('No questions found');
        }
        
        const fullTitle = `${SUBJECTS[subjectKey].title} - ${config.titleSuffix}`;
        const subjectId = SUBJECTS[subjectKey].id;
        
        runQuizEngine(quizData.questions, fullTitle, subjectId);
        
        logActivity('started_quiz', fullTitle);
        
    } catch (e) {
        console.error('Quiz Load Error:', e);
        alert('عذراً، ملف أسئلة هذا المستوى غير متوفر حالياً.');
        initQuizPage(subjectKey);
    }
};

function runQuizEngine(questions, title, subjectId) {
    let currentIdx = 0;
    let totalScore = 0;
    let correctCount = 0;
    let incorrectList = [];
    let questionStartTime = 0;

    const titleEl = $('quiz-title');
    titleEl.innerText = title;

    const questionsShuffled = shuffleArray(questions);

    $('quiz-body').innerHTML = `
        <h3 id="question-text" style="margin-bottom:1.5rem; line-height:1.6;"></h3>
        <div id="opts" class="options-container"></div>
        <p id="feedback" class="feedback"></p>
    `;
    
    $('quiz-footer').style.display = 'block';
    const nextBtn = $('next-btn');
    nextBtn.style.display = 'block';

    function loadQuestion() {
        const q = questionsShuffled[currentIdx];
        $('question-text').innerText = q.question;
        $('question-counter').innerText = `السؤال ${currentIdx + 1} / ${questionsShuffled.length}`;
        $('progress-bar').style.width = `${((currentIdx + 1) / questionsShuffled.length) * 100}%`;
        
        const feedbackEl = $('feedback');
        feedbackEl.innerText = '';
        feedbackEl.className = 'feedback';
        
        nextBtn.disabled = true;
        nextBtn.innerText = (currentIdx === questionsShuffled.length - 1) ? 'عرض النتيجة 🎯' : 'السؤال التالي ←';
        
        questionStartTime = Date.now();
        const optsDiv = $('opts');
        optsDiv.innerHTML = '';
        optsDiv.style.display = 'flex';

        const options = q.type === 'tf' ? ['صح', 'خطأ'] : q.options;
        
        options.forEach((txt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerHTML = `
                <span class="option-text">${txt}</span>
                <span class="icon"></span>
            `;
            
            let isCorrect = false;
            if (q.type === 'tf') {
                const trueAns = String(q.answer).toLowerCase() === 'true';
                isCorrect = (i === 0) === trueAns;
            } else {
                isCorrect = (i === q.answer);
            }

            btn.onclick = () => checkAnswer(btn, isCorrect);
            optsDiv.appendChild(btn);
        });
    }

    function checkAnswer(btn, isCorrect) {
        const allBtns = document.querySelectorAll('.option-btn');
        allBtns.forEach(b => b.disabled = true);
        
        const timeTaken = (Date.now() - questionStartTime) / 1000;
        const feedbackEl = $('feedback');
        
        if (isCorrect) {
            correctCount++;
            let pts = 10;
            
            if (timeTaken < 5) pts += 5;
            else if (timeTaken < 10) pts += 3;
            
            totalScore += pts;
            btn.classList.add('correct');
            feedbackEl.innerHTML = `✅ إجابة صحيحة! <strong>(+${pts} نقطة)</strong>`;
            feedbackEl.classList.add('correct');
        } else {
            btn.classList.add('incorrect');
            feedbackEl.innerHTML = '❌ إجابة خاطئة';
            feedbackEl.classList.add('incorrect');
            
            incorrectList.push(questionsShuffled[currentIdx]);
            
            const q = questionsShuffled[currentIdx];
            const opts = Array.from(allBtns);
            
            if (q.type === 'tf') {
                const trueAns = String(q.answer).toLowerCase() === 'true';
                opts[trueAns ? 0 : 1].classList.add('correct');
            } else {
                opts[q.answer].classList.add('correct');
            }
        }
        
        nextBtn.disabled = false;
        nextBtn.focus();
    }

    nextBtn.onclick = () => {
        if (currentIdx < questionsShuffled.length - 1) {
            currentIdx++;
            loadQuestion();
        } else {
            showResults();
        }
    };

    function showResults() {
        $('quiz-body').style.display = 'none';
        $('quiz-footer').style.display = 'none';
        const resDiv = $('results-container');
        resDiv.style.display = 'flex';

        if (!title.includes('مراجعة')) {
            saveQuizResult(title, totalScore, questions.length, correctCount, subjectId);
            logActivity('completed_quiz', title);
        }

        const percent = Math.round((correctCount / questions.length) * 100);
        
        let grade = '';
        let gradeColor = '';
        if (percent >= 90) {
            grade = 'ممتاز 🏆';
            gradeColor = 'var(--color-correct)';
        } else if (percent >= 75) {
            grade = 'جيد جداً 🌟';
            gradeColor = 'var(--color-pass)';
        } else if (percent >= 50) {
            grade = 'جيد ✓';
            gradeColor = 'var(--color-pass)';
        } else {
            grade = 'يحتاج تحسين 📚';
            gradeColor = 'var(--color-incorrect)';
        }

        const reviewBtn = incorrectList.length 
            ? `<button id="rev-btn" class="card-btn" style="background:var(--color-incorrect); color:white;">🔁 مراجعة الأخطاء (${incorrectList.length})</button>` 
            : '';

        resDiv.innerHTML = `
            <div class="results-chart" style="--percentage-value:${percent * 3.6}deg">
                <span class="percentage-text">${percent}%</span>
            </div>
            <h3 style="margin:1rem 0 0.5rem;">${title}</h3>
            <h2 style="color:${gradeColor}; margin:0.5rem 0;">${grade}</h2>
            <h2 style="color:var(--primary-color); margin:1rem 0;">${totalScore} نقطة</h2>
            <p style="color:#666; margin-bottom:2rem;">
                أجبت <strong style="color:var(--color-correct);">${correctCount}</strong> من 
                <strong>${questions.length}</strong> بشكل صحيح
            </p>
            <div class="results-actions" style="display:flex; flex-direction:column; gap:0.75rem; width:100%;">
                ${reviewBtn}
                <button onclick="location.reload()" class="next-btn" style="width:100%;">🔄 إعادة الاختبار</button>
                <a href="quiz.html?subject=${getSubjectKey()}" class="card-btn" style="background:#666; text-align:center; width:100%;">← العودة للمستويات</a>
                <a href="index.html" class="card-btn btn-summary" style="text-align:center; width:100%;">🏠 القائمة الرئيسية</a>
            </div>
        `;

        if (incorrectList.length) {
            $('rev-btn').onclick = () => {
                resDiv.style.display = 'none';
                runQuizEngine(incorrectList, `${title} (مراجعة)`, subjectId);
            };
        }
    }

    loadQuestion();
}

async function initDashboardPage() {
    const container = $('dashboard-content');
    
    if (!CURRENT_STUDENT_ID) {
        container.innerHTML = '<p class="dashboard-empty-state">الرجاء تسجيل الدخول أولاً.</p>';
        return;
    }
    
    showLoading(container, 'جاري تحميل إحصائياتك...');
    
    try {
        const timestamp = Date.now();
        
        const [stats, results] = await Promise.all([
            apiRequest(`/students/${CURRENT_STUDENT_ID}/stats?t=${timestamp}`).then(r => r.json()),
            apiRequest(`/students/${CURRENT_STUDENT_ID}/results?t=${timestamp}`).then(r => r.json())
        ]);

        if (stats.error) throw new Error('Stats error');

        const avgClass = stats.averageScore >= 75 ? 'correct' : stats.averageScore >= 50 ? 'pass' : 'incorrect';

        let html = `
            <div class="dashboard-header" style="margin-bottom:2rem;">
                <h2>مرحباً ${USER_DATA?.name || 'الطالب'} 👋</h2>
                <p style="color:#666;">إليك ملخص تقدمك الدراسي</p>
            </div>
            <div class="dashboard-summary-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:1rem; margin-bottom:2rem;">
                <div class="summary-box">
                    <p class="summary-box-label">الاختبارات</p>
                    <p class="summary-box-value">${stats.totalQuizzes}</p>
                </div>
                <div class="summary-box">
                    <p class="summary-box-label">المتوسط</p>
                    <p class="summary-box-value ${avgClass}">${stats.averageScore}%</p>
                </div>
                <div class="summary-box">
                    <p class="summary-box-label">الأفضل</p>
                    <p class="summary-box-value level-excellent">${stats.bestScore}%</p>
                </div>
            </div>
            <div class="results-divider"></div>
        `;

        if (results.length === 0) {
            container.innerHTML = html + '<p class="dashboard-empty-state">لم تحل أي اختبار بعد. ابدأ الآن!</p>';
            return;
        }

        const bySubject = {};
        results.forEach(r => {
            const quizName = r.quizname || 'اختبار غير معروف';
            const subjectName = quizName.split(' - ')[0];
            
            if (!bySubject[subjectName]) {
                bySubject[subjectName] = {
                    name: subjectName,
                    results: []
                };
            }
            bySubject[subjectName].results.push(r);
        });

        for (const subjectName in bySubject) {
            const subject = bySubject[subjectName];
            html += `
                <div class="subject-history-card" style="margin-bottom:1.5rem; background:var(--card-bg); padding:1.5rem; border-radius:12px;">
                    <h3 style="margin-bottom:1rem; color:var(--primary-color);">${subject.name}</h3>
                    <ul class="history-list" style="list-style:none; padding:0;">
            `;
            
            subject.results.forEach(r => {
                const percent = Math.round((r.correctanswers / r.totalquestions) * 100);
                const percentClass = percent >= 75 ? 'correct' : percent >= 50 ? 'pass' : 'incorrect';
                const date = new Date(r.completedat).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                html += `
                    <li class="history-item" style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem; border-bottom:1px solid var(--border-color);">
                        <div>
                            <span class="score" style="font-weight:bold; color:var(--color-${percentClass});">${r.score} نقطة</span>
                            <span class="score-details" style="color:#666; margin:0 0.5rem;">(${r.correctanswers}/${r.totalquestions}) - ${percent}%</span>
                        </div>
                        <span class="history-date" style="color:#999; font-size:0.9rem;">${date}</span>
                    </li>
                `;
            });
            
            html += '</ul></div>';
        }

        container.innerHTML = html;
        
        logActivity('viewed_dashboard', null);
        
    } catch (e) {
        console.error('Dashboard Error:', e);
        container.innerHTML = '<p class="dashboard-empty-state">فشل تحميل البيانات. حاول لاحقاً.</p>';
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

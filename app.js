/*
 * APP.JS - Tawal Academy (Version 16.1.0 - Complete & Fixed)
 */

const API_URL = 'https://tawal-backend-production.up.railway.app/api';

const STORAGE_KEY_STUDENT_ID = 'tawal_student_id';
const STORAGE_KEY_USER = 'tawal_user_data';

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

const SUBJECTS = {
    gis_networks: { id: 'gis_networks', title: "تطبيقات نظم المعلومات الجغرافية فى الشبكات" },
    transport: { id: 'transport', title: "جغرافية النقل والمواصلات" },
    geo_maps: { id: 'geo_maps', title: "الخرائط الجيولوجية" },
    projections: { id: 'projections', title: "كتاب مساقط الخرائط" },
    research: { id: 'research', title: "مقرر مناهج البحث الجغرافى" },
    surveying_texts: { id: 'surveying_texts', title: "نصوص جغرافية فى المساحة والخرائط" },
    arid_lands: { id: 'arid_lands', title: "جغرافيا الاراضي الجافة" }
};

function $(id) { return document.getElementById(id); }
function getSubjectKey() {
    try {
        const params = new URLSearchParams(window.location.search);
        return SUBJECTS[params.get('subject')] ? params.get('subject') : DEFAULT_SUBJECT;
    } catch (e) { return DEFAULT_SUBJECT; }
}

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers }
        });
        return response;
    } catch (err) {
        console.error('API Error:', err);
        throw err;
    }
}

async function getFingerprint() {
    try {
        if (!window.FingerprintJS) return 'fallback_' + Math.random().toString(36).substr(2, 9);
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return result.visitorId;
    } catch (err) {
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
                <form id="reg-form">
                    <input type="text" id="reg-name" required placeholder="الاسم الثلاثي" style="width:100%;padding:0.75rem;border:2px solid #ddd;border-radius:8px;margin-bottom:1rem;">
                    <input type="email" id="reg-email" required placeholder="البريد الإلكتروني" style="width:100%;padding:0.75rem;border:2px solid #ddd;border-radius:8px;margin-bottom:1rem;">
                    <div id="reg-error" style="color:red;margin-bottom:1rem;display:none;"></div>
                    <div style="display:flex;gap:1rem;">
                        <button type="submit" style="flex:1;padding:0.75rem;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;border:none;border-radius:8px;cursor:pointer;">تسجيل</button>
                        <button type="button" id="reg-cancel" style="flex:1;padding:0.75rem;background:#ccc;color:#333;border:none;border-radius:8px;cursor:pointer;">إلغاء</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('reg-form').onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            document.body.removeChild(modal);
            resolve({ name, email });
        };
        
        document.getElementById('reg-cancel').onclick = () => {
            document.body.removeChild(modal);
            resolve(null);
        };
    });
}

async function registerStudent(fingerprint) {
    const userData = await showRegistrationModal();
    if (!userData) return false;

    try {
        const response = await fetch(`${API_URL}/students/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: userData.name, email: userData.email, fingerprint })
        });

        const data = await response.json();
        if (response.status === 403) {
            alert('الجهاز محظور');
            return false;
        }

        if (data.id) {
            CURRENT_STUDENT_ID = data.id;
            USER_DATA = data;
            localStorage.setItem(STORAGE_KEY_STUDENT_ID, data.id);
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data));
            alert(`أهلاً بك يا ${data.name}!`);
            return true;
        }
        return false;
    } catch (err) {
        alert('فشل الاتصال بالخادم');
        return false;
    }
}

async function verifyExistingStudent() {
    const storedId = localStorage.getItem(STORAGE_KEY_STUDENT_ID);
    if (!storedId) return false;

    try {
        const response = await apiRequest(`/students/${storedId}`);
        if (!response || !response.ok) {
            localStorage.clear();
            return false;
        }
        const student = await response.json();
        if (student.isblocked) {
            alert('الحساب محظور');
            return false;
        }
        CURRENT_STUDENT_ID = student.id;
        USER_DATA = student;
        return true;
    } catch (err) {
        localStorage.clear();
        return false;
    }
}

async function saveQuizResult(quizName, score, totalQuestions, correctAnswers) {
    if (!CURRENT_STUDENT_ID) return;
    
    try {
        await apiRequest('/quiz-results', {
            method: 'POST',
            body: JSON.stringify({
                studentId: CURRENT_STUDENT_ID,
                quizName,
                score,
                totalQuestions,
                correctAnswers
            })
        });
        console.log('✓ Result Saved');
    } catch (err) {
        console.error('Save Error:', err);
    }
}

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

document.addEventListener('DOMContentLoaded', async () => {
    try {
        initThemeToggle();
        FINGERPRINT_ID = await getFingerprint();

        const isVerified = await verifyExistingStudent();
        if (!isVerified) {
            const isRegistered = await registerStudent(FINGERPRINT_ID);
            if (!isRegistered) return;
        }

        const subjectKey = getSubjectKey();
        
        if ($('subjects-grid')) {
            await initIndexPage();
        } else if ($('quiz-body')) {
            await initQuizPage(subjectKey);
        } else if ($('dashboard-content')) {
            await initDashboardPage();
        }
    } catch (error) {
        console.error('Error:', error);
    }
});

async function initIndexPage() {
    const grid = $('subjects-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    for (const key in SUBJECTS) {
        const s = SUBJECTS[key];
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `
            <h3 class="card-title">${s.title}</h3>
            <div class="card-actions">
                <a href="quiz.html?subject=${key}" class="card-btn btn-quiz">🧠 الاختبارات</a>
            </div>
        `;
        grid.appendChild(card);
    }
}

async function initQuizPage(subjectKey) {
    const titleEl = $('quiz-title');
    const body = $('quiz-body');
    
    if (!SUBJECTS[subjectKey]) {
        body.innerHTML = '<p>المادة غير موجودة</p>';
        return;
    }
    
    titleEl.innerText = SUBJECTS[subjectKey].title;
    
    let pastResults = [];
    try {
        if (CURRENT_STUDENT_ID) {
            const res = await apiRequest(`/students/${CURRENT_STUDENT_ID}/results`);
            if (res && res.ok) pastResults = await res.json();
        }
    } catch (e) {
        console.error('Results Error:', e);
    }

    let html = '<div style="display:grid; gap:1rem;">';
    
    LEVEL_CONFIG.forEach((lvl, idx) => {
        let locked = false;
        
        if (idx > 0) {
            const prevLvl = LEVEL_CONFIG[idx - 1];
            const prevAttempts = pastResults.filter(r => 
                r.quizname && r.quizname.includes(prevLvl.titleSuffix)
            );
            const bestPrevScore = prevAttempts.length > 0 
                ? Math.max(...prevAttempts.map(r => (r.correctanswers / r.totalquestions) * 100))
                : 0;
            
            if (bestPrevScore < prevLvl.requiredScore) {
                locked = true;
            }
        }

        const myAttempts = pastResults.filter(r => 
            r.quizname && r.quizname.includes(lvl.titleSuffix)
        );
        const bestScore = myAttempts.length 
            ? Math.max(...myAttempts.map(r => Math.round((r.correctanswers / r.totalquestions) * 100)))
            : 0;

        const btnStyle = locked 
            ? 'background:#999; cursor:not-allowed;' 
            : 'background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white;';
        
        const btnText = locked ? `🔒 يجب تحقيق ${prevLvl.requiredScore}%` : '🚀 ابدأ';
        const onClick = locked ? '' : `loadLevelFile('${subjectKey}', ${idx})`;
        
        html += `
            <div class="subject-card">
                <h3>${lvl.name}</h3>
                ${bestScore > 0 ? `<p style="color:green;">⭐ أفضل درجة: ${bestScore}%</p>` : ''}
                <button style="${btnStyle} width:100%; padding:1rem; border:none; border-radius:8px;" onclick="${onClick}" ${locked ? 'disabled' : ''}>
                    ${btnText}
                </button>
            </div>
        `;
    });
    
    body.innerHTML = html + '</div>';
}

window.loadLevelFile = async (subjectKey, levelIndex) => {
    const config = LEVEL_CONFIG[levelIndex];
    const url = `data_${subjectKey}/data_${subjectKey}${config.suffix}`;

    const body = $('quiz-body');
    body.innerHTML = '<p>جاري التحميل...</p>';

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('File not found');
        
        const quizData = await res.json();
        if (!quizData.questions || quizData.questions.length === 0) {
            throw new Error('No questions');
        }
        
        const fullTitle = `${SUBJECTS[subjectKey].title} - ${config.titleSuffix}`;
        runQuizEngine(quizData.questions, fullTitle);
        
    } catch (e) {
        alert('ملف الأسئلة غير متوفر');
        initQuizPage(subjectKey);
    }
};

function runQuizEngine(questions, title) {
    let currentIdx = 0;
    let totalScore = 0;
    let correctCount = 0;

    const titleEl = $('quiz-title');
    titleEl.innerText = title;

    const questionsShuffled = shuffleArray(questions);

    $('quiz-body').innerHTML = `
        <h3 id="question-text"></h3>
        <div id="opts"></div>
        <p id="feedback"></p>
    `;
    
    $('quiz-footer').style.display = 'block';
    const nextBtn = $('next-btn');

    function loadQuestion() {
        const q = questionsShuffled[currentIdx];
        $('question-text').innerText = q.question;
        $('question-counter').innerText = `السؤال ${currentIdx + 1} / ${questionsShuffled.length}`;
        $('progress-bar').style.width = `${((currentIdx + 1) / questionsShuffled.length) * 100}%`;
        
        $('feedback').innerText = '';
        nextBtn.disabled = true;
        nextBtn.innerText = (currentIdx === questionsShuffled.length - 1) ? 'عرض النتيجة' : 'التالي';
        
        const optsDiv = $('opts');
        optsDiv.innerHTML = '';

        const options = q.type === 'tf' ? ['صح', 'خطأ'] : q.options;
        
        options.forEach((txt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = txt;
            btn.style.cssText = 'width:100%; padding:1rem; margin:0.5rem 0; border:2px solid #ddd; border-radius:8px; cursor:pointer;';
            
            let isCorrect = false;
            if (q.type === 'tf') {
                isCorrect = (i === 0) === (String(q.answer).toLowerCase() === 'true');
            } else {
                isCorrect = (i === q.answer);
            }

            btn.onclick = () => {
                Array.from(optsDiv.children).forEach(b => b.disabled = true);
                
                if (isCorrect) {
                    correctCount++;
                    totalScore += 10;
                    btn.style.background = '#2ecc71';
                    btn.style.color = 'white';
                    $('feedback').innerText = '✅ صحيح';
                } else {
                    btn.style.background = '#e74c3c';
                    btn.style.color = 'white';
                    $('feedback').innerText = '❌ خطأ';
                }
                
                nextBtn.disabled = false;
            };
            optsDiv.appendChild(btn);
        });
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

        saveQuizResult(title, totalScore, questions.length, correctCount);

        const percent = Math.round((correctCount / questions.length) * 100);

        resDiv.innerHTML = `
            <h2>${percent}%</h2>
            <h3>${title}</h3>
            <p>${totalScore} نقطة</p>
            <p>${correctCount} من ${questions.length}</p>
            <button onclick="location.reload()" style="padding:1rem 2rem; background:#667eea; color:white; border:none; border-radius:8px; cursor:pointer;">إعادة</button>
            <a href="index.html" style="padding:1rem 2rem; background:#666; color:white; border:none; border-radius:8px; text-decoration:none; display:inline-block; margin-top:1rem;">الرئيسية</a>
        `;
    }

    loadQuestion();
}

async function initDashboardPage() {
    const container = $('dashboard-content');
    
    if (!CURRENT_STUDENT_ID) {
        container.innerHTML = '<p>الرجاء تسجيل الدخول أولاً.</p>';
        return;
    }
    
    container.innerHTML = '<p>جاري التحميل...</p>';
    
    try {
        const [stats, results] = await Promise.all([
            apiRequest(`/students/${CURRENT_STUDENT_ID}/stats`).then(r => r.json()),
            apiRequest(`/students/${CURRENT_STUDENT_ID}/results`).then(r => r.json())
        ]);

        let html = `
            <div class="dashboard-header">
                <h2>مرحباً ${USER_DATA?.name || 'الطالب'} 👋</h2>
            </div>
            <div class="dashboard-summary-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem; margin-bottom:2rem;">
                <div class="summary-box">
                    <p>الاختبارات</p>
                    <h2>${stats.totalQuizzes}</h2>
                </div>
                <div class="summary-box">
                    <p>المتوسط</p>
                    <h2>${stats.averageScore}%</h2>
                </div>
                <div class="summary-box">
                    <p>الأفضل</p>
                    <h2>${stats.bestScore}%</h2>
                </div>
            </div>
        `;

        if (results.length > 0) {
            html += '<h3>السجل:</h3><ul>';
            results.forEach(r => {
                const percent = Math.round((r.correctanswers / r.totalquestions) * 100);
                html += `<li>${r.quizname} - ${r.score} نقطة (${percent}%)</li>`;
            });
            html += '</ul>';
        }

        container.innerHTML = html;
        
    } catch (e) {
        container.innerHTML = '<p>فشل تحميل البيانات</p>';
    }
}

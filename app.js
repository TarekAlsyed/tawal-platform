/*
 * app.js - Tawal Academy (v10.1.0 - Activity Logging)
 * - (جديد) إضافة دالة logActivity لإرسال أنشطة الطالب (فتح الملخص/الصور) إلى الخادم.
 * - (تعديل) استدعاء logActivity عند الضغط على أزرار التبويب في initSummaryPage.
 */

/* =======================
   (جديد) إعدادات الاتصال بالخادم
   ======================= */
const API_URL = 'https://tawal-backend-production.up.railway.app/api';
let STUDENT_ID = localStorage.getItem('tawal_studentId');

/* =======================
   إعدادات ومفاتيح التخزين
   ======================= */
const PROGRESS_KEY = 'tawalAcademyProgress_v1';
const DEFAULT_SUBJECT = 'gis_networks';

const LOGO_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M40 8H8c-2.21 0-4 1.79-4 4v24c0 2.21 1.79 4 4 4h32c2.21 0 4-1.79 4-4V12c0-2.21-1.79-4-4-4z" fill="currentColor"/>
        <path d="M18 20l6 12 6-12" stroke="white" stroke-width="2"/>
        <line x1="16" y1="20" x2="32" y2="20" stroke="white" stroke-width="2"/>
    </svg>
`;

/* =======================
   قائمة المواد (بدون حالة الجاهزية)
   ======================= */
const SUBJECTS = {
    gis_networks: {
        title: "تطبيقات نظم المعلومات الجغرافية فى الشبكات",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    },
    transport: {
        title: "جغرافية النقل والمواصلات",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 17l5 5"></path><path d="M10 17l5 5"></path><path d="M8 17l-5 5"></path><path d="M14 17l-5 5"></path><path d="M2 17h20"></path><path d="M2.6 10.5h18.8"></path><path d="M7 10.5l5 6.5"></path><path d="M17 10.5l-5 6.5"></path><path d="M12 10.5V17"></path><path d="M5.5 10.5C5.5 8 8.45 2 12 2s6.5 6 6.5 8.5Z"></path></svg>',
    },
    geo_maps: {
        title: "الخرائط الجيولوجية",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="m10 14-2 2 2 2"></path><path d="m14 18 2-2-2-2"></path></svg>',
    },
    projections: {
        title: "كتاب مساقط الخرائط",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>',
    },
    research: {
        title: "مقرر مناهج البحث الجغرافى",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15.09 13.6-2.2-2.2 2.2-2.2"></path><path d="m10.39 18.4 2.2-2.2-2.2-2.2"></path><path d="M3 22v-3.5a2.5 2.5 0 0 1 2.5-2.5h13A2.5 2.5 0 0 1 21 18.5V22"></path><path d="M2 13.3V3a1 1 0 0 1 1-1h11l5 5v10.3"></path><path d="M14 2v6h6"></path></svg>',
    },
    surveying_texts: {
        title: "نصوص جغرافية فى المساحة والحرائط",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 16 4-4-4-4"></path><path d="m8 16 4-4-4-4"></path><path d="M2 12h20"></path></svg>',
    },
    arid_lands: {
        title: "جغرافيا الاراضي الجافة",
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.1 12.4C17.1 12.4 17 14 17 15s.9 3 2.1 3.6c1.2.6 2.4.6 3.1.3 1-.4 1.9-1.3 2-2.5.1-1.1-.5-2.1-1.2-2.8-.7-.7-1.7-1-2.5-1.1-1.2-.1-2.2.4-2.8 1-.6.6-1.1 1.4-1.1 2.2z"></path><path d="M5.1 12.4C5.1 12.4 5 14 5 15s.9 3 2.1 3.6c1.2.6 2.4.6 3.1.3 1-.4 1.9-1.3 2-2.5.1-1.1-.5-2.1-1.2-2.8-.7-.7-1.7-1-2.5-1.1-1.2-.1-2.2.4-2.8 1-.6.6-1.1 1.4-1.1 2.2z"></path><path d="M11.1 12.4C11.1 12.4 11 14 11 15s.9 3 2.1 3.6c1.2.6 2.4.6 3.1.3 1-.4 1.9-1.3 2-2.5.1-1.1-.5-2.1-1.2-2.8-.7-.7-1.7-1-2.5-1.1-1.2-.1-2.2.4-2.8 1-.6.6-1.1 1.4-1.1 2.2z"></path><path d="M12 2v2"></path><path d="m4.9 4.9 1.4 1.4"></path><path d="M2 12h2"></path><path d="m4.9 19.1 1.4-1.4"></path><path d="M12 22v-2"></path><path d="m19.1 19.1-1.4-1.4"></path><path d="M22 12h-2"></path><path d="m19.1 4.9-1.4 1.4"></path></svg>',
    },
};

/* =======================
   مساعدة: الحصول على مفتاح المادة من URL
   ======================= */
function getSubjectKey() {
    try {
        const params = new URLSearchParams(window.location.search);
        return params.get('subject') || DEFAULT_SUBJECT;
    } catch (e) {
        return DEFAULT_SUBJECT;
    }
}

/* =======================
   (*** تعديل v10.1.0: دالة تسجيل النشاط الجديدة ***)
   ======================= */
function logActivity(activityType, subjectName = null) {
    if (!STUDENT_ID) return; // لا تسجل أي شيء إذا لم يكن الطالب مسجلاً

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
        if (data.id) {
            console.log(`✓ تم تسجيل النشاط: ${activityType}`);
        }
    })
    .catch(err => console.error('فشل تسجيل النشاط:', err));
    // (لا ننتظر الرد، ليكمل في الخلفية)
}

/* =======================
   (*** تعديل v10.0.0: دالة حفظ النتائج الجديدة ***)
   ======================= */
function saveQuizResult(quizName, score, totalQuestions, correctAnswers) {
    if (!STUDENT_ID) {
        console.error('لا يوجد معرف للطالب، لا يمكن حفظ النتيجة.');
        return;
    }

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
        if (data.id) {
            console.log('✓ تم حفظ النتيجة في قاعدة البيانات:', data.message);
        } else {
            console.error('فشل حفظ النتيجة في قاعدة البيانات:', data.error);
        }
    })
    .catch(err => console.error('خطأ فادح في الاتصال لحفظ النتيجة:', err));
}


/* =======================
   (*** تعديل v9.1.2 ***)
   ======================= */
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

                const combinedData = {
                    quizData: quizData,
                    summaryData: summaryData
                };

                resolve(combinedData);
            })
            .catch(error => {
                console.error(`Unexpected error loading data for ${subjectKey}:`, error);
                reject(error);
            });
    });
}


/* =======================
   DOMHelpers — الحصول على العناصر بأمان
   ======================= */
function $(id) { return document.getElementById(id); }

/* =======================
   (*** تعديل v10.0.0: نظام التسجيل الجديد ***)
   ======================= */
async function registerStudent() {
    const name = prompt('أهلاً بك في منصة Tawal Academy!\n\nالرجاء إدخال اسمك (لربط نتائجك به):');
    const email = prompt('الرجاء إدخال بريدك الإلكتروني:');

    if (!name || !email) {
        alert('يجب إدخال الاسم والبريد الإلكتروني للمتابعة.');
        const quizContainer = document.querySelector('.quiz-container');
        const mainContainer = document.querySelector('.main-container');
        if (quizContainer) quizContainer.innerHTML = `<div class="quiz-header"><h2>الوصول مرفوض</h2></div>`;
        if (mainContainer) mainContainer.innerHTML = `<header class="main-header"><h1 class="logo">الوصول مرفوض</h1></header>`;
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/students/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email })
        });
        const data = await response.json();

        if (data.id) {
            // نجح التسجيل
            STUDENT_ID = data.id;
            localStorage.setItem('tawal_studentId', data.id);
            localStorage.setItem('tawal_studentName', data.name);
            alert(`أهلاً بك يا ${data.name}! تم تسجيلك بنجاح.`);
            return true;
        } else if (data.error && data.error.includes('UNIQUE')) {
            alert(`أهلاً بعودتك يا ${name}! يبدو أنك مسجل بالفعل.`);
            // (مستقبلاً: يجب جلب الـ ID من الإيميل)
            // لإعادة المحاولة
            return await registerStudent(); 
        } else {
            alert('حدث خطأ أثناء التسجيل: ' + data.error);
            return false;
        }
    } catch (err) {
        console.error('فشل الاتصال بخادم التسجيل:', err);
        alert('لا يمكن الاتصال بالخادم. الرجاء التأكد من اتصالك بالإنترنت والمحاولة لاحقاً.');
        return false;
    }
}


/* =======================
   تهيئة عند تحميل الصفحة (*** تعديل v10.0.0 ***)
   ======================= */
document.addEventListener('DOMContentLoaded', async () => {
    initThemeToggle();

    // (*** تعديل جديد: التحقق من التسجيل أولاً ***)
    if (!STUDENT_ID) {
        const success = await registerStudent();
        if (!success) {
            return;
        }
    } else {
        // (جديد) تسجيل الدخول في الخادم عند كل زيارة
        fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: STUDENT_ID })
        });
    }
    
    // detect page by presence of elements
    const subjectKey = getSubjectKey();
    const quizBody = $('quiz-body');
    const summaryFilesContent = $('summary-content-files'); 
    const subjectsGrid = $('subjects-grid');
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

/* =======================
   Theme toggle بسيطة
   ======================= */
function initThemeToggle() {
    const btn = $('theme-toggle-btn');
    const saved = localStorage.getItem('theme') || 'dark'; // الوضع الداكن افتراضيًا
    
    if (saved === 'light') { 
        document.body.classList.add('light-mode');
    }

    if (btn) btn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark'; 
        localStorage.setItem('theme', theme);
    });
}

/* ==================================
   Index page — (المحرك الذكي الجديد v5.2)
   ================================== */
async function initIndexPage() {
    const grid = $('subjects-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const logoEl = document.querySelector('.main-header .logo');
    if(logoEl) {
        logoEl.innerHTML = LOGO_SVG;
    }
    
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
        const key = card.dataset.subjectKey;
        if(key) {
            await loadAndEnableCard(key, card);
        }
    }


    const searchBar = $('search-bar');
    const noResultsEl = $('no-results-message');

    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim().toLowerCase();
            let visibleCount = 0;

            allCards.forEach(card => {
                const subjectKey = card.dataset.subjectKey;
                const subjectTitle = SUBJECTS[subjectKey] ? SUBJECTS[subjectKey].title.toLowerCase() : '';
                
                const isVisible = subjectTitle.normalize("NFKD").replace(/[\u064B-\u0652]/g, "").includes(
                                    searchTerm.normalize("NFKD").replace(/[\u064B-\u0652]/g, "")
                                  );

                if (isVisible) {
                    card.style.display = 'flex';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            if (noResultsEl) {
                noResultsEl.style.display = (visibleCount === 0) ? 'block' : 'none';
            }
        });
    }
}

// (*** تعديل جوهري هنا v9.1.0 ***)
// دالة مساعدة لتحميل البيانات وتفعيل الأزرار
async function loadAndEnableCard(key, cardElement) {
    try {
        const data = await loadSubjectData(key); 

        const quizBtn = cardElement.querySelector('.btn-quiz');
        const summaryBtn = cardElement.querySelector('.btn-summary');

        if (data && data.quizData && data.quizData.questions && data.quizData.questions.length > 0) {
            if(quizBtn) {
                quizBtn.classList.remove('disabled');
                quizBtn.innerText = '🧠 اختبار';
                quizBtn.setAttribute('aria-disabled', 'false');
            }
        }
        
        const hasNewFiles = data && data.summaryData && data.summaryData.files && data.summaryData.files.length > 0;
        const hasNewImages = data && data.summaryData && data.summaryData.images && data.summaryData.images.length > 0;
        const hasOldContent = data && data.summaryData && data.summaryData.content && data.summaryData.content.length > 100;

        if (hasOldContent || hasNewFiles || hasNewImages) { 
            if(summaryBtn) {
                summaryBtn.classList.remove('disabled');
                summaryBtn.innerText = '📖 ملخص';
                summaryBtn.setAttribute('aria-disabled', 'false');
            }
        }
        
    } catch (e) {
        console.warn(`Could not load data for ${key}: ${e.message}`);
    }
}


/* =======================
   Summary page (*** تعديل v10.1.0: إضافة تسجيل النشاط ***)
   ======================= */
async function initSummaryPage(subjectKey) {
    const titleEl = $('summary-title');
    
    const tabsContainer = document.querySelector('.summary-tabs');
    const filesTab = $('btn-summary-files');
    const imagesTab = $('btn-summary-images');
    const filesContentEl = $('summary-content-files');
    const imagesContentEl = $('summary-content-images');

    const modal = $('lightbox-modal');
    const modalImg = $('lightbox-img');
    const closeModal = $('lightbox-close');

    if (!subjectKey) {
        if (titleEl) titleEl.innerText = 'خطأ';
        if (filesContentEl) filesContentEl.innerHTML = '<p>لم يتم تحديد المادة.</p>';
        if (tabsContainer) tabsContainer.style.display = 'none';
        return;
    }
    
    try {
        const data = await loadSubjectData(subjectKey); 
        
        if (data && data.summaryData && data.summaryData.title) {
            const subjectTitle = data.summaryData.title || SUBJECTS[subjectKey].title;
            if (titleEl) titleEl.innerText = subjectTitle;
            
            const backBtn = document.createElement('a');
            backBtn.href = 'index.html';
            backBtn.className = 'card-btn next-btn';
            backBtn.innerText = '🏠 العودة للرئيسية';
            backBtn.style.marginTop = '2rem'; // إضافة مسافة

            const hasFiles = data.summaryData.files && data.summaryData.files.length > 0;
            const hasImages = data.summaryData.images && data.summaryData.images.length > 0;
            const hasOldContent = data.summaryData.content && data.summaryData.content.length > 100;

            if (hasFiles || hasImages) {
                if (tabsContainer) tabsContainer.style.display = 'flex';

                // ملء الملفات
                if (hasFiles) {
                    let filesHtml = '<ul class="file-download-list">';
                    data.summaryData.files.forEach(file => {
                        let icon = '📄'; // Default icon
                        if (file.type === 'pdf') icon = '📕';
                        if (file.type === 'doc') icon = '📘';
                        if (file.type === 'ppt') icon = '📙';
                        
                        filesHtml += `
                            <li class="file-download-item">
                                <a href="${file.path}" target="_blank" rel="noopener noreferrer" class="file-download-link">
                                    <span class="file-download-icon">${icon}</span>
                                    <span class="file-download-name">${file.name}</span>
                                </a>
                            </li>
                        `;
                    });
                    filesHtml += '</ul>';
                    if (filesContentEl) filesContentEl.innerHTML = filesHtml;
                } else {
                    if (filesContentEl) filesContentEl.innerHTML = '<p class="placeholder">لا توجد ملفات (PDF/Word) لهذه المادة.</p>';
                }
                
                // ملء الصور
                if (hasImages) {
                    let imagesHtml = '<div class="gallery-grid">';
                    data.summaryData.images.forEach(img => {
                         imagesHtml += `
                            <div class="gallery-item">
                                <img src="${img.path}" alt="${img.caption || 'صورة من الملخص'}">
                                <p>${img.caption || 'صورة'}</p>
                            </div>
                         `;
                    });
                    imagesHtml += '</div>';
                    if (imagesContentEl) imagesContentEl.innerHTML = imagesHtml;
                }

                if (filesContentEl) filesContentEl.appendChild(backBtn.cloneNode(true));
                if (imagesContentEl) imagesContentEl.appendChild(backBtn.cloneNode(true));
            
                // (*** تعديل v10.1.0: تسجيل النشاط ***)
                // ربط أزرار التبويب
                if (filesTab) {
                    filesTab.addEventListener('click', () => {
                        filesContentEl.style.display = 'block';
                        imagesContentEl.style.display = 'none';
                        filesTab.classList.add('active');
                        imagesTab.classList.remove('active');
                        // تسجيل النشاط
                        logActivity('Viewed Summary Files', subjectTitle);
                    });
                }
                if (imagesTab) {
                    imagesTab.addEventListener('click', () => {
                        filesContentEl.style.display = 'none';
                        imagesContentEl.style.display = 'block';
                        filesTab.classList.remove('active');
                        imagesTab.classList.add('active');
                        // تسجيل النشاط
                        logActivity('Viewed Image Gallery', subjectTitle);
                    });
                }
                
                // تحديد التبويب الافتراضي وتسجيل أول نشاط
                if (hasFiles) {
                    filesTab.click(); 
                } else if (hasImages) {
                    imagesTab.click();
                }
                // (*** نهاية التعديل ***)


            } else if (hasOldContent) {
                if (tabsContainer) tabsContainer.style.display = 'none';
                if (imagesContentEl) imagesContentEl.style.display = 'none';
                
                if (filesContentEl) filesContentEl.innerHTML = data.summaryData.content;
                if (filesContentEl) filesContentEl.appendChild(backBtn);
                // (*** تعديل v10.1.0: تسجيل النشاط للمحتوى القديم ***)
                logActivity('Viewed Summary (Old)', subjectTitle);

            } else {
                if (tabsContainer) tabsContainer.style.display = 'none';
                if (imagesContentEl) imagesContentEl.style.display = 'none';
                if (filesContentEl) filesContentEl.innerHTML = '<p class="placeholder">الملخص غير متاح حالياً لهذه المادة.</p>';
            }

            if (modal && closeModal && modalImg) {
                const closeLightbox = () => modal.classList.remove('show');
                closeModal.onclick = closeLightbox;
                modal.onclick = (e) => {
                    if (e.target === modal) closeLightbox();
                };
                const imagesInGallery = imagesContentEl.querySelectorAll('.gallery-item img');
                const imagesInText = filesContentEl.querySelectorAll('img'); 
                const openLightbox = (e) => {
                    modal.classList.add('show');
                    modalImg.src = e.target.src;
                };
                imagesInGallery.forEach(img => img.onclick = openLightbox);
                imagesInText.forEach(img => img.onclick = openLightbox);
            }
        } else {
            const subjectName = SUBJECTS[subjectKey] ? SUBJECTS[key].title : 'المادة';
            if (titleEl) titleEl.innerText = subjectName;
            if (filesContentEl) filesContentEl.innerHTML = `<p class="placeholder">الملخص غير متاح حالياً لمادة "${subjectName}". سيتم إضافته قريباً.</p>`;
            if (tabsContainer) tabsContainer.style.display = 'none';
        }
    } catch (e) {
        console.error('Failed to load summary', e);
        if (titleEl) titleEl.innerText = 'خطأ في التحميل';
        if (filesContentEl) filesContentEl.innerHTML = '<p>حدث خطأ أثناء تحميل الملخص.</p>';
        if (tabsContainer) tabsContainer.style.display = 'none';
    }
}


/* =====================================
   (*** تعديل v10.0.0: لوحة التقدم الجديدة ***)
   ===================================== */
async function initDashboardPage() {
    const container = $('dashboard-content');
    if (!container) return;

    if (!STUDENT_ID) {
        container.innerHTML = '<p class="dashboard-empty-state">الرجاء تسجيل الدخول أولاً لرؤية إحصائياتك.</p>';
        return;
    }
    
    // إظهار رسالة تحميل أولية
    container.innerHTML = '<p class="dashboard-empty-state">جاري تحميل إحصائياتك من الخادم...</p>';

    try {
        // جلب الإحصائيات ونتائج الاختبارات من الخادم
        const statsResponse = await fetch(`${API_URL}/students/${STUDENT_ID}/stats`);
        const stats = await statsResponse.json();

        const resultsResponse = await fetch(`${API_URL}/students/${STUDENT_ID}/results`);
        const results = await resultsResponse.json();

        if (stats.error || results.error) {
            throw new Error('فشل جلب البيانات من الخادم');
        }

        if (stats.totalQuizzes === 0) {
            container.innerHTML = '<p class="dashboard-empty-state">لم تقم بإجراء أي اختبارات بعد. ابدأ اختباراً وسيظهر تقدمك هنا!</p>';
            return;
        }

        // بناء HTML للإحصائيات العامة
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
                    <p class="summary-box-label">أفضل نتيجة (نقاط)</p>
                    <p class="summary-box-value level-excellent">${stats.bestScore}</p>
                </div>
            </div>
            <div class="results-divider"></div>
        `;

        // تجميع النتائج حسب اسم الاختبار
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
                if (att.score >= 300) scoreClass = 'level-excellent'; // (مثال، يمكنك تعديل المستويات)
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
        container.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل الإحصائيات. الرجاء التأكد من اتصالك بالإنترنت.</p>';
    }
}


/* =======================
   Quiz page init (*** تعديل v10.0.0: إزالة كلمة السر ***)
   ======================= */
async function initQuizPage(subjectKey) {
    const titleEl = $('quiz-title');
    const questionTextEl = $('question-text');
    const quizFooter = $('quiz-footer');

    if (!subjectKey) {
        if (titleEl) titleEl.innerText = 'خطأ';
        if (questionTextEl) questionTextEl.innerText = 'لم يتم تحديد المادة.';
        if (quizFooter) quizFooter.style.display = 'none';
        return;
    }

    try {
        const data = await loadSubjectData(subjectKey); 
        let quizObj = undefined;

        if (data && data.quizData && data.quizData.questions) {
             quizObj = data.quizData;
        }

        if (!quizObj || !Array.isArray(quizObj.questions) || quizObj.questions.length === 0) {
            if (titleEl) titleEl.innerText = (SUBJECTS[subjectKey] ? SUBJECTS[subjectKey].title : 'خطأ');
            if (questionTextEl) questionTextEl.innerText = 'هذا الاختبار غير متاح حالياً أو ملف البيانات لا يحتوي أسئلة.';
            if (quizFooter) quizFooter.style.display = 'none';
            return;
        }
        
        // (*** تعديل v10.1.0: تسجيل نشاط بدء الاختبار ***)
        logActivity('Started Quiz', quizObj.title || SUBJECTS[subjectKey].title);
        
        runQuizEngine(quizObj, subjectKey);

    } catch (e) {
        console.error('Failed to init quiz page', e);
        if (titleEl) titleEl.innerText = 'خطأ في التحميل';
        if (questionTextEl) questionTextEl.innerText = 'حدث خطأ أثناء تحميل بيانات الاختبار.';
        if (quizFooter) quizFooter.style.display = 'none';
    }
}

/* =======================
   المحرك الرئيسي للاختبار (v9.1.2 - إصلاح تحليل الأخطاء)
   ======================= */
function runQuizEngine(quizObj, subjectKey) {
    // عناصر DOM
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

    // بيانات
    const allQuestions = Array.isArray(quizObj.questions) ? quizObj.questions : [];
    let questionsShuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    let currentIndex = 0;
    
    let totalScore = 0; 
    let correctCount = 0; 
    let incorrectList = []; 
    let questionStartTime = 0;

    if (quizTitleEl) quizTitleEl.innerText = quizObj.title || SUBJECTS[subjectKey]?.title || 'اختبار';

    function startQuiz(questionsToUse = allQuestions) {
        const isReviewMode = questionsToUse !== allQuestions;

        if (isReviewMode) {
            questionsShuffled = [...questionsToUse]; 
            if (quizTitleEl) quizTitleEl.innerText = `${quizObj.title} (مراجعة الأخطاء)`;
        } else {
            questionsShuffled = [...questionsToUse].sort(() => Math.random() - 0.5);
            if (quizTitleEl) quizTitleEl.innerText = quizObj.title || SUBJECTS[subjectKey]?.title || 'اختبار';
            incorrectList = []; 
        }
        
        currentIndex = 0;
        totalScore = 0;
        correctCount = 0;
        
        if (quizBody) quizBody.style.display = 'block';
        if (quizFooter) quizFooter.style.display = 'block';
        if (resultsContainer) resultsContainer.style.display = 'none';
        
        if (nextBtn) {
            nextBtn.innerText = 'السؤال التالي ←';
            nextBtn.disabled = true;
        }

        loadQuestion();
    }

    function loadQuestion() {
        resetState();
        const currentQuestion = questionsShuffled[currentIndex];
        if (!currentQuestion) {
            if (questionTextEl) questionTextEl.innerText = 'خطأ: لا يمكن تحميل السؤال.';
            return;
        }
        if (questionTextEl) questionTextEl.innerText = currentQuestion.question || '';
        if (questionCounter) questionCounter.innerText = `السؤال ${currentIndex + 1} / ${questionsShuffled.length}`;
        if (progressBar) {
            const percent = questionsShuffled.length > 0 ? ((currentIndex + 1) / questionsShuffled.length) * 100 : 0;
            progressBar.style.width = `${percent}%`;
        }

        if (currentQuestion.type === 'tf') {
            if (tfContainer) {
                tfContainer.style.display = 'flex';
                const tfBtns = tfContainer.querySelectorAll('.option-btn');
                tfBtns.forEach(btn => {
                    btn.dataset.answer = (btn.dataset.answer === 'true') ? 'true' : 'false';
                    btn.disabled = false;
                    btn.classList.remove('correct', 'incorrect');
                    btn.onclick = () => handleSelectTF(btn);
                });
            }
            if (mcContainer) mcContainer.style.display = 'none';
        } else if (currentQuestion.type === 'mc') {
            if (mcContainer) {
                mcContainer.style.display = 'flex';
                const mcBtns = Array.from(mcContainer.querySelectorAll('.option-btn'));
                mcBtns.forEach((btn, i) => {
                    if (currentQuestion.options && currentQuestion.options[i] !== undefined) {
                        const txt = btn.querySelector('.option-text');
                        if (txt) txt.innerText = currentQuestion.options[i];
                        btn.dataset.index = String(i);
                        btn.disabled = false;
                        btn.style.display = 'flex';
                        btn.classList.remove('correct', 'incorrect');
                        btn.onclick = () => handleSelectMC(btn);
                    } else {
                        btn.style.display = 'none';
                    }
                });
            }
            if (tfContainer) tfContainer.style.display = 'none';
        }

        if (feedbackEl) { feedbackEl.innerText = ''; feedbackEl.className = 'feedback'; }
        if (nextBtn) nextBtn.disabled = true;
        questionStartTime = Date.now();
    }

    function resetState() {
        if (tfContainer) {
            const tfBtns = tfContainer.querySelectorAll('.option-btn');
            tfBtns.forEach(b => { b.disabled = false; b.classList.remove('correct', 'incorrect'); });
        }
        if (mcContainer) {
            const mcBtns = mcContainer.querySelectorAll('.option-btn');
            mcBtns.forEach(b => { b.disabled = false; b.classList.remove('correct', 'incorrect'); });
        }
    }

    function handleSelectTF(btn) {
        const val = String(btn.dataset.answer).toLowerCase() === 'true';
        const cq = questionsShuffled[currentIndex];
        const correctNormalized = String(cq.answer).toLowerCase() === 'true';
        finalizeAnswer(btn, val === correctNormalized);
    }

    function handleSelectMC(btn) {
        const sel = Number.isNaN(parseInt(btn.dataset.index, 10)) ? null : parseInt(btn.dataset.index, 10);
        const cq = questionsShuffled[currentIndex];
        const correct = Number.isNaN(parseInt(cq.answer, 10)) ? null : parseInt(cq.answer, 10);
        finalizeAnswer(btn, sel === correct);
    }

    function finalizeAnswer(buttonClicked, isCorrect) {
        const allBtns = document.querySelectorAll('.option-btn');
        allBtns.forEach(b => b.disabled = true);

        const currentQuestion = questionsShuffled[currentIndex];
        const timeTakenInSeconds = (Date.now() - questionStartTime) / 1000;

        if (isCorrect) {
            correctCount++;
            let basePoints = 0;
            let timeBonus = 0;

            switch (currentQuestion.difficulty) {
                case 'easy': case 'سهل':
                    basePoints = 10; break;
                case 'hard': case 'صعب':
                    basePoints = 30; break;
                default: 
                    basePoints = 20; break;
            }

            const isReviewMode = questionsShuffled.length !== allQuestions.length;
            if (!isReviewMode) {
                if (timeTakenInSeconds < 5) timeBonus = 10; 
                else if (timeTakenInSeconds < 10) timeBonus = 5;
            }

            const pointsEarned = basePoints + timeBonus;
            totalScore += pointsEarned; 

            if (buttonClicked) buttonClicked.classList.add('correct');
            if (feedbackEl) {
                let feedbackMsg = `إجابة صحيحة! +${pointsEarned} نقطة`;
                if (timeBonus > 0) feedbackMsg += ` (منها ${timeBonus}+ للسرعة ⚡)`;
                feedbackEl.innerText = feedbackMsg;
                feedbackEl.classList.add('correct');
            }

        } else {
            if (buttonClicked) buttonClicked.classList.add('incorrect');
            if (feedbackEl) { feedbackEl.innerText = 'إجابة خاطئة.'; feedbackEl.classList.add('incorrect'); }
            
            const isReviewMode = questionsShuffled.length !== allQuestions.length;
            if (!isReviewMode) { 
                 incorrectList.push(currentQuestion);
            }
            
            if (currentQuestion.type === 'tf' && tfContainer) {
                const want = String(currentQuestion.answer).toLowerCase();
                const correctBtn = tfContainer.querySelector(`.option-btn[data-answer="${want}"]`);
                if (correctBtn) correctBtn.classList.add('correct');
            } else if (currentQuestion.type === 'mc' && mcContainer) {
                const correctBtn = mcContainer.querySelector(`.option-btn[data-index="${currentQuestion.answer}"]`);
                if (correctBtn) correctBtn.classList.add('correct');
            }
        }
        
        if (nextBtn) {
            nextBtn.disabled = false;
            if (currentIndex === questionsShuffled.length - 1) nextBtn.innerText = 'عرض النتيجة';
        }
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            if (currentIndex < questionsShuffled.length - 1) {
                currentIndex++;
                loadQuestion();
            } else {
                showResults();
            }
        };
    }

    function showResults() {
        const totalQuestions = questionsShuffled.length;
        const isReviewMode = questionsShuffled.length !== allQuestions.length;
        
        let maxPossibleScore = 0;
        let baseMaxScore = 0; 
        
        allQuestions.forEach(q => {
            let basePoints = 0;
            switch (q.difficulty) {
                case 'easy': case 'سهل':
                    basePoints = 10; break;
                case 'hard': case 'صعب':
                    basePoints = 30; break;
                default:
                    basePoints = 20; break;
            }
            baseMaxScore += basePoints;
            maxPossibleScore += (basePoints + 10);
        });

        const percent = (baseMaxScore > 0) ? Math.round((totalScore / baseMaxScore) * 100) : 0;
        
        if (!isReviewMode) { 
            saveQuizResult(
                quizObj.title || 'اختبار', 
                totalScore, 
                totalQuestions,
                correctCount
            );
        }

        if (quizBody) quizBody.style.display = 'none';
        if (quizFooter) quizFooter.style.display = 'none';

        if (resultsContainer) {
            const incorrectCountForDisplay = isReviewMode ? (totalQuestions - correctCount) : incorrectList.length;
            let advice = 'أحسنت، استمر في المراجعة.';
            
            const questionsForReview = incorrectList;
            
            const errorByDifficulty = { easy: 0, medium: 0, hard: 0 };
            if (questionsForReview.length > 0) {
                const byTopic = {};
                questionsForReview.forEach(q => { 
                    const t = q.topic || 'متنوع';
                    byTopic[t] = (byTopic[t] || 0) + 1;
                    const d = q.difficulty || 'medium';
                    
                    if (d === 'easy' || d === 'سهل') errorByDifficulty.easy++;
                    else if (d === 'hard' || d === 'صعب') errorByDifficulty.hard++;
                    else errorByDifficulty.medium++;
                });
                
                let worst = ''; let maxErr = 0;
                Object.entries(byTopic).forEach(([k, v]) => { if (v > maxErr) { maxErr = v; worst = k; } } );
                if (maxErr > 1 && worst !== 'متنوع') advice = `لاحظنا أخطاء متكررة في: "${worst}". ننصح بمراجعة هذا الجزء.`;
                else advice = 'أخطاؤك متنوعة، راجع الملاحظات العامة.';
            }
            
            let errorListHtml = '';
            if (questionsForReview.length > 0) {
                errorListHtml = '<ul>';
                questionsForReview.forEach(q => { 
                    const diff = q.difficulty || '—';
                    const topic = q.topic || '—';
                    errorListHtml += `<li>${q.question} <br><span style="font-size: 0.9em; color: var(--text-color-light);">[الجزئية: ${topic}] [الصعوبة: ${diff}]</span></li>`; 
                });
                errorListHtml += '</ul>';
            } else {
                errorListHtml = '<p>لا توجد أخطاء — أحسنت!</p>';
            }
            
            const shareText = `🌍 حصلت على ${totalScore} نقطة (${correctCount} / ${totalQuestions}) في اختبار "${quizObj.title}"! هل يمكنك تحقيق نتيجة أفضل؟ ${window.location.origin}/quiz-project2/`;
            
            const chartPercent = percent > 100 ? 100 : percent;

            resultsContainer.style.display = 'flex';
            
            resultsContainer.innerHTML = `
                <div class="results-chart" style="--percentage-value: ${chartPercent * 3.6}deg;">
                   <span class="percentage-text">${chartPercent}%</span>
                </div>
                
                <h3 style="font-size: 1.3rem; margin-bottom: 5px;">نظام النقاط المتقدم ⚡</h3>
                <h2 style="margin-top: 0; color: var(--primary-color);">${totalScore} / ${baseMaxScore} نقطة</h2>
                <p class="results-explanation">
                    (يعتمد على <strong>صعوبة</strong> السؤال + <strong>سرعة</strong> إجابتك)
                </p>

                <div class="results-divider" style="margin: 1rem 0;"></div>

                <h3 style="font-size: 1.3rem; margin-bottom: 5px;">النظام التقليدي 🎯</h3>
                <h2 style="margin-top: 0;">${correctCount} / ${totalQuestions}</h2>
                 <p class="results-explanation">
                    (عدد الإجابات الصحيحة بغض النظر عن الصعوبة أو الوقت)
                </p>
                
                <div class="results-divider"></div>
                
                <div class="analysis-section">
                    <h4>تحليل الأخطاء</h4>
                    <div class="difficulty-analysis">
                        <ul>
                            <li>أخطأت في: <span>${errorByDifficulty.easy}</span> أسئلة (سهلة)</li>
                            <li>أخطأت في: <span>${errorByDifficulty.medium}</span> أسئلة (متوسطة)</li>
                            <li>أخطأت في: <span>${errorByDifficulty.hard}</span> أسئلة (صعبة)</li>
                        </ul>
                    </div>
                    <h4 style="margin-top: 15px;">نصيحة المراجعة</h4>
                    <div class="advice-box">
                        ${advice}
                    </div>
                </div>
                
                <div class="error-list">
                  <details>
                    <summary>عرض الأسئلة التي أخطأت فيها (${questionsForReview.length})</summary>
                    <div class="error-list-content">${errorListHtml}</div>
                  </details>
                </div>

                <div class="results-actions" style="margin-top:12px; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; width: 100%;">
                    ${questionsForReview.length > 0 ? `<button id="review-btn" class="card-btn btn-summary" style="padding: 0.8rem 1.5rem; order: 1; background-color: var(--color-incorrect); border-color: var(--color-incorrect); color: white;">🔁 مراجعة الأخطاء (${questionsForReview.length})</button>` : ''}
                    <button id="share-btn" class="card-btn btn-summary" style="padding: 0.8rem 1.5rem; order: 1; background: var(--primary-color-gradient); color: white;">📤 شارك نتيجتي</button>
                    <button id="retry-btn" class="next-btn" style="order: 2;">🔁 إعادة الاختبار</button>
                    <a href="index.html" class="card-btn btn-summary back-home" style="padding: 0.8rem 1.5rem; order: 3;">🏠 العودة للرئيسية</a>
                </div>
            `;
            
            const chart = resultsContainer.querySelector('.results-chart');
            if (chart) {
                if (chartPercent >= 90) chart.classList.add('level-excellent');
                else if (chartPercent >= 75) chart.classList.add('level-good');
                else if (chartPercent >= 50) chart.classList.add('level-pass');
                else chart.classList.add('level-fail');
            }
            const adviceBox = resultsContainer.querySelector('.advice-box');
            if(adviceBox && incorrectCountForDisplay === 0) adviceBox.style.display = 'none';

            // ربط الأزرار
            const reviewBtn = $('review-btn');
            if (reviewBtn) {
                reviewBtn.addEventListener('click', () => {
                    startQuiz(questionsForReview); 
                });
            }
            const shareBtn = $('share-btn');
            if (shareBtn) {
                shareBtn.addEventListener('click', () => shareResult(shareText));
            }
            const retry = $('retry-btn');
            if (retry) {
                retry.addEventListener('click', () => {
                    incorrectList = [];
                    startQuiz(allQuestions); 
                });
            }
        }
    }

    // دالة المشاركة
    function shareResult(text) {
        if (navigator.share) {
            navigator.share({
                title: 'نتيجة اختبار Tawal Academy',
                text: text,
                url: window.location.origin + '/quiz-project2/'
            }).catch((error) => {
                 if (error.name !== 'AbortError') { 
                     copyToClipboard(text);
                 }
            });
        } else {
            copyToClipboard(text);
        }
    }

    function copyToClipboard(text) {
         navigator.clipboard.writeText(text).then(() => {
                alert('✅ تم نسخ النتيجة إلى الحافظة! يمكنك الآن مشاركتها.');
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                alert('❌ عذراً، فشل النسخ إلى الحافظة.');
            });
    }

    // ابدأ (اختبار عادي في البداية)
    startQuiz(allQuestions);
}

/*
 * =================================================================================
 * CONTROL_PANEL.JS - Tawal Academy Admin Dashboard
 * Version: 1.8.0 (Full Extended Version)
 * =================================================================================
 * * هذا الملف يدير واجهة لوحة التحكم الخاصة بالمسؤول (Admin).
 * المهام الرئيسية:
 * 1. التحقق من هوية المسؤول (كلمة المرور).
 * 2. عرض الإحصائيات العامة للمنصة.
 * 3. عرض وإدارة جدول الطلاب (تفعيل/تعطيل، حظر أجهزة).
 * 4. عرض سجلات النشاط والدخول.
 * 5. عرض تفاصيل دقيقة لكل طالب في نافذة منبثقة (Modal).
 * * التحديثات الأخيرة:
 * - دعم PostgreSQL (مراعاة حالة الأحرف الصغيرة في البيانات).
 * - إضافة نظام حظر بصمة الجهاز (Fingerprint Blocking).
 * - إضافة زر لفك حظر الجهاز.
 * =================================================================================
 */

// ---------------------------------------------------------------------------------
// 1. الإعدادات والمتغيرات العامة (Configuration & Globals)
// ---------------------------------------------------------------------------------

// رابط الاتصال بالخادم (Backend API URL)
const API_URL = 'https://tawal-backend-production.up.railway.app/api';

// كلمة مرور لوحة التحكم (Admin Password)
const ADMIN_PASSWORD = 'T357891$';

// جلب عناصر واجهة المستخدم (DOM Elements) للنافذة المنبثقة (Modal)
const modal = document.getElementById('student-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalStudentName = document.getElementById('modal-student-name');
const modalStatsContainer = document.getElementById('modal-stats-container');
const modalResultsContainer = document.getElementById('modal-results-container');
const modalActivityContainer = document.getElementById('modal-activity-container'); 


// ---------------------------------------------------------------------------------
// 2. تهيئة الصفحة (Initialization)
// ---------------------------------------------------------------------------------

/**
 * دالة تعمل تلقائياً بمجرد تحميل الصفحة.
 * تقوم بالتحقق من الأمان ثم تحميل البيانات.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // أ. التحقق من كلمة السر أولاً قبل عرض أي شيء
    if (!checkAdminPassword()) {
        // في حالة كلمة السر الخاطئة، نعرض رسالة خطأ ونوقف التحميل
        document.getElementById('dashboard-content').innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h2 style="color: var(--color-incorrect);">⛔ تم رفض الوصول</h2>
                <p class="dashboard-empty-state" style="color: var(--text-color);">
                    كلمة السر التي أدخلتها غير صحيحة. يرجى إعادة تحميل الصفحة والمحاولة مرة أخرى.
                </p>
            </div>`;
        return; // إيقاف التنفيذ
    }

    // ب. إذا كانت كلمة السر صحيحة، ابدأ تحميل لوحة التحكم
    loadDashboard();

    // ج. تفعيل أزرار إغلاق النافذة المنبثقة
    if (modalCloseBtn) {
        modalCloseBtn.onclick = () => closeModal();
    }
    
    // إغلاق النافذة عند الضغط في أي مكان خارجها
    if (modal) {
        window.onclick = (event) => {
            if (event.target == modal) {
                closeModal();
            }
        };
    }
});

/**
 * وظيفة تطلب كلمة السر من المستخدم وتتحقق منها.
 * @returns {boolean} true إذا كانت صحيحة، false إذا كانت خاطئة.
 */
function checkAdminPassword() {
    const enteredPassword = prompt('🔒 الرجاء إدخال كلمة سر الإدارة (Admin Password):');
    
    if (enteredPassword === ADMIN_PASSWORD) {
        return true;
    } else {
        return false;
    }
}

/**
 * الدالة الرئيسية لتحميل وتحديث جميع البيانات في اللوحة.
 */
async function loadDashboard() {
    // استخدام Promise.all لتحميل كل الأقسام في وقت واحد لزيادة السرعة
    try {
        await Promise.all([
            fetchStats(),           // 1. الإحصائيات
            fetchStudents(),        // 2. جدول الطلاب
            fetchActivityLogs(),    // 3. سجل الأنشطة
            fetchLogs()             // 4. سجل الدخول
        ]);
    } catch (error) {
        console.error("حدث خطأ عام أثناء تحميل البيانات:", error);
        alert("⚠️ حدث خطأ في الاتصال بالخادم. تأكد من اتصال الإنترنت.");
    }
}


// ---------------------------------------------------------------------------------
// 3. قسم الإحصائيات العامة (Stats Section)
// ---------------------------------------------------------------------------------

async function fetchStats() {
    const container = document.getElementById('stats-container');
    
    try {
        const response = await fetch(`${API_URL}/admin/stats`);
        const stats = await response.json();

        if (stats.error) throw new Error(stats.error);

        // بناء كود HTML لعرض المربعات الإحصائية
        container.innerHTML = `
            <div class="dashboard-summary-grid">
                <div class="summary-box">
                    <p class="summary-box-label">إجمالي الطلاب المسجلين</p>
                    <p class="summary-box-value">${stats.totalStudents || 0}</p>
                </div>
                
                <div class="summary-box">
                    <p class="summary-box-label">إجمالي الاختبارات المنجزة</p>
                    <p class="summary-box-value">${stats.totalQuizzes || 0}</p>
                </div>
                
                <div class="summary-box">
                    <p class="summary-box-label">متوسط درجات الأكاديمية</p>
                    <p class="summary-box-value ${stats.averageScore >= 50 ? 'correct' : 'incorrect'}">
                        ${stats.averageScore || 0}
                    </p>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Error fetching stats:', err);
        container.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل الإحصائيات العامة.</p>';
    }
}


// ---------------------------------------------------------------------------------
// 4. قسم إدارة الطلاب (Students Management) - الأهم
// ---------------------------------------------------------------------------------

async function fetchStudents() {
    const container = document.getElementById('students-container');
    
    try {
        const response = await fetch(`${API_URL}/admin/students`);
        const students = await response.json();

        if (students.error) throw new Error(students.error);
        
        if (students.length === 0) {
            container.innerHTML = '<p class="dashboard-empty-state">لا يوجد طلاب مسجلون حتى الآن.</p>';
            return;
        }

        // بناء الجدول
        let tableHtml = '<table class="admin-table">';
        tableHtml += `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>الاسم (اضغط للتفاصيل)</th>
                    <th>البريد الإلكتروني</th>
                    <th>تاريخ التسجيل</th>
                    <th style="min-width: 300px;">الإجراءات (الحظر والتحكم)</th>
                </tr>
            </thead>
            <tbody>
        `;

        students.forEach(student => {
            // ملاحظة: PostgreSQL يعيد أسماء الأعمدة بأحرف صغيرة (lowercase)
            const isBlocked = student.isblocked; 
            
            // تحديد لون ونص زر حظر الحساب بناءً على الحالة
            const accountBtnClass = isBlocked ? 'unblock-btn' : 'block-btn';
            const accountBtnText = isBlocked ? '✅ إلغاء حظر الحساب' : '🚫 حظر الحساب';

            // تنسيق التاريخ
            const dateStr = new Date(student.createdat).toLocaleDateString('ar-EG');

            tableHtml += `
                <tr>
                    <td>${student.id}</td>
                    
                    <td class="clickable-student" onclick="showStudentDetails(${student.id}, '${student.name}')" title="اضغط هنا لعرض تقرير كامل عن الطالب">
                        ${student.name}
                    </td>
                    
                    <td>${student.email}</td>
                    <td>${dateStr}</td>
                    
                    <td style="display: flex; gap: 8px; flex-wrap: wrap;">
                        
                        <button class="admin-action-btn ${accountBtnClass}" onclick="toggleBlockStatus(${student.id}, ${isBlocked})">
                            ${accountBtnText}
                        </button>
                        
                        <button class="admin-action-btn block-fp-btn" onclick="blockFingerprint(${student.id}, '${student.name}')" title="منع هذا الجهاز من الدخول نهائياً">
                            💻 حظر الجهاز
                        </button>

                        <button class="admin-action-btn unblock-btn" style="background-color: #27ae60;" onclick="unblockFingerprint(${student.id}, '${student.name}')" title="السماح لهذا الجهاز بالدخول مجدداً">
                            🔓 فك الجهاز
                        </button>

                    </td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table>';
        container.innerHTML = tableHtml;

    } catch (err) {
        console.error('Error fetching students:', err);
        container.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل قائمة الطلاب.</p>';
    }
}


// --- أ. دالة تنفيذ حظر/إلغاء حظر الحساب ---
async function toggleBlockStatus(studentId, isCurrentlyBlocked) {
    const newStatus = !isCurrentlyBlocked;
    const actionText = newStatus ? 'حظر' : 'إلغاء حظر';

    // رسالة تأكيد
    if (!confirm(`هل أنت متأكد أنك تريد ${actionText} حساب هذا الطالب؟\n(سيمنع هذا الإجراء الدخول باستخدام البريد الإلكتروني)`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/students/${studentId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isblocked: newStatus }) // إرسال الحالة الجديدة
        });
        
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        alert(`تم ${actionText} الحساب بنجاح.`);
        
        // إعادة تحميل الجدول لتحديث حالة الزر
        await fetchStudents(); 
    } catch (err) {
        console.error(`فشل ${actionText} الحساب:`, err);
        alert(`حدث خطأ أثناء العملية: ${err.message}`);
    }
}


// --- ب. دالة تنفيذ حظر الجهاز (البصمة) ---
async function blockFingerprint(studentId, studentName) {
    // رسالة تأكيد مشددة
    if (!confirm(`⚠️ تحذير هام:\nهل أنت متأكد أنك تريد حظر "جهاز" الطالب ${studentName} نهائياً؟\n\nهذا الإجراء سيمنع أي شخص من إنشاء حساب جديد أو الدخول من هذا المتصفح/الجهاز، حتى لو استخدم إيميلاً مختلفاً.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/students/${studentId}/block-fingerprint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: `Blocked via admin panel for student ${studentName}` }) 
        });
        
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        alert(data.message || 'تم حظر بصمة الجهاز بنجاح.');
    } catch (err) {
        console.error('فشل حظر البصمة:', err);
        alert(`فشل العملية: ${err.message}\n(ربما لم يتم تسجيل بصمة لهذا الطالب بعد)`);
    }
}

// --- ج. دالة فك حظر الجهاز (Unblock Fingerprint) ---
async function unblockFingerprint(studentId, studentName) {
    if (!confirm(`هل تريد السماح لجهاز الطالب ${studentName} بالدخول مرة أخرى؟`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/students/${studentId}/unblock-fingerprint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        alert(data.message || 'تم فك حظر الجهاز بنجاح.');
    } catch (err) {
        console.error('فشل فك الحظر:', err);
        alert(`فشل العملية: ${err.message}`);
    }
}


// ---------------------------------------------------------------------------------
// 5. قسم سجل الأنشطة (Activity Logs)
// ---------------------------------------------------------------------------------

async function fetchActivityLogs() {
    const container = document.getElementById('activity-logs-container');
    try {
        const response = await fetch(`${API_URL}/admin/activity-logs`);
        const logs = await response.json();

        if (logs.error) throw new Error(logs.error);
        if (logs.length === 0) {
            container.innerHTML = '<p class="dashboard-empty-state">لا توجد أنشطة مسجلة حتى الآن.</p>';
            return;
        }

        let tableHtml = '<table class="admin-table">';
        tableHtml += '<thead><tr><th>الطالب</th><th>النشاط</th><th>المادة / التفاصيل</th><th>الوقت</th></tr></thead>';
        tableHtml += '<tbody>';

        // عرض آخر 20 نشاط فقط لتجنب الطول الزائد
        logs.slice(0, 20).forEach(log => {
            tableHtml += `
                <tr>
                    <td>${log.name}</td>
                    <td>${log.activitytype}</td> <td>${log.subjectname || '—'}</td> <td>${new Date(log.timestamp).toLocaleString('ar-EG')}</td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table>';
        container.innerHTML = tableHtml;

    } catch (err) {
        console.error('Error fetching activity logs:', err);
        container.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل سجل الأنشطة.</p>';
    }
}


// ---------------------------------------------------------------------------------
// 6. قسم سجلات الدخول (Login Logs)
// ---------------------------------------------------------------------------------

async function fetchLogs() {
    const container = document.getElementById('logs-container');
    try {
        const response = await fetch(`${API_URL}/admin/login-logs`);
        const logs = await response.json();

        if (logs.error) throw new Error(logs.error);
        if (logs.length === 0) {
            container.innerHTML = '<p class="dashboard-empty-state">لا توجد سجلات دخول حتى الآن.</p>';
            return;
        }

        let tableHtml = '<table class="admin-table">';
        tableHtml += '<thead><tr><th>اسم الطالب (البريد)</th><th>وقت الدخول</th><th>وقت الخروج</th></tr></thead>';
        tableHtml += '<tbody>';

        logs.slice(0, 20).forEach(log => {
            tableHtml += `
                <tr>
                    <td>${log.name} <span style="font-size:0.8em; color:#888">(${log.email})</span></td>
                    <td>${new Date(log.logintime).toLocaleString('ar-EG')}</td>
                    <td>${log.logouttime ? new Date(log.logouttime).toLocaleString('ar-EG') : '<span style="color:var(--color-correct)">متصل الآن</span>'}</td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table>';
        container.innerHTML = tableHtml;

    } catch (err) {
        console.error('Error fetching logs:', err);
        container.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل سجلات الدخول.</p>';
    }
}


// ---------------------------------------------------------------------------------
// 7. نافذة تفاصيل الطالب (Student Details Modal)
// ---------------------------------------------------------------------------------

/**
 * عرض تفاصيل طالب معين عند الضغط على اسمه
 */
async function showStudentDetails(studentId, studentName) {
    if (!modal) return;

    // فتح النافذة وإظهار رسالة التحميل
    modal.style.display = 'block';
    modalStudentName.innerText = `ملف الطالب: ${studentName}`;
    
    // تصفير المحتوى القديم
    modalStatsContainer.innerHTML = '<p class="dashboard-empty-state">جاري تحميل الإحصائيات...</p>';
    modalResultsContainer.innerHTML = '<p class="dashboard-empty-state">جاري تحميل النتائج...</p>';
    modalActivityContainer.innerHTML = '<p class="dashboard-empty-state">جاري تحميل سجل النشاط...</p>';

    try {
        // جلب جميع البيانات المتعلقة بالطالب بالتوازي
        const [statsResponse, resultsResponse, activityResponse] = await Promise.all([
            fetch(`${API_URL}/students/${studentId}/stats`),
            fetch(`${API_URL}/students/${studentId}/results`),
            fetch(`${API_URL}/admin/activity-logs`) // نجلب الكل ثم نصفي محلياً
        ]);

        const stats = await statsResponse.json();
        const results = await resultsResponse.json();
        const allActivities = await activityResponse.json();

        // --- أ. عرض الإحصائيات ---
        if (stats.error) {
            modalStatsContainer.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل الإحصائيات.</p>';
        } else {
            modalStatsContainer.innerHTML = `
                <div class="dashboard-summary-grid">
                    <div class="summary-box">
                        <p class="summary-box-label">الاختبارات المكتملة</p>
                        <p class="summary-box-value">${stats.totalQuizzes || 0}</p>
                    </div>
                    <div class="summary-box">
                        <p class="summary-box-label">متوسط النقاط</p>
                        <p class="summary-box-value ${stats.averageScore >= 50 ? 'correct' : 'incorrect'}">${stats.averageScore || 0}</p>
                    </div>
                    <div class="summary-box">
                        <p class="summary-box-label">أفضل نتيجة</p>
                        <p class="summary-box-value level-excellent">${stats.bestScore || 0}</p>
                    </div>
                </div>
            `;
        }

        // --- ب. عرض جدول نتائج الاختبارات ---
        if (results.error) {
            modalResultsContainer.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل السجل.</p>';
        } else if (results.length === 0) {
            modalResultsContainer.innerHTML = '<p class="dashboard-empty-state">لم يقم هذا الطالب بإجراء أي اختبارات بعد.</p>';
        } else {
            let tableHtml = '<table class="admin-table">';
            tableHtml += '<thead><tr><th>اسم الاختبار</th><th>النقاط</th><th>الإجابات</th><th>التاريخ</th></tr></thead>';
            tableHtml += '<tbody>';
            results.forEach(att => {
                tableHtml += `
                    <tr>
                        <td>${att.quizname}</td>
                        <td style="color: var(--primary-color); font-weight: bold;">${att.score}</td>
                        <td>${att.correctanswers} / ${att.totalquestions}</td>
                        <td>${new Date(att.completedat).toLocaleString('ar-EG')}</td>
                    </tr>
                `;
            });
            tableHtml += '</tbody></table>';
            modalResultsContainer.innerHTML = tableHtml;
        }
        
        // --- ج. عرض سجل نشاط الطالب (آخر 15 نشاط) ---
        if (allActivities.error) {
             modalActivityContainer.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل الأنشطة.</p>';
        } else {
            // تصفية الأنشطة للطالب الحالي فقط
            const studentActivities = allActivities.filter(log => log.name === studentName).slice(0, 15);
            
            if (studentActivities.length === 0) {
                 modalActivityContainer.innerHTML = '<p class="dashboard-empty-state">لا يوجد نشاط مسجل لهذا الطالب.</p>';
            } else {
                let tableHtml = '<table class="admin-table">';
                tableHtml += '<thead><tr><th>النشاط</th><th>التفاصيل</th><th>الوقت</th></tr></thead>';
                tableHtml += '<tbody>';
                studentActivities.forEach(log => {
                    tableHtml += `
                        <tr>
                            <td>${log.activitytype}</td>
                            <td>${log.subjectname || '—'}</td>
                            <td>${new Date(log.timestamp).toLocaleString('ar-EG')}</td>
                        </tr>
                    `;
                });
                tableHtml += '</tbody></table>';
                modalActivityContainer.innerHTML = tableHtml;
            }
        }

    } catch (err) {
        console.error('Error fetching student details:', err);
        modalStatsContainer.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل الاتصال بالخادم.</p>';
        modalResultsContainer.innerHTML = '';
        modalActivityContainer.innerHTML = '';
    }
}

/**
 * إغلاق النافذة المنبثقة ومسح محتوياتها
 */
function closeModal() {
    if (modal) {
        modal.style.display = 'none';
        modalStudentName.innerText = '...';
        modalStatsContainer.innerHTML = '';
        modalResultsContainer.innerHTML = '';
        modalActivityContainer.innerHTML = ''; 
    }
}

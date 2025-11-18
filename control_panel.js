/*
 * control_panel.js - Tawal Academy (v1.7.0 - Full Original & Enhanced)
 * - عرض الإحصائيات والطلاب والسجلات (النسخة الكاملة).
 * - إدارة حظر الحسابات (Block Account).
 * - إدارة حظر الأجهزة (Block Fingerprint).
 * - متوافق مع PostgreSQL.
 */

// رابط الخادم (تأكد أنه الرابط الصحيح)
const API_URL = 'https://tawal-backend-production.up.railway.app/api';
const ADMIN_PASSWORD = 'T357891$';

// ==========================================
// 1. تعريف عناصر الواجهة (DOM Elements)
// ==========================================
const modal = document.getElementById('student-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalStudentName = document.getElementById('modal-student-name');
const modalStatsContainer = document.getElementById('modal-stats-container');
const modalResultsContainer = document.getElementById('modal-results-container');
const modalActivityContainer = document.getElementById('modal-activity-container'); 

// ==========================================
// 2. التشغيل عند تحميل الصفحة
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من كلمة المرور أولاً
    if (!checkAdminPassword()) {
        document.getElementById('dashboard-content').innerHTML = `
            <p class="dashboard-empty-state" style="color: var(--color-incorrect);">
                كلمة السر خاطئة. تم رفض الوصول.
            </p>`;
        return;
    }

    // إذا كانت كلمة السر صحيحة، ابدأ تحميل البيانات
    loadDashboard();

    // إعدادات إغلاق النافذة المنبثقة
    if (modalCloseBtn) {
        modalCloseBtn.onclick = () => closeModal();
    }
    if (modal) {
        modal.onclick = (event) => {
            if (event.target == modal) {
                closeModal();
            }
        };
    }
});

/**
 * دالة التحقق من كلمة المرور
 */
function checkAdminPassword() {
    const enteredPassword = prompt('الرجاء إدخال كلمة سر الإدارة (Admin Password):');
    return enteredPassword === ADMIN_PASSWORD;
}

/**
 * دالة تحميل جميع بيانات لوحة التحكم
 */
async function loadDashboard() {
    // نقوم بتحميل كل الأقسام في وقت واحد لتسريع العملية
    try {
        await Promise.all([
            fetchStats(),
            fetchStudents(),
            fetchActivityLogs(), 
            fetchLogs()
        ]);
    } catch (error) {
        console.error("حدث خطأ أثناء تحميل البيانات:", error);
        alert("حدث خطأ في الاتصال بالخادم. يرجى التحقق من الإنترنت.");
    }
}

// ==========================================
// 3. قسم الإحصائيات العامة
// ==========================================
async function fetchStats() {
    const container = document.getElementById('stats-container');
    try {
        const response = await fetch(`${API_URL}/admin/stats`);
        const stats = await response.json();

        if (stats.error) throw new Error(stats.error);

        // عرض الإحصائيات في الصناديق
        container.innerHTML = `
            <div class="dashboard-summary-grid">
                <div class="summary-box">
                    <p class="summary-box-label">إجمالي الطلاب</p>
                    <p class="summary-box-value">${stats.totalStudents || 0}</p>
                </div>
                <div class="summary-box">
                    <p class="summary-box-label">إجمالي الاختبارات</p>
                    <p class="summary-box-value">${stats.totalQuizzes || 0}</p>
                </div>
                <div class="summary-box">
                    <p class="summary-box-label">متوسط الدرجات (نقاط)</p>
                    <p class="summary-box-value ${stats.averageScore >= 50 ? 'correct' : 'incorrect'}">
                        ${stats.averageScore || 0}
                    </p>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Error fetching stats:', err);
        container.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل الإحصائيات.</p>';
    }
}

// ==========================================
// 4. قسم إدارة الطلاب (قائمة الطلاب + الحظر)
// ==========================================
async function fetchStudents() {
    const container = document.getElementById('students-container');
    try {
        const response = await fetch(`${API_URL}/admin/students`);
        const students = await response.json();

        if (students.error) throw new Error(students.error);
        if (students.length === 0) {
            container.innerHTML = '<p class="dashboard-empty-state">لم يسجل أي طلاب بعد.</p>';
            return;
        }

        let tableHtml = '<table class="admin-table">';
        tableHtml += `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>الاسم (اضغط للعرض)</th>
                    <th>البريد الإلكتروني</th>
                    <th>تاريخ التسجيل</th>
                    <th>الإجراءات (الحظر)</th>
                </tr>
            </thead>
            <tbody>`;

        students.forEach(student => {
            // تحديد حالة الحظر الحالية لتغيير شكل الزر
            const isBlocked = student.isblocked; 
            const buttonClass = isBlocked ? 'unblock-btn' : 'block-btn';
            const buttonText = isBlocked ? '✅ إلغاء حظر' : '🚫 حظر الحساب';
            
            // تنسيق التاريخ
            const dateStr = new Date(student.createdat).toLocaleDateString('ar-EG');

            tableHtml += `
                <tr>
                    <td>${student.id}</td>
                    <td class="clickable-student" onclick="showStudentDetails(${student.id}, '${student.name}')" title="اضغط لعرض التفاصيل">
                        ${student.name}
                    </td>
                    <td>${student.email}</td>
                    <td>${dateStr}</td>
                    <td style="display: flex; gap: 5px; flex-wrap: wrap;">
                        <button class="admin-action-btn ${buttonClass}" onclick="toggleBlockStatus(${student.id}, ${isBlocked})">
                            ${buttonText}
                        </button>
                        <button class="admin-action-btn block-fp-btn" onclick="blockFingerprint(${student.id}, '${student.name}')" title="منع هذا الجهاز من الدخول نهائياً">
                            💻 حظر الجهاز
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

// --- دالة 1: حظر/إلغاء حظر حساب الطالب ---
async function toggleBlockStatus(studentId, isCurrentlyBlocked) {
    const newStatus = !isCurrentlyBlocked;
    const actionText = newStatus ? 'حظر' : 'إلغاء حظر';

    if (!confirm(`هل أنت متأكد أنك تريد ${actionText} حساب هذا الطالب؟\n(لن يتمكن من الدخول بحسابه)`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/students/${studentId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isblocked: newStatus }) 
        });
        
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        alert(`تم ${actionText} الحساب بنجاح.`);
        await fetchStudents(); // تحديث الجدول فوراً
    } catch (err) {
        console.error(`فشل ${actionText} الحساب:`, err);
        alert(`حدث خطأ أثناء محاولة ${actionText} الحساب. تأكد من اتصال الخادم.`);
    }
}

// --- دالة 2: حظر بصمة الجهاز (Block Fingerprint) ---
async function blockFingerprint(studentId, studentName) {
    if (!confirm(`⚠️ تحذير هام:\nهل أنت متأكد أنك تريد حظر "جهاز" الطالب ${studentName} نهائياً؟\n\nهذا سيمنع أي شخص من إنشاء حساب جديد أو الدخول من هذا المتصفح/الجهاز.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/students/${studentId}/block-fingerprint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: `Blocked via admin panel for student ${studentName}` }) 
        });
        
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        alert(data.message || 'تم حظر بصمة الجهاز بنجاح.');
    } catch (err) {
        console.error('فشل حظر البصمة:', err);
        alert(`فشل العملية: ${err.message}`);
    }
}

// ==========================================
// 5. سجل أحدث الأنشطة
// ==========================================
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
        tableHtml += '<thead><tr><th>الطالب</th><th>النشاط</th><th>المادة</th><th>الوقت</th></tr></thead>';
        tableHtml += '<tbody>';

        // عرض آخر 20 نشاط فقط
        logs.slice(0, 20).forEach(log => {
            tableHtml += `
                <tr>
                    <td>${log.name}</td>
                    <td>${log.activitytype}</td>
                    <td>${log.subjectname || '—'}</td>
                    <td>${new Date(log.timestamp).toLocaleString('ar-EG')}</td>
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

// ==========================================
// 6. سجلات الدخول
// ==========================================
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
        tableHtml += '<thead><tr><th>اسم الطالب</th><th>وقت الدخول</th><th>وقت الخروج</th></tr></thead>';
        tableHtml += '<tbody>';

        logs.slice(0, 20).forEach(log => {
            tableHtml += `
                <tr>
                    <td>${log.name} (${log.email})</td>
                    <td>${new Date(log.logintime).toLocaleString('ar-EG')}</td>
                    <td>${log.logouttime ? new Date(log.logouttime).toLocaleString('ar-EG') : '<i>ما زال متصلاً</i>'}</td>
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

// ==========================================
// 7. نافذة تفاصيل الطالب (Modal)
// ==========================================
async function showStudentDetails(studentId, studentName) {
    if (!modal) return;

    // فتح النافذة وإظهار رسالة التحميل
    modal.style.display = 'block';
    modalStudentName.innerText = `بيانات الطالب: ${studentName}`;
    modalStatsContainer.innerHTML = '<p class="dashboard-empty-state">جاري تحميل الإحصائيات...</p>';
    modalResultsContainer.innerHTML = '<p class="dashboard-empty-state">جاري تحميل النتائج...</p>';
    modalActivityContainer.innerHTML = '<p class="dashboard-empty-state">جاري تحميل الأنشطة...</p>';

    try {
        // جلب 3 أنواع من البيانات في نفس الوقت
        const [statsResponse, resultsResponse, activityResponse] = await Promise.all([
            fetch(`${API_URL}/students/${studentId}/stats`),
            fetch(`${API_URL}/students/${studentId}/results`),
            fetch(`${API_URL}/admin/activity-logs`) 
        ]);

        const stats = await statsResponse.json();
        const results = await resultsResponse.json();
        const allActivities = await activityResponse.json();

        // أ. عرض الإحصائيات
        if (stats.error) {
            modalStatsContainer.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل الإحصائيات.</p>';
        } else {
            modalStatsContainer.innerHTML = `
                <div class="dashboard-summary-grid">
                    <div class="summary-box">
                        <p class="summary-box-label">إجمالي الاختبارات</p>
                        <p class="summary-box-value">${stats.totalQuizzes || 0}</p>
                    </div>
                    <div class="summary-box">
                        <p class="summary-box-label">متوسط النقاط</p>
                        <p class="summary-box-value ${stats.averageScore >= 50 ? 'correct' : 'incorrect'}">${stats.averageScore || 0}</p>
                    </div>
                    <div class="summary-box">
                        <p class="summary-box-label">أفضل نتيجة (نقاط)</p>
                        <p class="summary-box-value level-excellent">${stats.bestScore || 0}</p>
                    </div>
                </div>
            `;
        }

        // ب. عرض جدول النتائج
        if (results.error) {
            modalResultsContainer.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل سجل الاختبارات.</p>';
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
        
        // ج. عرض جدول الأنشطة الخاص بالطالب
        if (allActivities.error) {
             modalActivityContainer.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل سجل الأنشطة.</p>';
        } else {
            // تصفية الأنشطة لتظهر الخاصة بهذا الطالب فقط
            const studentActivities = allActivities.filter(log => log.name === studentName).slice(0, 15);
            
            if (studentActivities.length === 0) {
                 modalActivityContainer.innerHTML = '<p class="dashboard-empty-state">لا توجد أنشطة مسجلة لهذا الطالب.</p>';
            } else {
                let tableHtml = '<table class="admin-table">';
                tableHtml += '<thead><tr><th>النشاط</th><th>المادة</th><th>الوقت</th></tr></thead>';
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

// إغلاق النافذة عند الضغط على الزر أو الخارج
function closeModal() {
    if (modal) {
        modal.style.display = 'none';
        // مسح البيانات القديمة
        modalStudentName.innerText = '...';
        modalStatsContainer.innerHTML = '';
        modalResultsContainer.innerHTML = '';
        modalActivityContainer.innerHTML = ''; 
    }
}

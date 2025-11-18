/*
 * control_panel.js - Tawal Academy (v1.5.0 - Full Features)
 * - عرض الإحصائيات والطلاب والسجلات.
 * - إدارة حظر الحسابات (Block Account).
 * - إدارة حظر الأجهزة (Block Fingerprint).
 * - متوافق مع PostgreSQL (Case Insensitive Keys).
 */

const API_URL = 'https://tawal-backend-production.up.railway.app/api';
const ADMIN_PASSWORD = 'T357891$';

// عناصر DOM
const modal = document.getElementById('student-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalStudentName = document.getElementById('modal-student-name');
const modalStatsContainer = document.getElementById('modal-stats-container');
const modalResultsContainer = document.getElementById('modal-results-container');
const modalActivityContainer = document.getElementById('modal-activity-container'); 

// التشغيل عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    // 1. التحقق من كلمة المرور
    if (!checkAdminPassword()) {
        document.getElementById('dashboard-content').innerHTML = `
            <p class="dashboard-empty-state" style="color: var(--color-incorrect);">
                كلمة السر خاطئة. تم رفض الوصول.
            </p>`;
        return;
    }

    // 2. تحميل البيانات
    loadDashboard();

    // 3. إعدادات النافذة المنبثقة (Modal)
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

function checkAdminPassword() {
    const enteredPassword = prompt('الرجاء إدخال كلمة سر الإدارة (Admin Password):');
    return enteredPassword === ADMIN_PASSWORD;
}

async function loadDashboard() {
    // تحميل كل الأقسام في وقت واحد
    await Promise.all([
        fetchStats(),
        fetchStudents(),
        fetchActivityLogs(), 
        fetchLogs()
    ]);
}

// 1. الإحصائيات العامة
async function fetchStats() {
    const container = document.getElementById('stats-container');
    try {
        const response = await fetch(`${API_URL}/admin/stats`);
        const stats = await response.json();

        if (stats.error) throw new Error(stats.error);

        container.innerHTML = `
            <div class="dashboard-summary-grid">
                <div class="summary-box">
                    <p class="summary-box-label">إجمالي الطلاب</p>
                    <p class="summary-box-value">${stats.totalStudents}</p>
                </div>
                <div class="summary-box">
                    <p class="summary-box-label">إجمالي الاختبارات</p>
                    <p class="summary-box-value">${stats.totalQuizzes}</p>
                </div>
                <div class="summary-box">
                    <p class="summary-box-label">متوسط الدرجات (نقاط)</p>
                    <p class="summary-box-value ${stats.averageScore >= 50 ? 'correct' : 'incorrect'}">
                        ${stats.averageScore}
                    </p>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Error fetching stats:', err);
        container.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل الإحصائيات.</p>';
    }
}

// 2. قائمة الطلاب (مع أزرار الحظر)
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
        tableHtml += '<thead><tr><th>ID</th><th>الاسم</th><th>البريد الإلكتروني</th><th>تاريخ التسجيل</th><th>الإجراءات</th></tr></thead>';
        tableHtml += '<tbody>';

        students.forEach(student => {
            // استخدام أحرف صغيرة لتتوافق مع PostgreSQL
            const isBlocked = student.isblocked; 
            const buttonClass = isBlocked ? 'unblock-btn' : 'block-btn';
            const buttonText = isBlocked ? 'إلغاء حظر' : 'حظر الحساب';

            tableHtml += `
                <tr>
                    <td>${student.id}</td>
                    <td class="clickable-student" onclick="showStudentDetails(${student.id}, '${student.name}')">
                        ${student.name}
                    </td>
                    <td>${student.email}</td>
                    <td>${new Date(student.createdat).toLocaleDateString('ar-EG')}</td>
                    <td style="display: flex; gap: 5px; flex-wrap: wrap;">
                        <button class="admin-action-btn ${buttonClass}" onclick="toggleBlockStatus(${student.id}, ${isBlocked})">
                            ${buttonText}
                        </button>
                        <button class="admin-action-btn block-fp-btn" onclick="blockFingerprint(${student.id}, '${student.name}')">
                            حظر الجهاز
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

// دالة: تبديل حالة حظر الحساب
async function toggleBlockStatus(studentId, isCurrentlyBlocked) {
    const newStatus = !isCurrentlyBlocked;
    const actionText = newStatus ? 'حظر' : 'إلغاء حظر';

    if (!confirm(`هل أنت متأكد أنك تريد ${actionText} هذا الحساب؟`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/students/${studentId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isblocked: newStatus }) // أحرف صغيرة
        });
        
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        alert(`تم ${actionText} الحساب بنجاح.`);
        await fetchStudents(); // تحديث الجدول
    } catch (err) {
        console.error(`فشل ${actionText} الحساب:`, err);
        alert(`حدث خطأ أثناء محاولة ${actionText} الحساب.`);
    }
}

// دالة: حظر بصمة الجهاز
async function blockFingerprint(studentId, studentName) {
    if (!confirm(`هل أنت متأكد أنك تريد حظر آخر جهاز (بصمة) استخدمه الطالب "${studentName}"؟\nهذا الإجراء سيمنع أي حساب جديد من التسجيل من هذا الجهاز نهائياً.`)) {
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
        alert(`حدث خطأ: ${err.message}`);
    }
}

// 3. سجل الأنشطة
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

// 4. سجلات الدخول
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

// 5. تفاصيل الطالب (في النافذة المنبثقة)
async function showStudentDetails(studentId, studentName) {
    if (!modal) return;
    modal.style.display = 'block';
    modalStudentName.innerText = `بيانات الطالب: ${studentName}`;
    modalStatsContainer.innerHTML = '<p class="dashboard-empty-state">جاري تحميل الإحصائيات...</p>';
    modalResultsContainer.innerHTML = '<p class="dashboard-empty-state">جاري تحميل النتائج...</p>';
    modalActivityContainer.innerHTML = '<p class="dashboard-empty-state">جاري تحميل الأنشطة...</p>';

    try {
        const [statsResponse, resultsResponse, activityResponse] = await Promise.all([
            fetch(`${API_URL}/students/${studentId}/stats`),
            fetch(`${API_URL}/students/${studentId}/results`),
            fetch(`${API_URL}/admin/activity-logs`) 
        ]);

        const stats = await statsResponse.json();
        const results = await resultsResponse.json();
        const allActivities = await activityResponse.json();

        // عرض إحصائيات الطالب
        if (stats.error) {
            modalStatsContainer.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل الإحصائيات.</p>';
        } else {
            modalStatsContainer.innerHTML = `
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
            `;
        }

        // عرض نتائج الطالب
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
        
        // عرض أنشطة الطالب
        if (allActivities.error) {
             modalActivityContainer.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل سجل الأنشطة.</p>';
        } else {
            const studentActivities = allActivities.filter(log => log.name === studentName);
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

function closeModal() {
    if (modal) {
        modal.style.display = 'none';
        modalStudentName.innerText = '...';
        modalStatsContainer.innerHTML = '';
        modalResultsContainer.innerHTML = '';
        modalActivityContainer.innerHTML = ''; 
    }
}

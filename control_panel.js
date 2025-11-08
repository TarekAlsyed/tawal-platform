/*
 * control_panel.js - Tawal Academy (v1.1.0 - Student Details Modal)
 * لوحة تحكم الإدارة
 */

// (هام) الرابط الخاص بالخادم الذي قمنا بنشره
const API_URL = 'https://tawal-backend-production.up.railway.app/api';

// (هام) كلمة سر الإدارة
const ADMIN_PASSWORD = 'T357891$';

// (جديد) جلب عناصر النافذة المنبثقة
const modal = document.getElementById('student-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalStudentName = document.getElementById('modal-student-name');
const modalStatsContainer = document.getElementById('modal-stats-container');
const modalResultsContainer = document.getElementById('modal-results-container');


/**
 * دالة رئيسية يتم تشغيلها عند تحميل الصفحة
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. طلب كلمة السر أولاً
    if (!checkAdminPassword()) {
        document.getElementById('dashboard-content').innerHTML = `
            <p class="dashboard-empty-state" style="color: var(--color-incorrect);">
                كلمة السر خاطئة. تم رفض الوصول.
            </p>`;
        return;
    }

    // 2. إذا كانت كلمة السر صحيحة، قم بتحميل البيانات
    loadDashboard();

    // 3. (جديد) ربط أزرار إغلاق النافذة
    if (modalCloseBtn) {
        modalCloseBtn.onclick = () => closeModal();
    }
    if (modal) {
        // إغلاق النافذة عند الضغط خارجها
        modal.onclick = (event) => {
            if (event.target == modal) {
                closeModal();
            }
        };
    }
});

/**
 * طلب كلمة السر وحماية الصفحة
 */
function checkAdminPassword() {
    const enteredPassword = prompt('الرجاء إدخال كلمة سر الإدارة (Admin Password):');
    if (enteredPassword === ADMIN_PASSWORD) {
        return true;
    } else {
        return false;
    }
}

/**
 * تحميل جميع بيانات لوحة التحكم
 */
async function loadDashboard() {
    // جلب الإحصائيات والطلاب والسجلات في نفس الوقت
    await Promise.all([
        fetchStats(),
        fetchStudents(),
        fetchLogs()
    ]);
}

/**
 * 1. جلب الإحصائيات العامة
 */
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

/**
 * 2. جلب قائمة الطلاب (*** تم التعديل ***)
 */
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
        tableHtml += '<thead><tr><th>ID</th><th>الاسم (اضغط للعرض)</th><th>البريد الإلكتروني</th><th>تاريخ التسجيل</th></tr></thead>';
        tableHtml += '<tbody>';

        students.forEach(student => {
            // (تعديل) إضافة دالة onclick لفتح التفاصيل
            tableHtml += `
                <tr>
                    <td>${student.id}</td>
                    <td class="clickable-student" onclick="showStudentDetails(${student.id}, '${student.name}')">
                        ${student.name}
                    </td>
                    <td>${student.email}</td>
                    <td>${new Date(student.createdAt).toLocaleDateString('ar-EG')}</td>
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

/**
 * 3. جلب سجلات الدخول
 */
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

        // عرض آخر 20 سجل فقط
        logs.slice(0, 20).forEach(log => {
            tableHtml += `
                <tr>
                    <td>${log.name} (${log.email})</td>
                    <td>${new Date(log.loginTime).toLocaleString('ar-EG')}</td>
                    <td>${log.logoutTime ? new Date(log.logoutTime).toLocaleString('ar-EG') : '<i>ما زال متصلاً</i>'}</td>
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

/*
 * =====================================
 * (*** جديد: دوال النافذة المنبثقة ***)
 * =====================================
 */

/**
 * إظهار النافذة المنبثقة وتحميل بيانات الطالب
 */
async function showStudentDetails(studentId, studentName) {
    if (!modal) return;

    // 1. فتح النافذة وإظهار التحميل
    modal.style.display = 'block';
    modalStudentName.innerText = `بيانات الطالب: ${studentName}`;
    modalStatsContainer.innerHTML = '<p class="dashboard-empty-state">جاري تحميل الإحصائيات...</p>';
    modalResultsContainer.innerHTML = '<p class="dashboard-empty-state">جاري تحميل النتائج...</p>';

    // 2. جلب البيانات (الإحصائيات والنتائج)
    try {
        const [statsResponse, resultsResponse] = await Promise.all([
            fetch(`${API_URL}/students/${studentId}/stats`),
            fetch(`${API_URL}/students/${studentId}/results`)
        ]);

        const stats = await statsResponse.json();
        const results = await resultsResponse.json();

        // 3. عرض الإحصائيات
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

        // 4. عرض جدول النتائج
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
                        <td>${att.quizName}</td>
                        <td style="color: var(--primary-color); font-weight: bold;">${att.score}</td>
                        <td>${att.correctAnswers} / ${att.totalQuestions}</td>
                        <td>${new Date(att.completedAt).toLocaleString('ar-EG')}</td>
                    </tr>
                `;
            });
            tableHtml += '</tbody></table>';
            modalResultsContainer.innerHTML = tableHtml;
        }

    } catch (err) {
        console.error('Error fetching student details:', err);
        modalStatsContainer.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل الاتصال بالخادم.</p>';
        modalResultsContainer.innerHTML = '';
    }
}

/**
 * إغلاق النافذة المنبثقة
 */
function closeModal() {
    if (modal) {
        modal.style.display = 'none';
        // مسح البيانات القديمة عند الإغلاق
        modalStudentName.innerText = '...';
        modalStatsContainer.innerHTML = '';
        modalResultsContainer.innerHTML = '';
    }
}

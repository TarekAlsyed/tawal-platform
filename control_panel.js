/*
 * control_panel.js - Tawal Academy (v1.0.1 - Password Update)
 * لوحة تحكم الإدارة
 */

// (هام) الرابط الخاص بالخادم الذي قمنا بنشره
const API_URL = 'https://tawal-backend-production.up.railway.app/api';

// (*** تعديل: كلمة السر الجديدة الخاصة بك ***)
const ADMIN_PASSWORD = 'T357891$';

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
 * 2. جلب قائمة الطلاب
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
        tableHtml += '<thead><tr><th>ID</th><th>الاسم</th><th>البريد الإلكتروني</th><th>تاريخ التسجيل</th></tr></thead>';
        tableHtml += '<tbody>';

        students.forEach(student => {
            tableHtml += `
                <tr>
                    <td>${student.id}</td>
                    <td>${student.name}</td>
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

/*
 * control_panel.js - Tawal Academy (v2.1.1 - إصلاح Gemini لمشكلة Lowercase)
 * (تم التعديل ليتوافق مع أسماء الخانات الفعلية القادمة من PostgreSQL)
 */

// (هام) الرابط الخاص بالخادم
const API_URL = 'https://tawal-backend-production.up.railway.app/api';

// (*** جديد: متغير لحفظ المفتاح السري ***)
let ADMIN_API_KEY = null; 

/**
 * (*** جديد: دالة مساعدة لإضافة هيدر المصادقة ***)
 */
function getAuthHeaders() {
    if (!ADMIN_API_KEY) {
        console.error('ADMIN_API_KEY is not set!');
    }
    return {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_API_KEY 
    };
}

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

    // 3. ربط أزرار إغلاق النافذة
    const modal = document.getElementById('student-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
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
 * (*** تعديل: طلب وتخزين المفتاح السري ***)
 */
function checkAdminPassword() {
    // (ملاحظة: هذا ليس آمناً كفاية، الأفضل استخدام صفحة لوجن حقيقية)
    const enteredPassword = prompt('الرجاء إدخال مفتاح الإدارة (Admin Key):');
    if (enteredPassword) { // (لا يمكن التحقق منه هنا، سنفترض أنه صح)
        ADMIN_API_KEY = enteredPassword;
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
        fetchActivityLogs(),
        fetchLogs()
    ]);
}

/**
 * 1. جلب الإحصائيات العامة (*** معدل ***)
 */
async function fetchStats() {
    const container = document.getElementById('stats-container');
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            method: 'GET',
            headers: getAuthHeaders() // (*** تعديل: إضافة المصادقة ***)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const stats = await response.json();

        if (stats.error) throw new Error(stats.error);

        // (*** تعديل Gemini: إصلاح الأسماء إلى lowercase ***)
        container.innerHTML = `
            <div class="dashboard-summary-grid">
                <div class="summary-box">
                    <p class="summary-box-label">إجمالي الطلاب</p>
                    <p class="summary-box-value">${stats.totalstudents}</p>
                </div>
                <div class="summary-box">
                    <p class="summary-box-label">إجمالي الاختبارات</p>
                    <p class="summary-box-value">${stats.totalquizzes}</p>
                </div>
                <div class="summary-box">
                    <p class="summary-box-label">متوسط الدرجات (نقاط)</p>
                    <p class="summary-box-value ${stats.averagescore >= 50 ? 'correct' : 'incorrect'}">
                        ${stats.averagescore}
                    </p>
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Error fetching stats:', err);
        container.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل الإحصائيات. (تأكد من المفتاح السري)</p>';
    }
}

/**
 * 2. جلب قائمة الطلاب (*** معدل ***)
 */
async function fetchStudents() {
    const container = document.getElementById('students-container');
    try {
        const response = await fetch(`${API_URL}/admin/students`, {
            method: 'GET',
            headers: getAuthHeaders() // (*** تعديل: إضافة المصادقة ***)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const students = await response.json();

        if (students.error) throw new Error(students.error);
        if (students.length === 0) {
            container.innerHTML = '<p class="dashboard-empty-state">لم يسجل أي طلاب بعد.</p>';
            return;
        }

        let tableHtml = '<table class="admin-table">';
        tableHtml += '<thead><tr><th>ID</th><th>الاسم (اضغط للعرض)</th><th>البريد الإلكتروني</th><th>تاريخ التسجيل</th><th>إجراء</th></tr></thead>';
        tableHtml += '<tbody>';

        students.forEach(student => {
            // (*** تعديل Gemini: إصلاح الأسماء إلى lowercase ***)
            const isBanned = student.isbanned === 1;
            const banButtonText = isBanned ? 'فك الحظر' : 'حظر';
            const banButtonClass = isBanned ? 'unban-btn' : 'ban-btn';
            
            tableHtml += `
                <tr>
                    <td>${student.id}</td>
                    <td class="clickable-student" onclick="showStudentDetails(${student.id}, '${student.name}')">
                        ${student.name} ${isBanned ? '<span style="color:var(--color-incorrect); font-size: 0.8em;">(محظور)</span>' : ''}
                    </td>
                    <td>${student.email}</td>
                    <td>${new Date(student.createdat).toLocaleDateString('ar-EG')}</td>
                    <td>
                        <button class="${banButtonClass}" onclick="toggleBanStatus(${student.id}, ${isBanned ? 0 : 1})">
                            ${banButtonText}
                        </button>
                    </td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table>';
        container.innerHTML = tableHtml;

    } catch (err) {
        console.error('Error fetching students:', err);
        container.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل قائمة الطلاب. (تأكد من المفتاح السري)</p>';
    }
}


/**
 * 3. جلب سجل الأنشطة العام (*** معدل ***)
 */
async function fetchActivityLogs() {
    const container = document.getElementById('activity-logs-container');
    try {
        const response = await fetch(`${API_URL}/admin/activity-logs`, {
            method: 'GET',
            headers: getAuthHeaders() // (*** تعديل: إضافة المصادقة ***)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
            // (*** تعديل Gemini: إصلاح الأسماء إلى lowercase ***)
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
        container.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل سجل الأنشطة. (تأكد من المفتاح السري)</p>';
    }
}

/**
 * 4. جلب سجلات الدخول (*** معدل ***)
 */
async function fetchLogs() {
    const container = document.getElementById('logs-container');
    try {
        const response = await fetch(`${API_URL}/admin/login-logs`, {
            method: 'GET',
            headers: getAuthHeaders() // (*** تعديل: إضافة المصادقة ***)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const logs = await response.json();

        if (logs.error) throw new Error(logs.error);
        if (logs.length === 0) {
            container.innerHTML = '<p class="dashboard-empty-state">لا توجد سجلات دخول حتى الآن.</p>';
            return;
        }

        let tableHtml = '<table class="admin-table">';
        tableHtml += '<thead><tr><th>اسم الطالب</th><th>وقت الدخول</th><th>وقت الخروج</th><th>IP</th></tr></thead>';
        tableHtml += '<tbody>';

        logs.slice(0, 20).forEach(log => {
            // (*** تعديل Gemini: إصلاح الأسماء إلى lowercase ***)
            tableHtml += `
                <tr>
                    <td>${log.name} (${log.email})</td>
                    <td>${new Date(log.logintime).toLocaleString('ar-EG')}</td>
                    <td>${log.logouttime ? new Date(log.logouttime).toLocaleString('ar-EG') : '<i>ما زال متصلاً</i>'}</td>
                    <td>${log.ip_address || 'N/A'}</td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table>';
        container.innerHTML = tableHtml;

    } catch (err) {
        console.error('Error fetching logs:', err);
        container.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل سجلات الدخول. (تأكد من المفتاح السري)</p>';
    }
}

/*
 * =====================================
 * دوال النافذة المنبثقة (*** معدلة ***)
 * =====================================
 */

/**
 * إظهار النافذة المنبثقة وتحميل بيانات الطالب (*** معدل ***)
 */
async function showStudentDetails(studentId, studentName) {
    const modal = document.getElementById('student-modal');
    if (!modal) return;

    modal.style.display = 'block';
    document.getElementById('modal-student-name').innerText = `بيانات الطالب: ${studentName}`;
    const statsContainer = document.getElementById('modal-stats-container');
    const resultsContainer = document.getElementById('modal-results-container');
    const activityContainer = document.getElementById('modal-activity-container');
    
    statsContainer.innerHTML = '<p class="dashboard-empty-state">جاري تحميل الإحصائيات...</p>';
    resultsContainer.innerHTML = '<p class="dashboard-empty-state">جاري تحميل النتائج...</p>';
    activityContainer.innerHTML = '<p class="dashboard-empty-state">جاري تحميل الأنشطة...</p>';

    try {
        // (*** تعديل: إضافة المصادقة ***)
        const [statsResponse, resultsResponse, activityResponse] = await Promise.all([
            fetch(`${API_URL}/students/${studentId}/stats`), // (ملاحظة: هذا ليس مسار admin، لوحة الطالب لا تحتاج مفتاح)
            fetch(`${API_URL}/students/${studentId}/results`), // (ملاحظة: هذا ليس مسار admin)
            fetch(`${API_URL}/admin/activity-logs`, { headers: getAuthHeaders() }) 
        ]);

        const stats = await statsResponse.json();
        const results = await resultsResponse.json();
        const allActivities = await activityResponse.json();

        // 3. عرض الإحصائيات (*** تعديل Gemini: إصلاح الأسماء إلى lowercase ***)
        if (stats.error) {
            statsContainer.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل الإحصائيات.</p>';
        } else {
            statsContainer.innerHTML = `
                <div class="dashboard-summary-grid">
                    <div class="summary-box">
                        <p class="summary-box-label">إجمالي الاختبارات</p>
                        <p class="summary-box-value">${stats.totalquizzes}</p>
                    </div>
                    <div class="summary-box">
                        <p class="summary-box-label">متوسط النقاط</p>
                        <p class="summary-box-value ${stats.averagescore >= 50 ? 'correct' : 'incorrect'}">${stats.averagescore}</p>
                    </div>
                    <div class="summary-box">
                        <p class="summary-box-label">أفضل نتيجة (نقاط)</p>
                        <p class="summary-box-value level-excellent">${stats.bestscore}</p>
                    </div>
                </div>
            `;
        }

        // 4. عرض جدول النتائج (*** تعديل Gemini: إصلاح الأسماء إلى lowercase ***)
        if (results.error) {
            resultsContainer.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل سجل الاختبارات.</p>';
        } else if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="dashboard-empty-state">لم يقم هذا الطالب بإجراء أي اختبارات بعد.</p>';
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
            resultsContainer.innerHTML = tableHtml;
        }
        
        // 5. عرض جدول الأنشطة (بعد الفلترة) (*** تعديل Gemini: إصلاح الأسماء إلى lowercase ***)
        if (allActivities.error) {
             activityContainer.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل تحميل سجل الأنشطة.</p>';
        } else {
            const studentActivities = allActivities.filter(log => log.name === studentName);
            if (studentActivities.length === 0) {
                 activityContainer.innerHTML = '<p class="dashboard-empty-state">لا توجد أنشطة مسجلة لهذا الطالب.</p>';
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
                activityContainer.innerHTML = tableHtml;
            }
        }

    } catch (err) {
        console.error('Error fetching student details:', err);
        statsContainer.innerHTML = '<p class="dashboard-empty-state" style="color: var(--color-incorrect);">فشل الاتصال بالخادم. (تأكد من المفتاح السري)</p>';
        resultsContainer.innerHTML = '';
        activityContainer.innerHTML = '';
    }
}

/**
 * إغلاق النافذة المنبثقة
 */
function closeModal() {
    const modal = document.getElementById('student-modal');
    if (modal) {
        modal.style.display = 'none';
        // مسح البيانات القديمة عند الإغلاق
        document.getElementById('modal-student-name').innerText = '...';
        document.getElementById('modal-stats-container').innerHTML = '';
        document.getElementById('modal-results-container').innerHTML = '';
        document.getElementById('modal-activity-container').innerHTML = ''; 
    }
}

/**
 * دالة إرسال طلب الحظر (*** معدلة ***)
 */
async function toggleBanStatus(studentId, newStatus) {
    if (!confirm(newStatus === 1 ? 'هل أنت متأكد أنك تريد حظر هذا الطالب (وجهازه والـ IP الخاص به)؟' : 'هل أنت متأكد أنك تريد فك حظر هذا الطالب (وجهازه والـ IP الخاص به)؟')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/ban`, {
            method: 'POST',
            headers: getAuthHeaders(), // (*** تعديل: إضافة المصادقة ***)
            body: JSON.stringify({ studentId: studentId, status: newStatus })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (data.message) {
            alert(data.message);
            loadDashboard(); // إعادة تحميل كل شيء لإظهار التغيير
        } else {
            alert('فشل الإجراء: ' + data.error);
        }
    } catch (err) {
        console.error('Error toggling ban status:', err);
        alert('فشل الاتصال بالخادم. (تأكد من المفتاح السري)');
    }
}

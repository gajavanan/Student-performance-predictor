function switchAnalyticsTab(tab, btn) {
    document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    ['analyticsOverview', 'analyticsStudents', 'analyticsDepartment', 'analyticsML'].forEach(id => {
        document.getElementById(id).style.display = 'none';
    });
    document.getElementById(`analytics${tab.charAt(0).toUpperCase() + tab.slice(1)}`).style.display = 'block';
    if (tab === 'overview') loadAnalyticsOverview();
    if (tab === 'students') loadStudentStats();
    if (tab === 'department') loadDepartmentAnalytics();
    if (tab === 'ml') loadMLAnalytics();
}

async function loadAnalyticsOverview() {
    try {
        const res = await fetch(`${API_URL}/api/analytics/dashboard`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) return;

        if (data.performance_distribution) {
            const labels = Object.keys(data.performance_distribution);
            const values = Object.values(data.performance_distribution);
            createBarChart('analyticsPerfChart', labels, values, 'Students', '#4f46e5');
        }

        // Marks comparison
        const marksRes = await fetch(`${API_URL}/api/analytics/students`, { credentials: 'include' });
        const marksData = await marksRes.json();
        if (marksData.students) {
            const recent = marksData.students.slice(-10);
            createLineChart('analyticsMarksChart', recent.map(s => s.name?.split(' ')[0] || 'N/A'), [
                { label: 'Internal Marks', data: recent.map(s => s.internal_marks || 0), borderColor: '#4f46e5', tension: 0.4 },
                { label: 'Previous Marks', data: recent.map(s => s.previous_marks || 0), borderColor: '#10b981', tension: 0.4 },
            ]);
        }

        // Attendance distribution
        if (marksData.students) {
            const attend = marksData.students.map(s => s.attendance || 0);
            const ranges = ['<75%', '75-85%', '85-95%', '95%+'];
            const counts = [
                attend.filter(a => a < 75).length,
                attend.filter(a => a >= 75 && a < 85).length,
                attend.filter(a => a >= 85 && a < 95).length,
                attend.filter(a => a >= 95).length,
            ];
            createPieChart('analyticsAttendChart', ranges, counts);
        }

        // Department performance
        if (data.departments) {
            const deptNames = Object.keys(data.departments);
            const deptCounts = Object.values(data.departments);
            createBarChart('analyticsDeptChart', deptNames, deptCounts, 'Students', '#06b6d4');
        }

        // Correlation heatmap mock
        const corrCanvas = document.getElementById('analyticsCorrChart');
        if (corrCanvas) {
            corrCanvas.style.background = 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)';
            corrCanvas.style.opacity = '0.3';
        }
    } catch { showToast('Failed to load analytics', 'error'); }
}

async function loadStudentStats() {
    try {
        const res = await fetch(`${API_URL}/api/analytics/students`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.students) return;

        const column = document.getElementById('statColumn')?.value || 'attendance';
        const values = data.students.map(s => s[column] || 0);
        const labels = data.students.map(s => s.name?.split(' ')[0] || 'N/A').slice(0, 20);
        const sliced = values.slice(0, 20);

        createBarChart('studentStatsChart', labels, sliced, column.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), '#4f46e5');

        const container = document.getElementById('statsCards');
        if (container && data.stats) {
            const stat = data.stats[column];
            if (stat) {
                container.innerHTML = `
                    <div class="col-md-3"><div class="stat-card"><div class="stat-label">Mean</div><div class="stat-value">${stat.mean}</div></div></div>
                    <div class="col-md-3"><div class="stat-card"><div class="stat-label">Median</div><div class="stat-value">${stat.median}</div></div></div>
                    <div class="col-md-3"><div class="stat-card"><div class="stat-label">Std Dev</div><div class="stat-value">${stat.std}</div></div></div>
                    <div class="col-md-3"><div class="stat-card"><div class="stat-label">Range</div><div class="stat-value">${stat.min} - ${stat.max}</div></div></div>
                `;
            }
        }
    } catch { showToast('Failed to load student stats', 'error'); }
}

async function loadDepartmentAnalytics() {
    try {
        const res = await fetch(`${API_URL}/api/analytics/department`, { credentials: 'include' });
        const data = await res.json();
        const container = document.getElementById('deptAnalyticsContent');
        if (!container) return;
        if (!data.departments || Object.keys(data.departments).length === 0) {
            container.innerHTML = '<p class="text-muted">No department data available</p>';
            return;
        }
        let html = '<div class="row g-3">';
        Object.entries(data.departments).forEach(([dept, info]) => {
            html += `<div class="col-md-4"><div class="stat-card">
                <div class="stat-label">${dept}</div>
                <div class="d-flex justify-content-between mt-2">
                    <div><small>Students:</small><br><strong>${info.student_count}</strong></div>
                    <div><small>Avg Marks:</small><br><strong>${info.average_marks}</strong></div>
                    <div><small>Attendance:</small><br><strong>${info.average_attendance}%</strong></div>
                </div>
            </div></div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    } catch { showToast('Failed to load department analytics', 'error'); }
}

async function loadMLAnalytics() {
    try {
        const res = await fetch(`${API_URL}/api/analytics/ml`, { credentials: 'include' });
        const data = await res.json();
        const container = document.getElementById('mlAnalyticsContent');
        if (!container) return;
        if (!data.models || data.models.length === 0) {
            container.innerHTML = '<p class="text-muted">No models trained yet. Go to Dashboard > ML Models to train.</p>';
            return;
        }
        let html = '<div class="table-responsive"><table class="data-table"><thead><tr><th>Model</th><th>Accuracy</th><th>Precision</th><th>Recall</th><th>F1</th><th>R²</th><th>Active</th></tr></thead><tbody>';
        data.models.forEach(m => {
            html += `<tr>
                <td><strong>${m.algorithm}</strong></td>
                <td>${m.accuracy || 0}%</td>
                <td>${m.precision || 0}%</td>
                <td>${m.recall || 0}%</td>
                <td>${m.f1_score || 0}%</td>
                <td>${m.r2_score || 0}</td>
                <td>${m.is_active ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-secondary">Inactive</span>'}</td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;
    } catch { showToast('Failed to load ML analytics', 'error'); }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('analytics.html')) loadAnalyticsOverview();
});
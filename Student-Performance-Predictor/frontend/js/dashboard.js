async function loadDashboard() {
    try {
        const res = await fetch(`${API_URL}/api/analytics/dashboard`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) { showToast(data.error || 'Failed to load dashboard', 'error'); return; }

        document.getElementById('totalStudents').textContent = data.total_students || 0;
        document.getElementById('totalPredictions').textContent = data.total_predictions || 0;
        document.getElementById('avgPerformance').textContent = data.average_performance || 0;
        document.getElementById('passPercentage').textContent = (data.pass_percentage || 0) + '%';
        document.getElementById('modelAccuracy').textContent = (data.accuracy || 0) + '%';
        document.getElementById('totalDepartments').textContent = Object.keys(data.departments || {}).length || 0;

        // Charts
        if (data.performance_distribution) {
            const labels = Object.keys(data.performance_distribution);
            const values = Object.values(data.performance_distribution);
            createBarChart('perfDistChart', labels, values, 'Students', '#4f46e5');
        }

        if (data.recent_predictions && data.recent_predictions.length > 0) {
            const preds = data.recent_predictions.slice(-10);
            const labels = preds.map((_, i) => `#${i + 1}`);
            const values = preds.map(p => p.predicted_marks || 0);
            createLineChart('predTrendChart', labels, [{
                label: 'Predicted Marks',
                data: values,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.1)',
                fill: true,
                tension: 0.4
            }]);
        }

        if (data.departments) {
            const labels = Object.keys(data.departments);
            const values = Object.values(data.departments);
            createPieChart('deptChart', labels, values);
        }

        if (data.grade_distribution) {
            const labels = Object.keys(data.grade_distribution);
            const values = Object.values(data.grade_distribution);
            createBarChart('gradeChart', labels, values, 'Students', '#3b82f6');
        }

        // Mock attendance chart
        createBarChart('attendanceChart', ['<75%', '75-85%', '85-95%', '95%+'], [15, 30, 35, 20], 'Students', '#ef4444');

        loadRecentPredictions();

    } catch (e) {
        showToast('Failed to load dashboard', 'error');
    }
}

async function loadRecentPredictions() {
    try {
        const search = document.getElementById('predSearch')?.value || '';
        const res = await fetch(`${API_URL}/api/predictions/history?page=1&per_page=5&search=${search}`, { credentials: 'include' });
        const data = await res.json();
        const tbody = document.getElementById('recentPredictions');
        if (!tbody) return;
        if (!data.predictions || data.predictions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No predictions yet</td></tr>';
            return;
        }
        tbody.innerHTML = data.predictions.map(p => `
            <tr>
                <td><strong>${p.student_name || 'N/A'}</strong><br><small class="text-muted">${p.student_id || ''}</small></td>
                <td>${p.department || '-'}</td>
                <td><strong>${p.predicted_marks || 0}</strong></td>
                <td>${getGradeBadge(p.grade)}</td>
                <td>${getPerformanceBadge(p.performance)}</td>
                <td>${getRiskBadge(p.risk_level)}</td>
                <td>${formatDate(p.created_at)}</td>
            </tr>
        `).join('');
    } catch { /* ignore */ }
}

async function trainModel() {
    const algo = document.getElementById('mlAlgorithm')?.value || '';
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Training...';
    try {
        const res = await fetch(`${API_URL}/api/ml/train`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ algorithm: algo || undefined })
        });
        const data = await res.json();
        const container = document.getElementById('mlResults');
        if (!res.ok) {
            container.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
            showToast(data.error, 'error');
            return;
        }
        let html = '<h6 class="mb-3">Training Results</h6>';
        Object.entries(data.models || {}).forEach(([name, metrics]) => {
            html += `<div class="card mb-2 p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <strong>${name} ${name === data.best_model ? '<span class="badge bg-success ms-2">Best</span>' : ''}</strong>
                    <div>
                        <span class="me-3">R²: ${metrics.r2_score}</span>
                        <span class="me-3">MAE: ${metrics.mae}</span>
                        <span>RMSE: ${metrics.rmse}</span>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
        showToast('Model trained successfully!', 'success');
    } catch (e) {
        showToast('Training failed', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-play me-2"></i>Train Model';
    }
}

async function uploadDataset() {
    const fileInput = document.getElementById('csvFile');
    if (!fileInput || !fileInput.files[0]) { showToast('Please select a CSV file', 'warning'); return; }
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Uploading...';
    try {
        const res = await fetch(`${API_URL}/api/dataset/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const data = await res.json();
        const container = document.getElementById('datasetResults');
        if (!res.ok) {
            container.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
            return;
        }
        let html = `<div class="alert alert-success">Uploaded: ${data.rows} rows, ${data.columns} columns</div>`;
        if (data.issues && data.issues.length) {
            html += '<div class="alert alert-warning"><strong>Issues:</strong><ul>' + data.issues.map(i => `<li>${i}</li>`).join('') + '</ul></div>';
        }
        if (data.preprocessing_summary) {
            html += `<div class="alert alert-info"><strong>Preprocessing:</strong><ul>${data.preprocessing_summary.changes.map(c => `<li>${c}</li>`).join('')}</ul></div>`;
        }
        container.innerHTML = html;
        showToast('Dataset uploaded successfully', 'success');
    } catch (e) {
        showToast('Upload failed', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-upload me-2"></i>Upload & Validate';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboard();
        setInterval(loadDashboard, 60000);
    }
});
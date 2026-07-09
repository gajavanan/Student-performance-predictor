let predPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('prediction.html')) {
        loadPredictionHistory();

        document.getElementById('predictionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner"></span> Predicting...';

            try {
                const payload = {
                    student_id: document.getElementById('predStudentId').value.trim(),
                    student_name: document.getElementById('predStudentName').value.trim(),
                    department: document.getElementById('predDept').value,
                    semester: parseInt(document.getElementById('predSem').value),
                    attendance: parseFloat(document.getElementById('predAttendance').value) || 0,
                    study_hours: parseFloat(document.getElementById('predStudy').value) || 0,
                    assignment_score: parseFloat(document.getElementById('predAssign').value) || 0,
                    internal_marks: parseFloat(document.getElementById('predInternal').value) || 0,
                    previous_marks: parseFloat(document.getElementById('predPrevious').value) || 0,
                    algorithm: document.getElementById('predAlgo').value,
                };

                const res = await fetch(`${API_URL}/api/predictions/predict`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                const data = await res.json();

                if (!res.ok) { showToast(data.error || 'Prediction failed', 'error'); return; }

                const p = data.prediction;
                const container = document.getElementById('resultContainer');
                const resultDiv = document.getElementById('predictionResult');
                container.style.display = 'block';

                let recHtml = p.recommendation ? p.recommendation.split(' ').slice(0, 20).join(' ') : 'Continue current habits.';
                if (recHtml.length > 100) recHtml = recHtml.substring(0, 100) + '...';

                resultDiv.innerHTML = `
                    <div class="prediction-score mb-2">${p.predicted_marks}</div>
                    <div class="mb-3">${getGradeBadge(p.grade)} ${getRiskBadge(p.risk_level)}</div>
                    <div class="mb-2">${getPerformanceBadge(p.performance)}</div>
                    <hr>
                    <p class="small text-muted mb-0">${recHtml}</p>
                `;

                // Show insights
                const insightsContainer = document.getElementById('insightsContainer');
                if (data.insights && data.insights.length > 0) {
                    insightsContainer.innerHTML = data.insights.map(i =>
                        `<div class="alert alert-warning py-2"><i class="fas fa-lightbulb me-2"></i>${i}</div>`
                    ).join('');
                } else {
                    insightsContainer.innerHTML = '';
                }

                showToast('Prediction completed!', 'success');
                loadPredictionHistory();

            } catch (e) {
                showToast('Prediction failed. Check if model is trained.', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-calculator me-2"></i> Predict Performance';
            }
        });
    }
});

async function loadPredictionHistory(page = predPage) {
    predPage = page;
    const search = document.getElementById('predHistSearch')?.value || '';
    const dept = document.getElementById('filterDepartment')?.value || '';
    const perf = document.getElementById('filterPerformance')?.value || '';
    try {
        const url = `${API_URL}/api/predictions/history?page=${page}&per_page=20&search=${search}&department=${dept}&performance=${perf}`;
        const res = await fetch(url, { credentials: 'include' });
        const data = await res.json();
        const tbody = document.getElementById('predHistoryBody');
        const pagination = document.getElementById('predPagination');
        if (!tbody) return;
        if (!data.predictions || data.predictions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No predictions found</td></tr>';
            if (pagination) pagination.innerHTML = '';
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
                <td class="actions">
                    <button class="btn-delete" onclick="deletePrediction('${p.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
        if (pagination) {
            paginate(data.total_pages || 1, data.page, 'predPagination', 'loadPredictionHistory');
        }
    } catch { showToast('Failed to load history', 'error'); }
}

async function deletePrediction(id) {
    if (!confirm('Delete this prediction?')) return;
    try {
        await fetch(`${API_URL}/api/predictions/${id}`, { method: 'DELETE', credentials: 'include' });
        showToast('Prediction deleted', 'success');
        loadPredictionHistory();
    } catch { showToast('Failed to delete', 'error'); }
}

async function exportPredictions() {
    try {
        const res = await fetch(`${API_URL}/api/predictions/export`, { credentials: 'include' });
        const data = await res.json();
        if (!data.predictions) { showToast('No predictions to export', 'warning'); return; }
        let csv = 'Student,Department,Grade,Predicted Marks,Performance,Risk Level,Date\n';
        data.predictions.forEach(p => {
            csv += `"${p.student_name || ''}","${p.department || ''}","${p.grade || ''}",${p.predicted_marks || 0},"${p.performance || ''}","${p.risk_level || ''}","${p.created_at || ''}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `predictions_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Predictions exported', 'success');
    } catch { showToast('Export failed', 'error'); }
}

function paginate(totalPages, current, containerId, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return;
    container.innerHTML += `<button onclick="${callback}(1)" ${current === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    for (let i = Math.max(1, current - 2); i <= Math.min(totalPages, current + 2); i++) {
        container.innerHTML += `<button class="${i === current ? 'active' : ''}" onclick="${callback}(${i})">${i}</button>`;
    }
    container.innerHTML += `<button onclick="${callback}(${totalPages})" ${current === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
}
const API_URL = window.location.origin;
let currentPage = 1;
let charts = {};

function showToast(message, type = 'info') {
    const container = document.getElementById('notifContainer');
    if (!container) return;
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = 'all 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.classList.toggle('active');
}

function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('themeIcon');
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    if (icon) icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

function loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = saved === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function setLoading(btnId, loading, text = 'Loading...') {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> ${text}`;
    } else {
        btn.disabled = false;
        btn.innerHTML = text;
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
}

function getGradeBadge(grade) {
    const colors = { 'A+': 'grade-A', 'A': 'grade-A', 'B+': 'grade-B', 'B': 'grade-B', 'C': 'grade-C', 'D': 'grade-D', 'F': 'grade-F' };
    return `<span class="grade-badge ${colors[grade] || 'grade-C'}">${grade}</span>`;
}

function getRiskBadge(risk) {
    const colors = { 'Low': 'risk-low', 'Medium': 'risk-medium', 'High': 'risk-high' };
    return `<span class="risk-badge ${colors[risk] || 'risk-low'}">${risk}</span>`;
}

function getPerformanceBadge(perf) {
    const colors = { 'Excellent': 'bg-success', 'Good': 'bg-info', 'Average': 'bg-warning text-dark', 'Poor': 'bg-danger' };
    return `<span class="badge ${colors[perf] || 'bg-secondary'}">${perf}</span>`;
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

function showModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function hideModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

function logout() {
    fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' })
        .finally(() => { window.location.href = 'login.html'; });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    checkAuth();
});
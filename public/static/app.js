// VClass Frontend JavaScript - v2.0
// API client, auth helpers, utilities

const API_BASE_URL = window.location.origin + '/api';

// ─── API Client ───────────────────────────────────────────────────────────────
const api = {
  auth: {
    register: async (data) => apiRequest('/auth/register', 'POST', data),
    login: async (email, password) => apiRequest('/auth/login', 'POST', { email, password }),
    logout: async () => apiRequest('/auth/logout', 'POST'),
    refresh: async (refreshToken) => apiRequest('/auth/refresh', 'POST', { refreshToken }),
    me: async () => apiRequest('/auth/me', 'GET')
  },
  content: {
    getCountries: async () => apiRequest('/content/countries', 'GET'),
    getEducationSystems: async (countryId) => apiRequest(`/content/education-systems/${countryId}`, 'GET'),
    getGrades: async (educationSystemId) => apiRequest(`/content/grades/${educationSystemId}`, 'GET'),
    getSubjects: async (gradeId) => apiRequest(`/content/subjects/${gradeId}`, 'GET'),
    getChapters: async (gradeSubjectId) => apiRequest(`/content/chapters/${gradeSubjectId}`, 'GET'),
    getLessons: async (chapterId) => apiRequest(`/content/lessons/${chapterId}`, 'GET'),
    getLesson: async (lessonId) => apiRequest(`/content/lesson/${lessonId}`, 'GET')
  },
  video: {
    getToken: async (lessonId) => apiRequest(`/video/${lessonId}/token`, 'GET'),
    updateProgress: async (lessonId, data) => apiRequest(`/video/${lessonId}/progress`, 'POST', data)
  },
  exercises: {
    getExercises: async (lessonId) => apiRequest(`/exercises/${lessonId}`, 'GET'),
    submitExercise: async (data) => apiRequest('/exercises/submit', 'POST', data),
    getResults: async (lessonId) => apiRequest(`/exercises/results/${lessonId}`, 'GET')
  },
  progress: {
    getDashboard: async () => apiRequest('/progress/dashboard', 'GET'),
    getLessonProgress: async (lessonId) => apiRequest(`/progress/lesson/${lessonId}`, 'GET'),
    updateLessonProgress: async (lessonId, data) => apiRequest(`/progress/lesson/${lessonId}`, 'POST', data),
    getRecommendations: async () => apiRequest('/progress/recommendations', 'GET')
  }
};

// ─── API Request Helper ────────────────────────────────────────────────────────
let _refreshingToken = false;
let _refreshQueue = [];

async function apiRequest(endpoint, method = 'GET', data = null) {
  const token = localStorage.getItem('accessToken');
  const config = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (data && ['POST','PUT','PATCH'].includes(method)) config.body = JSON.stringify(data);

  try {
    const response = await fetch(API_BASE_URL + endpoint, config);
    const result = await response.json();

    // Token expired → try to refresh once
    if (response.status === 401 && token) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) { _doLogout(); return { success: false, error: 'Session expired' }; }

      // Queue parallel requests while refreshing
      if (_refreshingToken) {
        return new Promise(resolve => _refreshQueue.push({ resolve, endpoint, method, data }));
      }
      _refreshingToken = true;

      const refreshResp = await fetch(API_BASE_URL + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      _refreshingToken = false;
      if (refreshResp.ok) {
        const { data: rd } = await refreshResp.json();
        localStorage.setItem('accessToken', rd.accessToken);
        if (rd.refreshToken) localStorage.setItem('refreshToken', rd.refreshToken);
        // Retry queued requests
        _refreshQueue.forEach(q => q.resolve(apiRequest(q.endpoint, q.method, q.data)));
        _refreshQueue = [];
        return apiRequest(endpoint, method, data);
      } else {
        _refreshQueue = [];
        _doLogout();
        return { success: false, error: 'Session expired. Please login again.' };
      }
    }

    return result;
  } catch (error) {
    console.error('API request failed:', error);
    return { success: false, error: 'Network error. Check your connection.' };
  }
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────────
function saveAuth(authData) {
  localStorage.setItem('accessToken', authData.accessToken);
  localStorage.setItem('refreshToken', authData.refreshToken);
  localStorage.setItem('user', JSON.stringify(authData.user));
  localStorage.setItem('authTime', Date.now().toString());
}

function _doLogout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('authTime');
  window.location.href = '/login.html';
}

function logout() {
  api.auth.logout().finally(() => _doLogout());
}

function isAuthenticated() {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  // Decode JWT and check exp client-side
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      // Expired but we still have it — refresh will be triggered by next API call
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) { _doLogout(); return false; }
    }
    return true;
  } catch { return !!token; }
}

function getCurrentUser() {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

// ─── Utility Functions ────────────────────────────────────────────────────────
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Agora';
  if (m < 60) return `Há ${m}min`;
  if (h < 24) return `Há ${h}h`;
  if (d < 7) return `Há ${d}d`;
  return formatDate(dateString);
}

function formatTime(seconds) {
  if (!seconds) return '0min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

// ─── Notification System ──────────────────────────────────────────────────────
let _notifCount = 0;
function showNotification(message, type = 'info', duration = 4000) {
  _notifCount++;
  const id = `notif-${_notifCount}`;
  const colors = {
    success: 'bg-green-500', error: 'bg-red-500',
    warning: 'bg-yellow-500', info: 'bg-blue-500'
  };
  const icons = {
    success: 'fa-check-circle', error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle', info: 'fa-info-circle'
  };
  const top = 16 + (_notifCount - 1) * 70;

  const el = document.createElement('div');
  el.id = id;
  el.className = `fixed right-4 z-[9999] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium flex items-center space-x-3 transition-all duration-300 ${colors[type] || colors.info}`;
  el.style.cssText = `top:${top}px; transform:translateX(420px); max-width:320px;`;
  el.innerHTML = `<i class="fas ${icons[type] || icons.info} flex-shrink-0"></i><span class="flex-1">${message}</span><button onclick="document.getElementById('${id}')?.remove();_notifCount=Math.max(0,_notifCount-1)" class="ml-2 opacity-70 hover:opacity-100"><i class="fas fa-times text-xs"></i></button>`;
  document.body.appendChild(el);

  requestAnimationFrame(() => { el.style.transform = 'translateX(0)'; });
  setTimeout(() => {
    el.style.transform = 'translateX(420px)';
    el.style.opacity = '0';
    setTimeout(() => { el.remove(); _notifCount = Math.max(0, _notifCount - 1); }, 300);
  }, duration);
}

// ─── Loading Overlay ──────────────────────────────────────────────────────────
function showLoading(message = 'Carregando...') {
  hideLoading();
  const el = document.createElement('div');
  el.id = 'loading-overlay';
  el.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-[9998] backdrop-blur-sm';
  el.innerHTML = `<div class="bg-white rounded-2xl p-8 flex flex-col items-center space-y-4 shadow-2xl"><div class="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div><p class="text-gray-700 font-medium text-sm">${message}</p></div>`;
  document.body.appendChild(el);
}

function hideLoading() {
  document.getElementById('loading-overlay')?.remove();
}

// ─── Misc Helpers ─────────────────────────────────────────────────────────────
function updateProgressBar(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = `${Math.min(100, Math.max(0, pct))}%`;
}

function debounce(fn, wait = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

const storage = {
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  get: (k, def = null) => { try { const i = localStorage.getItem(k); return i ? JSON.parse(i) : def; } catch { return def; } },
  remove: (k) => { try { localStorage.removeItem(k); } catch {} },
  clear: () => { try { localStorage.clear(); } catch {} }
};

const analytics = {
  trackPageView: (p) => console.log('[VClass] Page:', p),
  trackEvent: (c, a, l) => console.log('[VClass] Event:', c, a, l),
  trackVideoProgress: (id, pct) => console.log('[VClass] Video:', id, pct + '%')
};

// ─── Global Keyboard Shortcuts ────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // ESC closes modals
  if (e.key === 'Escape') {
    document.querySelectorAll('[id$="-modal"]').forEach(m => {
      if (!m.classList.contains('hidden')) m.classList.add('hidden');
    });
  }
});

// ─── Global Navbar ────────────────────────────────────────────────────────────
function getNavbarHTML(activePage = '') {
  const links = [
    { href: '/dashboard.html', icon: 'fa-home', label: 'Dashboard', key: 'dashboard' },
    { href: '/browse.html', icon: 'fa-book', label: 'Conteúdo', key: 'browse' },
    { href: '/progress.html', icon: 'fa-chart-line', label: 'Progresso', key: 'progress' },
    { href: '/library.html', icon: 'fa-book-open', label: 'Biblioteca', key: 'library' },
    { href: '/achievements.html', icon: 'fa-trophy', label: 'Conquistas', key: 'achievements' },
  ];

  const navLinks = links.map(l => `
    <a href="${l.href}" class="nav-link px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${activePage === l.key ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'}">
      <i class="fas ${l.icon}"></i> ${l.label}
    </a>`).join('');

  return `
  <nav class="vclass-navbar bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm" id="vclass-main-nav">
    <div class="container mx-auto px-4 max-w-7xl">
      <div class="flex items-center justify-between h-16">
        <!-- Logo + Links -->
        <div class="flex items-center space-x-6">
          <a href="/dashboard.html" class="flex items-center space-x-2 flex-shrink-0">
            <div class="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow">
              <i class="fas fa-graduation-cap text-white text-sm"></i>
            </div>
            <span class="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">VClass</span>
          </a>
          <div class="hidden md:flex items-center space-x-1">
            ${navLinks}
          </div>
        </div>

        <!-- Right actions -->
        <div class="flex items-center space-x-2">
          <!-- Search -->
          <a href="/search.html" class="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition hidden md:flex" title="Buscar">
            <i class="fas fa-search text-sm"></i>
          </a>
          <!-- Notifications -->
          <a href="/notifications.html" class="relative p-2 ${activePage === 'notifications' ? 'text-purple-600 bg-purple-50' : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'} rounded-lg transition" title="Notificações">
            <i class="fas fa-bell text-sm"></i>
            <span class="notif-badge absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full hidden"></span>
          </a>
          <!-- User Dropdown -->
          <div class="relative" id="nav-user-menu">
            <button onclick="VClass.toggleNavDropdown()" class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition group" id="nav-user-btn">
              <div id="nav-avatar" class="nav-avatar w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold bg-purple-600 flex-shrink-0">?</div>
              <span id="nav-user-name" class="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate"></span>
              <i class="fas fa-chevron-down text-xs text-gray-400 group-hover:text-gray-600 transition hidden md:block"></i>
            </button>
            <div id="nav-dropdown" class="hidden absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div class="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
                <p id="nav-dropdown-name" class="font-semibold text-gray-900 text-sm truncate"></p>
                <p id="nav-dropdown-email" class="text-xs text-gray-500 truncate"></p>
              </div>
              <div class="py-1">
                <a href="/profile.html" class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition gap-3">
                  <i class="fas fa-user text-purple-500 w-4 text-center"></i> Meu Perfil
                </a>
                <a href="/progress.html" class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition gap-3">
                  <i class="fas fa-chart-line text-blue-500 w-4 text-center"></i> Progresso
                </a>
                <a href="/achievements.html" class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition gap-3">
                  <i class="fas fa-trophy text-yellow-500 w-4 text-center"></i> Conquistas
                </a>
                <a href="/help.html" class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition gap-3">
                  <i class="fas fa-question-circle text-gray-400 w-4 text-center"></i> Ajuda
                </a>
              </div>
              <div class="border-t border-gray-100 py-1" id="nav-creator-section" style="display:none">
                <a href="/creator-dashboard.html" class="flex items-center px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition gap-3">
                  <i class="fas fa-pen-nib text-amber-500 w-4 text-center"></i> Painel do Criador
                </a>
              </div>
              <div class="border-t border-gray-100 py-1">
                <button onclick="VClass.logout()" class="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition gap-3">
                  <i class="fas fa-sign-out-alt w-4 text-center"></i> Sair
                </button>
              </div>
            </div>
          </div>
          <!-- Mobile menu btn -->
          <button onclick="VClass.toggleMobileMenu()" class="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition" id="mobile-menu-btn">
            <i class="fas fa-bars text-sm"></i>
          </button>
        </div>
      </div>
    </div>
    <!-- Mobile menu -->
    <div id="nav-mobile-menu" class="hidden md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
      ${links.map(l => `
      <a href="${l.href}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${activePage === l.key ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-50'}">
        <i class="fas ${l.icon} w-4 text-center text-purple-500"></i> ${l.label}
      </a>`).join('')}
      <div class="border-t border-gray-100 pt-2 mt-2">
        <a href="/notifications.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          <i class="fas fa-bell w-4 text-center text-gray-400"></i> Notificações
        </a>
        <a href="/profile.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
          <i class="fas fa-user w-4 text-center text-gray-400"></i> Perfil
        </a>
        <a href="/help.html" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${activePage === 'help' ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-50'}">
          <i class="fas fa-question-circle w-4 text-center text-gray-400"></i> Ajuda & Suporte
        </a>
        <button onclick="VClass.logout()" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full text-left">
          <i class="fas fa-sign-out-alt w-4 text-center"></i> Sair
        </button>
      </div>
    </div>
  </nav>`;
}

function initNavbar(activePage = '') {
  const placeholder = document.getElementById('navbar-placeholder');
  if (placeholder) {
    placeholder.outerHTML = getNavbarHTML(activePage);
  } else if (!document.getElementById('vclass-main-nav')) {
    document.body.insertAdjacentHTML('afterbegin', getNavbarHTML(activePage));
  }
  _updateNavbarUser();
}

function _updateNavbarUser() {
  const user = getCurrentUser();
  if (!user) return;
  const initials = (user.full_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['bg-purple-600','bg-blue-600','bg-green-600','bg-orange-500','bg-pink-600','bg-indigo-600'];
  const color = colors[initials.charCodeAt(0) % colors.length];

  // Update all avatar elements
  document.querySelectorAll('#nav-avatar, .nav-avatar').forEach(el => {
    el.textContent = initials;
    el.className = el.className.replace(/bg-\w+-\d+/, '') + ' ' + color;
  });
  document.querySelectorAll('#nav-user-name').forEach(el => {
    el.textContent = (user.full_name || '').split(' ')[0];
  });
  document.querySelectorAll('#nav-dropdown-name').forEach(el => {
    el.textContent = user.full_name || '';
  });
  document.querySelectorAll('#nav-dropdown-email').forEach(el => {
    el.textContent = user.email || '';
  });

  // Show creator panel link for teachers and admins
  if (user.role === 'teacher' || user.role === 'admin') {
    document.querySelectorAll('#nav-creator-section').forEach(el => {
      el.style.display = 'block';
    });
  }
  // Show admin panel link for admins
  if (user.role === 'admin') {
    document.querySelectorAll('#nav-admin-section').forEach(el => {
      el.style.display = 'block';
    });
  }
}

function toggleNavDropdown() {
  const d = document.getElementById('nav-dropdown');
  if (d) d.classList.toggle('hidden');
}

function toggleMobileMenu() {
  const m = document.getElementById('nav-mobile-menu');
  if (m) m.classList.toggle('hidden');
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const menu = document.getElementById('nav-user-menu');
  if (menu && !menu.contains(e.target)) {
    document.getElementById('nav-dropdown')?.classList.add('hidden');
  }
});

// ─── Export ───────────────────────────────────────────────────────────────────
window.VClass = {
  api, saveAuth, logout, isAuthenticated, getCurrentUser,
  formatDuration, formatDate, formatRelativeTime, formatTime,
  showNotification, showLoading, hideLoading, updateProgressBar,
  debounce, storage, analytics,
  initNavbar, toggleNavDropdown, toggleMobileMenu
};

console.log('VClass API client v2.0 loaded');

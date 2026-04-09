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

// ─── Export ───────────────────────────────────────────────────────────────────
window.VClass = {
  api, saveAuth, logout, isAuthenticated, getCurrentUser,
  formatDuration, formatDate, formatRelativeTime, formatTime,
  showNotification, showLoading, hideLoading, updateProgressBar,
  debounce, storage, analytics
};

console.log('VClass API client v2.0 loaded');

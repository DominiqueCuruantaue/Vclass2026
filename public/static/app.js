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
    getLesson: async (lessonId) => apiRequest(`/content/lesson/${lessonId}`, 'GET'),
    getRecentLessons: async (limit = 6) => apiRequest(`/content/recent-lessons?limit=${limit}`, 'GET'),
    getTrendingLessons: async (limit = 6) => apiRequest(`/content/trending-lessons?limit=${limit}`, 'GET')
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
    getRecommendations: async () => apiRequest('/progress/recommendations', 'GET'),
    getActivity: async () => apiRequest('/progress/activity', 'GET'),
    getWeekly: async () => apiRequest(`/progress/weekly?tz=${new Date().getTimezoneOffset()}`, 'GET')
  },
  favorites: {
    list:   async () => apiRequest('/favorites', 'GET'),
    get:    async (lessonId) => apiRequest(`/favorites/${lessonId}`, 'GET'),
    toggle: async (lessonId) => apiRequest(`/favorites/${lessonId}`, 'POST'),
    remove: async (lessonId) => apiRequest(`/favorites/${lessonId}`, 'DELETE'),
    count:  async (lessonId) => apiRequest(`/favorites/${lessonId}/count`, 'GET')
  },
  bookmarks: {
    listForLesson: async (lessonId) => apiRequest(`/bookmarks?lesson_id=${lessonId}`, 'GET'),
    listAll: async () => apiRequest('/bookmarks', 'GET'),
    create:  async (data) => apiRequest('/bookmarks', 'POST', data),
    remove:  async (id) => apiRequest(`/bookmarks/${id}`, 'DELETE')
  },
  comments: {
    list:   async (lessonId) => apiRequest(`/comments/lesson/${lessonId}`, 'GET'),
    create: async (lessonId, data) => apiRequest(`/comments/lesson/${lessonId}`, 'POST', data),
    like:   async (id) => apiRequest(`/comments/${id}/like`, 'POST'),
    remove: async (id) => apiRequest(`/comments/${id}`, 'DELETE')
  }
};

// ─── API Request Helper ────────────────────────────────────────────────────────
let _refreshingToken = false;
let _refreshQueue = [];

async function apiRequest(endpoint, method = 'GET', data = null) {
  const token = localStorage.getItem('accessToken');
  const config = {
    method,
    credentials: 'include', // envia o cookie HttpOnly do refresh token automaticamente
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (data && ['POST','PUT','PATCH'].includes(method)) config.body = JSON.stringify(data);

  try {
    const response = await fetch(API_BASE_URL + endpoint, config);
    const result = await response.json();

    // Token expirado → tentar refresh uma vez via cookie HttpOnly
    if (response.status === 401 && token) {
      // Queue parallel requests while refreshing
      if (_refreshingToken) {
        return new Promise(resolve => _refreshQueue.push({ resolve, endpoint, method, data }));
      }
      _refreshingToken = true;

      const refreshResp = await fetch(API_BASE_URL + '/auth/refresh', {
        method: 'POST',
        credentials: 'include', // o cookie HttpOnly é enviado automaticamente
        headers: { 'Content-Type': 'application/json' }
      });

      _refreshingToken = false;
      if (refreshResp.ok) {
        const { data: rd } = await refreshResp.json();
        localStorage.setItem('accessToken', rd.accessToken);
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
    return { success: false, networkError: true, error: 'Network error. Check your connection.' };
  }
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────────
// window.name sobrevive a recarregar/navegar dentro da MESMA aba, mas é sempre
// reposto a "" quando o processo do navegador é reiniciado — mesmo que o Chrome/
// Firefox restaurem as abas, cookies e o localStorage ("Continuar de onde parei").
// Guardamos um marcador aleatório no login e exigimos que ele bata certo com
// window.name em cada carregamento; se não bater, a sessão pertence a um
// navegador/processo anterior e forçamos novo login.
const SESSION_MARKER_KEY = 'vclass_session_marker';

function _armBrowserSessionMarker() {
  const marker = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(SESSION_MARKER_KEY, marker);
  window.name = `vclass:${marker}`;
}

function _isSameBrowserInstance() {
  const marker = localStorage.getItem(SESSION_MARKER_KEY);
  return !!marker && window.name === `vclass:${marker}`;
}

function _clearAuthStorage() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  localStorage.removeItem('authTime');
  localStorage.removeItem(SESSION_MARKER_KEY);
  ['vclass_token','vclass_user','vclass_auth'].forEach(k => localStorage.removeItem(k));
}

function saveAuth(authData) {
  localStorage.setItem('accessToken', authData.accessToken);
  // refreshToken é gerido pelo servidor via cookie HttpOnly — não armazenar aqui
  localStorage.setItem('user', JSON.stringify(authData.user));
  localStorage.setItem('authTime', Date.now().toString());
  _armBrowserSessionMarker();
  endOfflineSession();
}

function _doLogout() {
  _clearAuthStorage();
  window.name = '';
  window.location.replace('/login.html');
}

function logout() {
  // 1. Limpar dados locais IMEDIATAMENTE (não depender do fetch)
  _clearAuthStorage();
  endOfflineSession();
  window.name = '';

  // 2. Notificar o servidor em background (fire-and-forget) — credentials:'include'
  // garante o envio do cookie HttpOnly para o refresh token ser revogado no servidor
  fetch(API_BASE_URL + '/auth/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  }).catch(() => {}); // ignorar erros de rede

  // 3. Redirecionar imediatamente
  window.location.replace('/login.html');
}

function isAuthenticated() {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;
  if (!_isSameBrowserInstance()) {
    // Sessão herdada de uma janela/processo anterior do navegador — inválida.
    _clearAuthStorage();
    return false;
  }
  // Decode JWT and check exp client-side
  // Se expirado, o próximo apiRequest tentará refresh via cookie HttpOnly
  try {
    JSON.parse(atob(token.split('.')[1]));
    return true;
  } catch { return !!token; }
}

function getCurrentUser() {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

// ─── Entrada sem internet (só para as Transferências) ─────────────────────────
// Sem rede o servidor não pode validar a senha. Em cada login com internet
// guardamos neste dispositivo um verificador da senha (PBKDF2-SHA256 com sal
// aleatório — nunca a senha) e os dados básicos da conta. Sem rede, o login
// compara a senha com esse verificador e abre uma "sessão offline" que só dá
// acesso ao que essa conta transferiu (não há token: a API continua fechada).
// A sessão offline vive em sessionStorage — acaba quando a app é fechada.
const OFFLINE_ACCOUNTS_KEY = 'vclass_offline_accounts';
const OFFLINE_SESSION_KEY  = 'vclass_offline_session';
const OFFLINE_KDF_ITERATIONS = 150000;

function _toB64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function _fromB64(s) { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }

async function _deriveOfflineVerifier(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
}

function _readOfflineAccounts() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_ACCOUNTS_KEY)) || {}; } catch { return {}; }
}

async function rememberOfflineLogin(email, password, user) {
  if (!email || !password || !user?.id || !window.crypto?.subtle) return;
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const verifier = await _deriveOfflineVerifier(password, salt, OFFLINE_KDF_ITERATIONS);
    const accounts = _readOfflineAccounts();
    accounts[email.trim().toLowerCase()] = {
      salt: _toB64(salt), verifier: _toB64(verifier), iterations: OFFLINE_KDF_ITERATIONS,
      user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
      saved_at: Date.now()
    };
    localStorage.setItem(OFFLINE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('[VClass] Não foi possível preparar a entrada sem internet:', e);
  }
}

// → { success: true, user } | { success: false, reason: 'unknown' | 'password' | 'unsupported' }
async function offlineLogin(email, password) {
  if (!window.crypto?.subtle) return { success: false, reason: 'unsupported' };
  const account = _readOfflineAccounts()[(email || '').trim().toLowerCase()];
  if (!account) return { success: false, reason: 'unknown' };
  const verifier = await _deriveOfflineVerifier(password, _fromB64(account.salt), account.iterations);
  if (_toB64(verifier) !== account.verifier) return { success: false, reason: 'password' };
  sessionStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(account.user));
  return { success: true, user: account.user };
}

function getOfflineSessionUser() {
  try { return JSON.parse(sessionStorage.getItem(OFFLINE_SESSION_KEY)) || null; } catch { return null; }
}

function endOfflineSession() {
  try { sessionStorage.removeItem(OFFLINE_SESSION_KEY); } catch (e) {}
}

// Conta dona das transferências: a sessão normal ou, sem rede, a sessão offline.
function getTransfersUser() {
  return (isAuthenticated() && getCurrentUser()) || getOfflineSessionUser();
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
  if (_isNativeApp()) return _showSnackbar(message, type, duration);
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

// ─── Offline Banner ───────────────────────────────────────────────────────────
// Mostra um aviso quando a conexão cai, com atalho para os arquivos já
// transferidos (não força navegação — o aluno decide se quer sair da página).
function showOfflineBanner() {
  if (document.getElementById('vclass-offline-banner') || window.location.pathname === '/transfers.html') return;
  const bar = document.createElement('div');
  bar.id = 'vclass-offline-banner';
  bar.className = 'fixed top-0 inset-x-0 z-[60] bg-amber-500 text-white text-sm font-medium flex items-center justify-center gap-3 py-2 px-4 shadow';
  bar.innerHTML = `
    <i class="fas fa-triangle-exclamation"></i>
    <span>Você está offline — algum conteúdo pode não carregar.</span>
    <button onclick="window.location.href='/transfers.html'" class="underline font-semibold">Ver Transferências</button>`;
  document.body.prepend(bar);
}
function hideOfflineBanner() {
  document.getElementById('vclass-offline-banner')?.remove();
}
window.addEventListener('online', hideOfflineBanner);
window.addEventListener('offline', showOfflineBanner);
document.addEventListener('DOMContentLoaded', () => { if (!navigator.onLine) showOfflineBanner(); });

// Service Worker: guarda a aba Transferências e o leitor de lições para
// abrirem sem dados móveis (ver /sw.js). Basta uma visita com ligação.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('[VClass] SW não registado:', err));
  });
}

// ─── Global Navbar ────────────────────────────────────────────────────────────
function getNavbarHTML(activePage = '') {
  // Professor/admin vêem o menu do Painel do Criador em qualquer página partilhada
  // (Perfil, Notificações, Ajuda, etc.) — não o menu de navegação do estudante.
  const user = getCurrentUser();
  const isTeacher = user && (user.role === 'teacher' || user.role === 'admin');

  const links = isTeacher ? [
    { href: '/creator-dashboard.html', icon: 'fa-th-large',   label: 'Visão Geral', key: 'creator-dashboard' },
    { href: '/creator-content.html',   icon: 'fa-layer-group',label: 'Conteúdos',   key: 'creator-content' },
    { href: '/creator-students.html',  icon: 'fa-users',      label: 'Alunos',      key: 'creator-students' },
    { href: '/creator-analytics.html', icon: 'fa-chart-bar',  label: 'Analytics',   key: 'creator-analytics' },
    { href: '/creator-earnings.html',  icon: 'fa-coins',      label: 'Ganhos',      key: 'creator-earnings' },
  ] : [
    { href: '/dashboard.html', icon: 'fa-home', label: 'Dashboard', key: 'dashboard' },
    { href: '/browse.html', icon: 'fa-book', label: 'Conteúdo', key: 'browse' },
    { href: '/progress.html', icon: 'fa-chart-line', label: 'Progresso', key: 'progress' },
    { href: '/library.html', icon: 'fa-book-open', label: 'Biblioteca', key: 'library' },
    { href: '/bookmarks.html', icon: 'fa-bookmark', label: 'Marcadores', key: 'bookmarks' },
    { href: '/transfers.html', icon: 'fa-cloud-download-alt', label: 'Transferências', key: 'transfers' },
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
          <a href="${isTeacher ? '/creator-dashboard.html' : '/dashboard.html'}" class="flex items-center space-x-2 flex-shrink-0">
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
          ${!isTeacher ? `
          <!-- Mudar de Classe -->
          <button onclick="VClass.openClassSwitcher()" class="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition hidden md:flex" title="Mudar de Classe">
            <i class="fas fa-right-left text-sm"></i>
          </button>` : ''}
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
                ${isTeacher ? `
                <a href="/creator-analytics.html" class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition gap-3">
                  <i class="fas fa-chart-bar text-blue-500 w-4 text-center"></i> Analytics
                </a>
                <a href="/creator-earnings.html" class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition gap-3">
                  <i class="fas fa-coins text-yellow-500 w-4 text-center"></i> Ganhos
                </a>` : `
                <a href="/progress.html" class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition gap-3">
                  <i class="fas fa-chart-line text-blue-500 w-4 text-center"></i> Progresso
                </a>
                <a href="/achievements.html" class="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition gap-3">
                  <i class="fas fa-trophy text-yellow-500 w-4 text-center"></i> Conquistas
                </a>`}
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
  _ensureClassSwitchModal();
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

  // Link "Painel do Criador" no dropdown: só para admin — professores já veem o
  // menu do criador directamente no topo da navbar (ver getNavbarHTML), seria redundante.
  if (user.role === 'admin') {
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

// ─── Mudar de Classe/País ────────────────────────────────────────────────────
// Permite ao aluno trocar o país/classe do currículo do próprio perfil sem
// re-registo (até 5 vezes / 365 dias — limite aplicado no servidor, ver
// GET/POST /api/auth/class-switch-status|class-switch em src/routes/auth.ts).
let _csGradesCache = {};
let _csCurrent = { country_code: null, grade_id: null };

function _classSwitchModalHtml() {
  return `
  <div id="class-switch-modal" class="fixed inset-0 z-[80] items-center justify-center bg-black/60 backdrop-blur-sm p-4" style="display:none">
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
      <div class="flex items-center justify-between p-5 border-b border-gray-100">
        <h3 class="text-lg font-bold text-gray-900"><i class="fas fa-right-left text-purple-600 mr-2"></i>Mudar de Classe</h3>
        <button onclick="VClass.closeClassSwitcher()" class="text-gray-400 hover:text-gray-600 transition"><i class="fas fa-times"></i></button>
      </div>
      <div class="p-5 space-y-4">
        <p id="cs-current" class="text-sm text-gray-500"></p>
        <div id="cs-quota" class="text-xs rounded-lg p-3"></div>
        <div id="cs-form">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">País</label>
            <select id="cs-country" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" onchange="VClass._switchLoadGrades()">
              <option value="" disabled selected>Selecione o país</option>
              <option value="mz">🇲🇿 Moçambique</option>
              <option value="ao">🇦🇴 Angola</option>
              <option value="br">🇧🇷 Brasil</option>
              <option value="pt">🇵🇹 Portugal</option>
              <option value="cv">🇨🇻 Cabo Verde</option>
            </select>
          </div>
          <div class="mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Classe / Ano</label>
            <select id="cs-grade" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400" disabled>
              <option value="" disabled selected>Seleccione primeiro o país</option>
            </select>
          </div>
        </div>
        <p id="cs-error" class="text-xs text-red-600 hidden"></p>
      </div>
      <div class="flex gap-3 p-5 border-t border-gray-100">
        <button onclick="VClass.closeClassSwitcher()" class="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Cancelar</button>
        <button id="cs-confirm-btn" onclick="VClass.confirmClassSwitch()" class="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition">Confirmar</button>
      </div>
    </div>
  </div>`;
}

function _ensureClassSwitchModal() {
  if (document.getElementById('class-switch-modal')) return;
  document.body.insertAdjacentHTML('beforeend', _classSwitchModalHtml());
  document.getElementById('class-switch-modal').addEventListener('click', function(e) {
    if (e.target === this) closeClassSwitcher();
  });
}

async function openClassSwitcher() {
  _ensureClassSwitchModal();
  const modal = document.getElementById('class-switch-modal');
  modal.style.display = 'flex';

  document.getElementById('cs-current').textContent = 'A carregar...';
  document.getElementById('cs-quota').textContent = '';
  document.getElementById('cs-quota').className = 'text-xs rounded-lg p-3';
  document.getElementById('cs-error').classList.add('hidden');
  document.getElementById('cs-form').classList.remove('hidden');
  const btn = document.getElementById('cs-confirm-btn');
  btn.disabled = false;
  btn.textContent = 'Confirmar';

  try {
    const res = await apiRequest('/auth/class-switch-status', 'GET');
    if (!res.success) throw new Error(res.error || 'Erro ao carregar estado');

    _csCurrent = { country_code: res.data.country_code || null, grade_id: res.data.grade_id || null };
    document.getElementById('cs-current').innerHTML = _csCurrent.country_code
      ? `Classe actual: <b>${_csCurrent.country_code.toUpperCase()} — ${_csCurrent.grade_id || '—'}</b>`
      : 'Ainda não definiste país/classe.';

    if (res.data.remaining > 0) {
      document.getElementById('cs-quota').className = 'text-xs rounded-lg p-3 bg-purple-50 text-purple-700';
      document.getElementById('cs-quota').textContent = `Tens ${res.data.remaining} de 5 trocas disponíveis nos próximos 365 dias.`;
    } else {
      document.getElementById('cs-quota').className = 'text-xs rounded-lg p-3 bg-red-50 text-red-700';
      const d = res.data.nextAvailableAt ? new Date(res.data.nextAvailableAt).toLocaleDateString('pt') : '';
      document.getElementById('cs-quota').textContent = `Já usaste as 5 trocas permitidas este ano. Próxima disponível em ${d}.`;
      document.getElementById('cs-form').classList.add('hidden');
      btn.disabled = true;
    }

    if (_csCurrent.country_code) {
      document.getElementById('cs-country').value = _csCurrent.country_code;
      await _switchLoadGrades();
      document.getElementById('cs-grade').value = _csCurrent.grade_id || '';
    }
  } catch (e) {
    document.getElementById('cs-current').textContent = '';
    document.getElementById('cs-error').textContent = e.message || 'Erro ao carregar estado';
    document.getElementById('cs-error').classList.remove('hidden');
  }
}

function closeClassSwitcher() {
  const modal = document.getElementById('class-switch-modal');
  if (modal) modal.style.display = 'none';
}

async function _switchLoadGrades() {
  const countryCode = document.getElementById('cs-country').value;
  const gradeSelect = document.getElementById('cs-grade');
  gradeSelect.disabled = true;
  gradeSelect.innerHTML = '<option value="" disabled selected>A carregar...</option>';
  if (!countryCode) return;

  try {
    let grades = _csGradesCache[countryCode];
    if (!grades) {
      const res = await fetch(`/api/curriculum/tree/${countryCode}`);
      const json = await res.json();
      if (!json.success) throw new Error('Erro ao carregar classes');
      grades = [];
      json.data.curriculum.forEach(level => level.grades.forEach(g => grades.push(g)));
      _csGradesCache[countryCode] = grades;
    }
    gradeSelect.innerHTML = '<option value="" disabled selected>Seleccione a classe/ano</option>' +
      grades.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    gradeSelect.disabled = false;
  } catch (e) {
    gradeSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar classes</option>';
  }
}

async function confirmClassSwitch() {
  const countryCode = document.getElementById('cs-country').value;
  const gradeId = document.getElementById('cs-grade').value;
  const errEl = document.getElementById('cs-error');
  errEl.classList.add('hidden');

  if (!countryCode || !gradeId) {
    errEl.textContent = 'Escolhe o país e a classe.';
    errEl.classList.remove('hidden');
    return;
  }
  if (countryCode === _csCurrent.country_code && gradeId === _csCurrent.grade_id) {
    errEl.textContent = 'Já estás nessa classe.';
    errEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('cs-confirm-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

  try {
    const res = await apiRequest('/auth/class-switch', 'POST', { country_code: countryCode, grade_id: gradeId });
    if (!res.success) throw new Error(res.error || 'Erro ao trocar de classe');

    const user = getCurrentUser() || {};
    user.country_code = res.data.country_code;
    user.grade_id = res.data.grade_id;
    localStorage.setItem('user', JSON.stringify(user));

    showNotification('Classe alterada com sucesso!', 'success');
    closeClassSwitcher();
    setTimeout(() => window.location.reload(), 800);
  } catch (e) {
    errEl.textContent = e.message || 'Erro ao trocar de classe';
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Confirmar';
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

// ─── Mobile App Shell (só dentro do APK Capacitor) ─────────────────────────────
// A web continua sempre igual. Dentro da app nativa, substitui a navbar de site
// (menus, CTA de marketing) por um cabeçalho fino + barra de navegação inferior,
// ao estilo das apps móveis modernas (Instagram/WhatsApp). Não requer nenhuma
// alteração por página: corre para qualquer página autenticada (não-staff) que
// já carregue este script, porque esconde a navbar via CSS (`body > nav`) em vez
// de mexer no HTML de cada página.
const _STAFF_ROLES = ['admin', 'support', 'editor', 'country_manager', 'finance', 'moderator'];

const _STUDENT_TABS = [
  { href: '/dashboard.html',     label: 'Início',   icon: 'fa-house' },
  { href: '/browse.html',        label: 'Explorar', icon: 'fa-compass' },
  { href: '/chat.html',          label: 'Chat',      icon: 'fa-comment-dots' },
  { href: '/notifications.html', label: 'Avisos',    icon: 'fa-bell' },
  { href: '/profile.html',       label: 'Perfil',    icon: 'fa-user' }
];
const _TEACHER_TABS = [
  { href: '/creator-dashboard.html', label: 'Visão Geral', icon: 'fa-chart-pie' },
  { href: '/creator-content.html',   label: 'Conteúdos',   icon: 'fa-layer-group' },
  { href: '/creator-students.html',  label: 'Alunos',      icon: 'fa-users' },
  { href: '/creator-analytics.html', label: 'Analytics',   icon: 'fa-chart-bar' },
  { href: '/creator-earnings.html',  label: 'Ganhos',      icon: 'fa-coins' }
];
// Páginas secundárias sem separador próprio — ficam com o separador mais próximo activo.
const _TAB_FALLBACK = {
  '/search.html': '/browse.html', '/library.html': '/browse.html',
  '/chapters.html': '/browse.html', '/bookmarks.html': '/browse.html',
  '/achievements.html': '/profile.html', '/help.html': '/profile.html'
};

function _isNativeApp() {
  return !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
}

function openMobileSheet() { document.getElementById('vc-mobile-sheet')?.classList.add('open'); }
function closeMobileSheet() { document.getElementById('vc-mobile-sheet')?.classList.remove('open'); }

function initMobileAppShell() {
  if (!_isNativeApp() || document.getElementById('vc-app-shell-style')) return;
  const user = getCurrentUser();
  if (!isAuthenticated() || !user || _STAFF_ROLES.includes(user.role)) return;

  const tabs = user.role === 'teacher' ? _TEACHER_TABS : _STUDENT_TABS;
  const path = window.location.pathname;
  const activeHref = tabs.some(t => t.href === path) ? path : _TAB_FALLBACK[path];
  // Páginas como o editor de lições já têm o seu próprio cabeçalho fino
  // (botão voltar + título) — não duplicar com o app-bar genérico, só
  // acrescentar a barra inferior e o espaço para a área segura de baixo.
  const hasOwnHeader = !!document.querySelector('body > header');

  const style = document.createElement('style');
  style.id = 'vc-app-shell-style';
  style.textContent = `
    html.vc-native body > nav:not(.vc-tab-bar) { display: none !important; }
    html.vc-native body { padding-bottom: calc(64px + env(safe-area-inset-bottom)) !important; }
    html.vc-native.vc-has-appbar body { padding-top: calc(52px + env(safe-area-inset-top)) !important; }
    html.vc-native.vc-native-no-appbar body > header { padding-top: env(safe-area-inset-top) !important; }
    .vc-app-bar { position: fixed; top: 0; left: 0; right: 0; max-width: 100vw; z-index: 60; height: calc(52px + env(safe-area-inset-top)); padding-top: env(safe-area-inset-top); background: #fff; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 12px; padding-left: 16px; padding-right: 16px; box-sizing: border-box; }
    .vc-app-bar-avatar { width: 32px; height: 32px; border-radius: 50%; background: #7c3aed; color: #fff; display: flex; align-items: center; justify-content: center; font-size: .72rem; font-weight: 700; flex-shrink: 0; border: none; cursor: pointer; }
    .vc-app-bar-title { flex: 1; min-width: 0; font-weight: 700; font-size: .95rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .vc-app-bar-bell { color: #64748b; font-size: 1.05rem; flex-shrink: 0; }
    .vc-tab-bar { position: fixed; bottom: 0; left: 0; right: 0; max-width: 100vw; z-index: 60; display: flex; background: #fff; border-top: 1px solid #f1f5f9; padding-bottom: env(safe-area-inset-bottom); box-shadow: 0 -2px 12px rgba(0,0,0,.06); }
    .vc-tab { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 8px 0 8px; color: #64748b; text-decoration: none; font-size: .68rem; font-weight: 600; }
    .vc-tab-icon { width: 56px; max-width: 100%; height: 30px; border-radius: 15px; display: flex; align-items: center; justify-content: center; transition: background-color .2s ease; }
    .vc-tab i { font-size: 1.1rem; }
    .vc-tab.active { color: #5b21b6; }
    .vc-tab.active .vc-tab-icon { background: #ede9fe; }
    .vc-sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 70; visibility: hidden; opacity: 0; transition: opacity .25s ease, visibility 0s linear .25s; }
    .vc-sheet-overlay.open { visibility: visible; opacity: 1; transition: opacity .25s ease; }
    .vc-sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 71; background: #fff; border-radius: 28px 28px 0 0; padding: 8px 0 calc(8px + env(safe-area-inset-bottom)); transform: translateY(100%); transition: transform .3s cubic-bezier(.2,.8,.2,1); }
    .vc-sheet::before { content: ''; display: block; width: 32px; height: 4px; border-radius: 2px; background: #cbd5e1; margin: 6px auto 10px; }
    .vc-sheet-overlay.open .vc-sheet { transform: translateY(0); }
    .vc-sheet-item { display: flex; align-items: center; gap: 12px; padding: 14px 20px; font-size: .9rem; font-weight: 600; color: #1e293b; text-decoration: none; cursor: pointer; }
    .vc-sheet-item i { width: 20px; text-align: center; color: #7c3aed; }
    .vc-sheet-item.danger, .vc-sheet-item.danger i { color: #dc2626; }
  `;
  document.head.appendChild(style);
  document.documentElement.classList.add('vc-native', hasOwnHeader ? 'vc-native-no-appbar' : 'vc-has-appbar');

  if (!hasOwnHeader) {
    const initials = (user.full_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const title = (document.title || 'VClass').split(/\s[-—]\s/)[0];

    const appBar = document.createElement('header');
    appBar.className = 'vc-app-bar';
    appBar.innerHTML = `
      <button class="vc-app-bar-avatar" onclick="VClass.openMobileSheet()"></button>
      <span class="vc-app-bar-title"></span>
      <a href="/notifications.html" class="vc-app-bar-bell"><i class="fas fa-bell"></i></a>
    `;
    appBar.querySelector('.vc-app-bar-avatar').textContent = initials;
    appBar.querySelector('.vc-app-bar-title').textContent = title;
    document.body.insertBefore(appBar, document.body.firstChild);
  }

  const tabBar = document.createElement('nav');
  tabBar.className = 'vc-tab-bar';
  tabBar.innerHTML = tabs.map(t => `
    <a href="${t.href}" class="vc-tab ${t.href === activeHref ? 'active' : ''}">
      <span class="vc-tab-icon"><i class="fas ${t.icon}"></i></span><span>${t.label}</span>
    </a>`).join('');
  document.body.appendChild(tabBar);

  const sheetOverlay = document.createElement('div');
  sheetOverlay.className = 'vc-sheet-overlay';
  sheetOverlay.id = 'vc-mobile-sheet';
  sheetOverlay.addEventListener('click', (e) => { if (e.target === sheetOverlay) closeMobileSheet(); });
  sheetOverlay.innerHTML = `
    <div class="vc-sheet">
      <a href="/profile.html" class="vc-sheet-item"><i class="fas fa-user"></i> Perfil</a>
      <a href="/help.html" class="vc-sheet-item"><i class="fas fa-question-circle"></i> Ajuda & Suporte</a>
      <div class="vc-sheet-item danger" onclick="VClass.logout()"><i class="fas fa-sign-out-alt"></i> Sair</div>
    </div>`;
  document.body.appendChild(sheetOverlay);

  // Barra de estado nativa — melhor esforço, nunca deve quebrar a app.
  try {
    const SB = window.Capacitor?.Plugins?.StatusBar;
    if (SB) {
      SB.setOverlaysWebView({ overlay: false }).catch(() => {});
      SB.setStyle({ style: 'LIGHT' }).catch(() => {});
    }
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', initMobileAppShell);

// ─── Experiência nativa (só dentro do APK Capacitor) ───────────────────────────
// O shell acima troca a navegação de site pela de app. Isto trata do resto do
// "toque" Android em TODAS as páginas (login e painéis de staff incluídos):
// splash até a página estar pintada, botão voltar do sistema, ripple Material,
// vibração, barra de progresso ao navegar, puxar para actualizar, snackbars,
// aviso de rede e teclado. Na web não corre nada disto.
const _ROLE_HOME = {
  admin: '/admin-dashboard.html', teacher: '/creator-dashboard.html',
  support: '/support-dashboard.html', editor: '/editor-dashboard.html',
  country_manager: '/country-dashboard.html', finance: '/finance-dashboard.html',
  moderator: '/moderator-dashboard.html'
};
// Ecrãs com gestos próprios (vídeo, chat, editor) ou formulários que um
// recarregar apagaria — sem puxar para actualizar.
const _NO_PULL_REFRESH = ['/lesson.html', '/chat.html', '/creator-lesson-editor.html', '/login.html', '/register.html', '/register-teacher.html'];
const _RIPPLE_TARGETS = 'button, a[href], [role="button"], [onclick], label[for], summary, select, .vc-tab, .vc-sheet-item';

function _nativePlugin(name) { return window.Capacitor?.Plugins?.[name]; }

function _haptic(style = 'LIGHT') {
  try { _nativePlugin('Haptics')?.impact({ style })?.catch?.(() => {}); } catch (e) {}
}

function _homePath() {
  const user = getCurrentUser();
  if (!isAuthenticated() || !user) return getOfflineSessionUser() ? '/transfers.html' : '/login.html';
  return _ROLE_HOME[user.role] || '/dashboard.html';
}

function _isShown(el) {
  const cs = getComputedStyle(el);
  return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0' &&
    cs.pointerEvents !== 'none' && el.getClientRects().length > 0;
}

// Modais das páginas: overlays `fixed inset-0` mostrados/escondidos com `hidden`.
function _openOverlays() {
  return [...document.querySelectorAll('.fixed.inset-0, [role="dialog"], [aria-modal="true"]')]
    .filter(el => !el.closest('.vc-tab-bar, .vc-app-bar, #vc-mobile-sheet') && _isShown(el) &&
      (el.matches('[role="dialog"], [aria-modal="true"]') || (parseInt(getComputedStyle(el).zIndex, 10) || 0) >= 20));
}

function _closeTopOverlay() {
  const sheet = document.getElementById('vc-mobile-sheet');
  if (sheet?.classList.contains('open')) { closeMobileSheet(); return true; }
  // Páginas com UI própria podem tratar o voltar: window.addEventListener('vc:back', e => { …; e.preventDefault(); })
  if (!window.dispatchEvent(new CustomEvent('vc:back', { cancelable: true }))) return true;
  if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return true; }

  const overlays = _openOverlays();
  if (!overlays.length) return false;
  const top = overlays.reduce((a, b) =>
    (parseInt(getComputedStyle(b).zIndex, 10) || 0) >= (parseInt(getComputedStyle(a).zIndex, 10) || 0) ? b : a);
  const closeBtn = top.querySelector('[data-close], [aria-label*="echar" i], [aria-label*="close" i], button[onclick*="close" i], button[onclick*="fechar" i]') ||
    top.querySelector('button .fa-times, button .fa-xmark')?.closest('button');
  if (closeBtn && _isShown(closeBtn)) closeBtn.click();
  else top.classList.add('hidden');
  return true;
}

function _navigate(url, replace = false) {
  _showNavProgress();
  if (replace) window.location.replace(url); else window.location.href = url;
}

// Botão/gesto voltar do Android: fecha o que estiver aberto, depois recua.
// Num separador vai para o separador inicial; no inicial minimiza a app
// (como qualquer app Android), em vez de voltar ao login ou fechar a WebView.
function _onBackButton({ canGoBack }) {
  if (_closeTopOverlay()) return;
  const path = window.location.pathname;
  const home = _homePath();
  if (path === home || path === '/login.html' || path === '/') {
    _nativePlugin('App')?.minimizeApp();
    return;
  }
  const tabs = [...document.querySelectorAll('.vc-tab-bar .vc-tab')].map(a => new URL(a.href).pathname);
  if (tabs.includes(path)) return _navigate(home, true);
  if (canGoBack) window.history.back();
  else _navigate(home, true);
}

let _navProgressTimer = null;
function _showNavProgress() {
  const bar = document.getElementById('vc-nav-progress');
  if (!bar) return;
  bar.classList.add('on');
  clearTimeout(_navProgressTimer);
  // Navegações canceladas (download, ficheiro externo) não deixam a barra presa.
  _navProgressTimer = setTimeout(() => bar.classList.remove('on'), 12000);
}
function _hideNavProgress() {
  clearTimeout(_navProgressTimer);
  document.getElementById('vc-nav-progress')?.classList.remove('on');
}

function _isDarkSurface(el) {
  for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
    const cs = getComputedStyle(node);
    if (cs.backgroundImage.includes('gradient')) return true;
    const m = cs.backgroundColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
    if (m && (m[4] === undefined || parseFloat(m[4]) > 0.5)) {
      return (0.299 * m[1] + 0.587 * m[2] + 0.114 * m[3]) < 140;
    }
  }
  return false;
}

// Ripple Material desenhado numa camada fixa por cima do elemento — não mexe
// no position/overflow do elemento, por isso não pode partir layouts.
function _ripple(el, x, y) {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height || r.width * r.height > window.innerWidth * window.innerHeight * 0.6) return;
  const host = document.createElement('span');
  host.className = 'vc-ripple-host';
  host.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${getComputedStyle(el).borderRadius};`;
  const d = 2 * Math.hypot(Math.max(x - r.left, r.right - x), Math.max(y - r.top, r.bottom - y));
  const dot = document.createElement('span');
  dot.className = 'vc-ripple' + (_isDarkSurface(el) ? ' on-dark' : '');
  dot.style.cssText = `width:${d}px;height:${d}px;left:${x - r.left - d / 2}px;top:${y - r.top - d / 2}px;`;
  host.appendChild(dot);
  document.body.appendChild(host);
  setTimeout(() => host.remove(), 600);
}

function _initRipple() {
  let pending = null;
  const fire = () => { if (pending) { clearTimeout(pending.t); _ripple(pending.el, pending.x, pending.y); pending = null; } };
  const cancel = () => { if (pending) { clearTimeout(pending.t); pending = null; } };
  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const el = e.target.closest(_RIPPLE_TARGETS);
    if (!el || el.disabled || el.closest('[data-no-ripple]')) return;
    cancel();
    // Pequeno atraso: se o dedo começar a fazer scroll, não há ripple (como no Android).
    pending = { el, x: e.clientX, y: e.clientY, t: setTimeout(fire, 80) };
  }, { passive: true });
  document.addEventListener('pointerup', fire, { passive: true });
  document.addEventListener('pointercancel', cancel, { passive: true });
  window.addEventListener('scroll', cancel, { passive: true, capture: true });
}

function _initNavFeedback() {
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const a = e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const raw = a.getAttribute('href');
    if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return;

    if (a.classList.contains('vc-tab')) {
      // Tocar no separador já activo sobe ao topo, como nas apps.
      if (a.classList.contains('active') && url.pathname === window.location.pathname) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      _haptic();
      document.querySelectorAll('.vc-tab.active').forEach(t => t.classList.remove('active'));
      a.classList.add('active');
    }
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
    _showNavProgress();
  });
  document.addEventListener('submit', (e) => {
    if (!e.defaultPrevented && e.target.method?.toLowerCase() !== 'dialog' && !e.target.hasAttribute('onsubmit')) _showNavProgress();
  });
  // Regressar via "voltar" (bfcache) não deixa a barra/separador do ecrã anterior.
  window.addEventListener('pageshow', (e) => { if (e.persisted) { _hideNavProgress(); } });
}

function _initPullToRefresh() {
  if (_NO_PULL_REFRESH.includes(window.location.pathname)) return;
  document.documentElement.classList.add('vc-ptr-page');
  const ind = document.createElement('div');
  ind.className = 'vc-ptr';
  ind.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#7c3aed" stroke-width="2.4" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
  document.body.appendChild(ind);

  const TRIGGER = 72, MAX = 110;
  let startX = 0, startY = null, dist = 0, armed = false;
  const inScrolledArea = (node) => {
    for (; node && node !== document.body; node = node.parentElement) {
      if (node.scrollTop > 0 && /(auto|scroll)/.test(getComputedStyle(node).overflowY)) return true;
    }
    return false;
  };
  const reset = () => {
    ind.style.transition = 'transform .2s ease, opacity .2s ease';
    ind.style.transform = 'translate(-50%, 0) rotate(0deg)';
    ind.style.opacity = '0';
    startY = null; dist = 0; armed = false;
  };

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || window.scrollY > 0 || ind.classList.contains('spinning') ||
        document.documentElement.classList.contains('vc-kb-open') ||
        inScrolledArea(e.target) || _openOverlays().length || document.getElementById('vc-mobile-sheet')?.classList.contains('open')) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    ind.style.transition = 'none';
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (startY === null) return;
    const dy = e.touches[0].clientY - startY;
    const dx = Math.abs(e.touches[0].clientX - startX);
    if (dy <= 0 || window.scrollY > 0 || (dist === 0 && dx > dy)) { if (dist) reset(); else startY = null; return; }
    dist = Math.min(MAX, dy * 0.5);
    ind.style.transform = `translate(-50%, ${dist}px) rotate(${dist * 3}deg)`;
    ind.style.opacity = String(Math.min(1, dist / TRIGGER));
    if (!armed && dist >= TRIGGER) { armed = true; _haptic('MEDIUM'); }
    else if (armed && dist < TRIGGER) armed = false;
  }, { passive: true });

  const end = () => {
    if (startY === null) return;
    if (!armed) return reset();
    ind.style.transition = 'transform .2s ease';
    ind.style.transform = `translate(-50%, ${TRIGGER}px)`;
    ind.classList.add('spinning');
    startY = null;
    window.location.reload();
  };
  document.addEventListener('touchend', end, { passive: true });
  document.addEventListener('touchcancel', reset, { passive: true });
}

// Teclado aberto: a barra inferior sai do caminho, como nas apps.
function _initKeyboardAwareness() {
  const isTextField = (el) => el && (el.isContentEditable || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' ||
    (el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'range', 'color'].includes(el.type)));
  document.addEventListener('focusin', (e) => {
    if (isTextField(e.target)) document.documentElement.classList.add('vc-kb-open');
  });
  document.addEventListener('focusout', () => {
    setTimeout(() => {
      if (!isTextField(document.activeElement)) document.documentElement.classList.remove('vc-kb-open');
    }, 50);
  });
}

let _snackTimer = null;
function _showSnackbar(message, type = 'info', duration = 4000) {
  let el = document.getElementById('vc-snackbar');
  if (!el) {
    el = document.createElement('div');
    el.id = 'vc-snackbar';
    el.setAttribute('role', 'status');
    el.innerHTML = '<span class="vc-snack-dot"></span><span class="vc-snack-text"></span>';
    el.addEventListener('click', () => el.classList.remove('show'));
    (document.body || document.documentElement).appendChild(el);
  }
  el.dataset.type = type;
  el.querySelector('.vc-snack-text').textContent = String(message ?? '');
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  if (type === 'error') _haptic('MEDIUM');
  clearTimeout(_snackTimer);
  if (duration > 0) _snackTimer = setTimeout(() => el.classList.remove('show'), duration);
}

function _hideSplash() {
  // O login com sessão válida redirecciona logo — o splash fica até ao dashboard.
  if (window.location.pathname === '/login.html' && isAuthenticated()) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    try { _nativePlugin('SplashScreen')?.hide()?.catch?.(() => {}); } catch (e) {}
  }));
}

function _injectNativeStyles() {
  if (document.getElementById('vc-native-style')) return;
  const style = document.createElement('style');
  style.id = 'vc-native-style';
  style.textContent = `
    html.vc-app { -webkit-tap-highlight-color: transparent; background: #fff; }
    html.vc-app body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
    html.vc-app :is(input, textarea, select, [contenteditable="true"], .vc-selectable, .vc-selectable *) { -webkit-user-select: text; user-select: text; -webkit-touch-callout: default; }
    html.vc-app :is(a, button, [role="button"], [onclick], label, summary, select) { touch-action: manipulation; }
    html.vc-app img { -webkit-user-drag: none; }
    html.vc-app :focus:not(:focus-visible) { outline: none; }
    html.vc-app ::-webkit-scrollbar { width: 0; height: 0; }
    html.vc-app.vc-ptr-page { overscroll-behavior-y: none; }
    html.vc-app.vc-kb-open .vc-tab-bar { display: none; }
    html.vc-app.vc-kb-open body { padding-bottom: 0 !important; }

    .vc-ripple-host { position: fixed; overflow: hidden; pointer-events: none; z-index: 9998; }
    .vc-ripple { position: absolute; border-radius: 50%; background: rgba(15,23,42,.12); transform: scale(0); animation: vc-ripple .5s cubic-bezier(.2,.6,.3,1) forwards; }
    .vc-ripple.on-dark { background: rgba(255,255,255,.3); }
    @keyframes vc-ripple { 70% { transform: scale(1); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }

    #vc-nav-progress { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 10000; pointer-events: none; overflow: hidden; opacity: 0; transition: opacity .15s ease; }
    #vc-nav-progress.on { opacity: 1; transition-delay: .08s; }
    #vc-nav-progress::before { content: ''; position: absolute; top: 0; bottom: 0; left: -45%; width: 45%; background: #7c3aed; border-radius: 3px; animation: vc-progress 1.1s cubic-bezier(.4,0,.2,1) infinite; }
    @keyframes vc-progress { to { left: 100%; } }

    .vc-ptr { position: fixed; top: -44px; left: 50%; z-index: 65; width: 40px; height: 40px; border-radius: 50%; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.18); display: flex; align-items: center; justify-content: center; opacity: 0; transform: translate(-50%, 0); pointer-events: none; }
    html.vc-has-appbar .vc-ptr { top: 8px; }
    .vc-ptr.spinning svg { animation: vc-spin .7s linear infinite; }
    @keyframes vc-spin { to { transform: rotate(360deg); } }

    #vc-snackbar { position: fixed; left: 12px; right: 12px; bottom: calc(16px + env(safe-area-inset-bottom)); z-index: 10001; display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 12px 16px; border-radius: 8px; background: #1e293b; color: #f1f5f9; font: 500 .875rem/1.35 system-ui, Roboto, sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,.25); transform: translateY(calc(100% + 24px)); opacity: 0; transition: transform .25s cubic-bezier(.2,.8,.2,1), opacity .2s ease; }
    html.vc-native:not(.vc-kb-open) #vc-snackbar { bottom: calc(76px + env(safe-area-inset-bottom)); }
    #vc-snackbar.show { transform: translateY(0); opacity: 1; }
    .vc-snack-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: #60a5fa; }
    #vc-snackbar[data-type="success"] .vc-snack-dot { background: #4ade80; }
    #vc-snackbar[data-type="error"] .vc-snack-dot { background: #f87171; }
    #vc-snackbar[data-type="warning"] .vc-snack-dot { background: #fbbf24; }
  `;
  document.head.appendChild(style);
}

function initNativeExperience() {
  if (!_isNativeApp() || document.documentElement.classList.contains('vc-app')) return;
  document.documentElement.classList.add('vc-app');
  _injectNativeStyles();

  try { _nativePlugin('App')?.addListener('backButton', _onBackButton); } catch (e) {}

  document.addEventListener('contextmenu', (e) => {
    if (!e.target.closest?.('input, textarea, [contenteditable="true"], .vc-selectable')) e.preventDefault();
  });

  window.addEventListener('offline', () => _showSnackbar('Sem ligação à internet', 'warning', 0));
  window.addEventListener('online', () => _showSnackbar('Ligação restabelecida', 'success', 2500));

  const onReady = () => {
    const bar = document.createElement('div');
    bar.id = 'vc-nav-progress';
    document.body.appendChild(bar);
    _initRipple();
    _initNavFeedback();
    _initPullToRefresh();
    _initKeyboardAwareness();
    _hideSplash();
    if (!navigator.onLine) _showSnackbar('Sem ligação à internet', 'warning', 0);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();
}

initNativeExperience();

// Em qualquer ecrã (telemóvel, tablet, PC, app nativa) a página fica presa à
// largura do dispositivo: só scroll vertical. html usa hidden (bloqueia o pan
// lateral do viewport); body usa clip, que não cria contentor de scroll e
// por isso não parte position: sticky.
(function lockHorizontalScroll() {
  if (document.getElementById('vc-no-hscroll-style')) return;
  const style = document.createElement('style');
  style.id = 'vc-no-hscroll-style';
  style.textContent = `
    html { overflow-x: hidden; max-width: 100%; }
    body { overflow-x: hidden; overflow-x: clip; max-width: 100%; overscroll-behavior-x: none; }
    img, video, iframe, embed, object { max-width: 100%; }
  `;
  document.head.appendChild(style);
})();

// ─── Export ───────────────────────────────────────────────────────────────────
window.VClass = {
  api, saveAuth, logout, isAuthenticated, getCurrentUser,
  formatDuration, formatDate, formatRelativeTime, formatTime,
  showNotification, showLoading, hideLoading, updateProgressBar,
  debounce, storage, analytics,
  initNavbar, toggleNavDropdown, toggleMobileMenu,
  openClassSwitcher, closeClassSwitcher, confirmClassSwitch, _switchLoadGrades,
  openMobileSheet, closeMobileSheet,
  rememberOfflineLogin, offlineLogin, getOfflineSessionUser, endOfflineSession, getTransfersUser
};

console.log('VClass API client v2.0 loaded');

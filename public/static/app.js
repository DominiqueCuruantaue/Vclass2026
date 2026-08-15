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
    getRecentLessons: async (limit = 6) => apiRequest(`/content/recent-lessons?limit=${limit}`, 'GET')
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
    getActivity: async () => apiRequest('/progress/activity', 'GET')
  },
  favorites: {
    list:   async () => apiRequest('/favorites', 'GET'),
    get:    async (lessonId) => apiRequest(`/favorites/${lessonId}`, 'GET'),
    toggle: async (lessonId) => apiRequest(`/favorites/${lessonId}`, 'POST'),
    remove: async (lessonId) => apiRequest(`/favorites/${lessonId}`, 'DELETE')
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
    return { success: false, error: 'Network error. Check your connection.' };
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
}

function _doLogout() {
  _clearAuthStorage();
  window.name = '';
  window.location.replace('/login.html');
}

function logout() {
  // 1. Limpar dados locais IMEDIATAMENTE (não depender do fetch)
  _clearAuthStorage();
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

// ─── Export ───────────────────────────────────────────────────────────────────
window.VClass = {
  api, saveAuth, logout, isAuthenticated, getCurrentUser,
  formatDuration, formatDate, formatRelativeTime, formatTime,
  showNotification, showLoading, hideLoading, updateProgressBar,
  debounce, storage, analytics,
  initNavbar, toggleNavDropdown, toggleMobileMenu,
  openClassSwitcher, closeClassSwitcher, confirmClassSwitch, _switchLoadGrades
};

console.log('VClass API client v2.0 loaded');

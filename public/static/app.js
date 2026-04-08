// VClass Frontend JavaScript
// Basic API client and utilities

const API_BASE_URL = window.location.origin + '/api';

// API Client
const api = {
  // Auth endpoints
  auth: {
    register: async (data) => {
      return await apiRequest('/auth/register', 'POST', data);
    },
    login: async (email, password) => {
      return await apiRequest('/auth/login', 'POST', { email, password });
    },
    logout: async () => {
      return await apiRequest('/auth/logout', 'POST');
    },
    refresh: async (refreshToken) => {
      return await apiRequest('/auth/refresh', 'POST', { refreshToken });
    },
    me: async () => {
      return await apiRequest('/auth/me', 'GET');
    }
  },
  
  // Content endpoints
  content: {
    getCountries: async () => {
      return await apiRequest('/content/countries', 'GET');
    },
    getEducationSystems: async (countryId) => {
      return await apiRequest(`/content/education-systems/${countryId}`, 'GET');
    },
    getGrades: async (educationSystemId) => {
      return await apiRequest(`/content/grades/${educationSystemId}`, 'GET');
    },
    getSubjects: async (gradeId) => {
      return await apiRequest(`/content/subjects/${gradeId}`, 'GET');
    },
    getChapters: async (gradeSubjectId) => {
      return await apiRequest(`/content/chapters/${gradeSubjectId}`, 'GET');
    },
    getLessons: async (chapterId) => {
      return await apiRequest(`/content/lessons/${chapterId}`, 'GET');
    },
    getLesson: async (lessonId) => {
      return await apiRequest(`/content/lesson/${lessonId}`, 'GET');
    }
  },
  
  // Video endpoints
  video: {
    getToken: async (lessonId) => {
      return await apiRequest(`/video/${lessonId}/token`, 'GET');
    },
    updateProgress: async (lessonId, data) => {
      return await apiRequest(`/video/${lessonId}/progress`, 'POST', data);
    }
  },
  
  // Exercises endpoints
  exercises: {
    getExercises: async (lessonId) => {
      return await apiRequest(`/exercises/${lessonId}`, 'GET');
    },
    submit: async (data) => {
      return await apiRequest('/exercises/submit', 'POST', data);
    },
    getResults: async (lessonId) => {
      return await apiRequest(`/exercises/results/${lessonId}`, 'GET');
    }
  },
  
  // Progress endpoints
  progress: {
    getDashboard: async () => {
      return await apiRequest('/progress/dashboard', 'GET');
    },
    getLessonProgress: async (lessonId) => {
      return await apiRequest(`/progress/lesson/${lessonId}`, 'GET');
    },
    getSubjectProgress: async (gradeSubjectId) => {
      return await apiRequest(`/progress/subject/${gradeSubjectId}`, 'GET');
    },
    getRecommendations: async () => {
      return await apiRequest('/progress/recommendations', 'GET');
    }
  }
};

// API Request helper
async function apiRequest(endpoint, method = 'GET', data = null) {
  const token = localStorage.getItem('accessToken');
  
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(API_BASE_URL + endpoint, config);
    const result = await response.json();
    
    // Handle token expiration
    if (response.status === 401 && token) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const refreshResult = await fetch(API_BASE_URL + '/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        
        if (refreshResult.ok) {
          const { data } = await refreshResult.json();
          localStorage.setItem('accessToken', data.accessToken);
          // Retry original request
          return apiRequest(endpoint, method, data);
        } else {
          // Refresh failed, logout
          logout();
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.'
    };
  }
}

// Auth helpers
function saveAuth(authData) {
  localStorage.setItem('accessToken', authData.accessToken);
  localStorage.setItem('refreshToken', authData.refreshToken);
  localStorage.setItem('user', JSON.stringify(authData.user));
}

function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/';
}

function isAuthenticated() {
  return !!localStorage.getItem('accessToken');
}

function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

// Utility functions
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `Há ${minutes}min`;
  if (hours < 24) return `Há ${hours}h`;
  if (days < 7) return `Há ${days}d`;
  return formatDate(dateString);
}

function showNotification(message, type = 'info') {
  // Enhanced notification system with animations
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    type === 'warning' ? 'bg-yellow-500' :
    'bg-blue-500'
  } text-white`;
  
  const icon = type === 'success' ? 'fa-check-circle' :
               type === 'error' ? 'fa-exclamation-circle' :
               type === 'warning' ? 'fa-exclamation-triangle' :
               'fa-info-circle';
  
  notification.innerHTML = `
    <div class="flex items-center space-x-2">
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    </div>
  `;
  
  notification.style.transform = 'translateX(400px)';
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(400px)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Loading overlay
function showLoading(message = 'Carregando...') {
  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  overlay.innerHTML = `
    <div class="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
      <i class="fas fa-spinner fa-spin text-4xl text-purple-600"></i>
      <p class="text-gray-700 font-medium">${message}</p>
    </div>
  `;
  document.body.appendChild(overlay);
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// Progress bar for video/content
function updateProgressBar(elementId, percentage) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
  }
}

// Debounce helper for search/input
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Storage helpers
const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Storage get error:', error);
      return defaultValue;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }
};

// Analytics/tracking helpers
const analytics = {
  trackPageView: (pageName) => {
    console.log('Page view:', pageName);
    // Add real analytics here (Google Analytics, etc.)
  },
  trackEvent: (category, action, label) => {
    console.log('Event:', { category, action, label });
    // Add real analytics here
  },
  trackVideoProgress: (lessonId, percentage) => {
    console.log('Video progress:', { lessonId, percentage });
    // Send to backend
  }
};

// Export for use in other files
window.VClass = {
  api,
  saveAuth,
  logout,
  isAuthenticated,
  getCurrentUser,
  formatDuration,
  formatDate,
  formatRelativeTime,
  showNotification,
  showLoading,
  hideLoading,
  updateProgressBar,
  debounce,
  storage,
  analytics
};

console.log('VClass API client loaded');

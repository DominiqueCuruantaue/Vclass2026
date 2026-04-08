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

function showNotification(message, type = 'info') {
  // Simple notification system
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    type === 'warning' ? 'bg-yellow-500' :
    'bg-blue-500'
  } text-white`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Export for use in other files
window.VClass = {
  api,
  saveAuth,
  logout,
  isAuthenticated,
  getCurrentUser,
  formatDuration,
  showNotification
};

console.log('VClass API client loaded');

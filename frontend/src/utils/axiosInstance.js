import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simulated user identity — replace with real auth later
const DEMO_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'student1@campus.lk',
  role: 'USER',
};

const DEMO_ADMIN = {
  id: '33333333-3333-3333-3333-333333333333',
  email: 'admin@campus.lk',
  role: 'ADMIN',
};

const DEMO_TECHNICIAN = {
  id: '22222222-2222-2222-2222-222222222222',
  email: 'tech1@campus.lk',
  role: 'TECHNICIAN',
};

// Get current simulated user from localStorage or default to USER
export function getCurrentUser() {
  const stored = localStorage.getItem('smartcampus_role');
  if (stored === 'ADMIN') return DEMO_ADMIN;
  if (stored === 'TECHNICIAN') return DEMO_TECHNICIAN;
  return DEMO_USER;
}

export function setCurrentRole(role) {
  localStorage.setItem('smartcampus_role', role);
}

// Inject user headers on every request
axiosInstance.interceptors.request.use((config) => {
  const user = getCurrentUser();
  config.headers['X-User-Id'] = user.id;
  config.headers['X-User-Email'] = user.email;
  config.headers['X-User-Role'] = user.role;
  return config;
});

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default axiosInstance;

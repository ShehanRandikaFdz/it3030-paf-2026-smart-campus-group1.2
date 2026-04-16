import axios from 'axios';
import { supabase } from './supabase';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getCurrentUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to parse user from localStorage:', error);
    return null;
  }
}

export function setAuthData(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuthData() {
  localStorage.removeItem('user');
}

export async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error('Google sign-in error:', error.message);
  }
}

export async function signOut() {
  await supabase.auth.signOut();
  clearAuthData();
}

axiosInstance.interceptors.request.use(
  async (config) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    const rawUser = localStorage.getItem('user');
    const user = rawUser ? JSON.parse(rawUser) : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (user?.id) {
      config.headers['X-User-Id'] = user.id;
    }

    if (user?.email) {
      config.headers['X-User-Email'] = user.email;
    }

    if (user?.role) {
      config.headers['X-User-Role'] = user.role;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await signOut();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
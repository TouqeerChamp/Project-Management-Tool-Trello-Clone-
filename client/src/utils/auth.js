// client/src/utils/auth.js
// ✅ Added missing /api prefix to match your Render backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Ensure double slashes are handled
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API Request Failed');
  }
  return response.json();
};

export const setToken = (token) => localStorage.setItem('token', token);
export const getToken = () => localStorage.getItem('token');

// ✅ Fixed: Exporting removeToken clearly
export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// ✅ Fixed: Exporting isAuthenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
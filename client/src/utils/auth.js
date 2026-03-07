// client/src/utils/auth.js
const BACKEND_URL = "https://trello-backend-touqeer.onrender.com/api"; 

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Ensure endpoint starts with / but doesn't double up
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BACKEND_URL}${cleanEndpoint}`; 

  console.log("🚀 SENDING TO:", url);
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }
  return response.json();
};

export const setToken = (token) => localStorage.setItem('token', token);
export const getToken = () => localStorage.getItem('token');

export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => !!localStorage.getItem('token');
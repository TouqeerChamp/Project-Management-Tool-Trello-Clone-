// client/src/utils/auth.js
// ✅ Use the base URL WITHOUT /api at the end here
const BACKEND_URL = "https://trello-backend-touqeer.onrender.com";

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  // ✅ Forcefully adding /api here to ensure it's correct: https://...com/api/login
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BACKEND_URL}/api${cleanEndpoint}`;

  console.log("🛠️ Actual Request URL:", url); // Build logs mein check karne ke liye

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API Error');
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
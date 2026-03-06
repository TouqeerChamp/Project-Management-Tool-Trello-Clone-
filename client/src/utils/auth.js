// client/src/utils/auth.js
// ✅ Hum ne Backend URL ko seedha yahan define kar diya hai taake koi shak na rahe
const BACKEND_URL = "https://trello-backend-touqeer.onrender.com/api";

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Ensure path is correct
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BACKEND_URL}${path}`;

  console.log("🚀 Requesting to:", url); // Debugging ke liye lazmi

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
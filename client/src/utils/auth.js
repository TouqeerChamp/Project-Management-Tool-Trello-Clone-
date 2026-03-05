// Auth utility functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Function to get token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Function to set token in localStorage
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Function to remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Function to check if user is authenticated
export const isAuthenticated = () => {
  const token = getToken();
  return token !== null && token !== undefined && token !== '';
};

// Function to get user data from token (decode JWT)
export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const decodedPayload = atob(payload);
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// API request helper with auth headers
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
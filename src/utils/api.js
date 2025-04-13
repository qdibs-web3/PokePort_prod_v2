import axios from 'axios';

// Improved base URL configuration for both environments
const getBaseUrl = () => {
  // For local development
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  
  // For Vercel deployment - use the current origin
  // This ensures API calls are made to the same domain where the app is hosted
  return '';  // Empty string means requests will be relative to current domain
};

// Create an axios instance with the appropriate base URL
const api = axios.create({
  baseURL: getBaseUrl() ,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token when available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add this logging to debug API calls in production
    if (window.location.hostname !== 'localhost') {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to log errors in production
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (window.location.hostname !== 'localhost') {
      console.error('API Error:', error.response?.status, error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

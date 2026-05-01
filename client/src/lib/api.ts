import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized globally
      if (error.response.status === 401) {
        // e.g., clear token, redirect to login
        localStorage.removeItem('token');
        // Optional: window.location.href = '/login'; 
      }
      
      // Optionally format the error message from the backend
      const message = error.response.data?.message || 'An error occurred';
      console.error(`API Error: ${message}`, error.response.data);
    } else if (error.request) {
      console.error('Network Error: No response received', error.request);
    } else {
      console.error('API Error: Request setup failed', error.message);
    }
    
    return Promise.reject(error);
  }
);


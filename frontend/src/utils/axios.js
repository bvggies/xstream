import axios from 'axios';

// Get API URL from environment variable
let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Ensure API URL ends with /api and has no trailing slash
if (API_URL && !API_URL.endsWith('/api')) {
  // If it ends with just /, remove it and add /api
  if (API_URL.endsWith('/')) {
    API_URL = API_URL.slice(0, -1) + '/api';
  } else {
    API_URL = API_URL + '/api';
  }
}
// Remove trailing slash if present
API_URL = API_URL.replace(/\/$/, '');

console.log('API URL:', API_URL); // Debug log

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const fullUrl = config.baseURL + config.url;
    console.log('Making request to:', fullUrl); // Debug log
    console.log('Method:', config.method?.toUpperCase()); // Debug log
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('Response error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.status,
      responseData: error.response?.data,
      requestURL: error.config?.url,
      baseURL: error.config?.baseURL,
    });
    
    // Network error handling
    if (!error.response) {
      console.error('Network Error - No response from server');
      console.error('Request URL:', error.config?.url);
      console.error('Base URL:', error.config?.baseURL);
      console.error('Full URL would be:', error.config?.baseURL + error.config?.url);
      
      // Show more helpful error message
      const backendUrl = error.config?.baseURL || API_URL;
      error.message = `Cannot connect to server. Please check:
1. Backend is running at: ${backendUrl}
2. CORS is configured correctly
3. Network connection is active
4. Backend URL in .env file is correct`;
    }

    const originalRequest = error.config;

    // Only try to refresh token for 401 errors, and don't retry if it's already a refresh request
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        await axiosInstance.post('/auth/refresh');
        // Retry original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear retry flag and let the error propagate
        originalRequest._retry = false;
        // Don't redirect here - let the component handle it
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

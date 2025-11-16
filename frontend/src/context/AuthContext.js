import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '../utils/axios';
import { initSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axiosInstance.get('/auth/me');
      if (response.data.user) {
        setUser(response.data.user);
        // Initialize socket if user is authenticated
        initSocket();
      } else {
        setUser(null);
      }
    } catch (error) {
      // If /auth/me fails, try to refresh token first
      if (error.response?.status === 401) {
        try {
          // Try to refresh the token
          await axiosInstance.post('/auth/refresh');
          // Retry getting user info
          const retryResponse = await axiosInstance.get('/auth/me');
          if (retryResponse.data.user) {
            setUser(retryResponse.data.user);
            initSocket();
          } else {
            setUser(null);
          }
        } catch (refreshError) {
          // Refresh failed, user is not authenticated - this is normal for unauthenticated users
          console.log('User not authenticated (this is normal for public pages)');
          setUser(null);
        }
      } else {
        // Other errors - user is not authenticated - this is normal for unauthenticated users
        console.log('Auth check failed (normal for public pages):', error.message);
        setUser(null);
      }
    } finally {
      // Always set loading to false after checkAuth completes
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      const response = await axiosInstance.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      if (response.data.user) {
        setUser(response.data.user);
        setLoading(false);
        initSocket();
        return { 
          success: true, 
          user: response.data.user,
          redirectTo: response.data.redirectTo || (response.data.user.role === 'ADMIN' ? '/admin' : '/dashboard')
        };
      } else {
        setLoading(false);
        return {
          success: false,
          error: 'Login failed: No user data received',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setLoading(false);
      
      // Extract more specific error message
      let errorMessage = 'Login failed';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.error || error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Cannot connect to server. Please check your connection and try again.';
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axiosInstance.post('/auth/register', userData);
      setUser(response.data.user);
      setLoading(false); // Ensure loading is false after successful registration
      initSocket();
      return { 
        success: true, 
        user: response.data.user,
        redirectTo: response.data.user.role === 'ADMIN' ? '/admin' : '/dashboard'
      };
    } catch (error) {
      console.error('Registration error:', error);
      setLoading(false); // Ensure loading is false even on error
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.errors?.[0]?.msg
        || error.message 
        || 'Registration failed';
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      disconnectSocket();
    }
  };

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


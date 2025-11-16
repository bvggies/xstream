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
          // Refresh failed, user is not authenticated
          console.log('Auth check failed:', refreshError);
          setUser(null);
        }
      } else {
        // Other errors - user is not authenticated
        console.log('Auth check failed:', error);
        setUser(null);
      }
    } finally {
      // Always set loading to false after checkAuth completes
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      setUser(response.data.user);
      setLoading(false); // Ensure loading is false after successful login
      initSocket();
      return { 
        success: true, 
        user: response.data.user,
        redirectTo: response.data.redirectTo || (response.data.user.role === 'ADMIN' ? '/admin' : '/dashboard')
      };
    } catch (error) {
      setLoading(false); // Ensure loading is false even on error
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
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


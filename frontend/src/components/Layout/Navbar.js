import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings, FiHome, FiBell, FiShield, FiLayout } from 'react-icons/fi';
import axiosInstance from '../../utils/axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get('/user/notifications');
      const notifs = response.data.notifications || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axiosInstance.put(`/user/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-md border-b border-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Xstream" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-dark-300 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              to="/matches"
              className="text-dark-300 hover:text-white transition-colors"
            >
              Matches
            </Link>
            <Link
              to="/highlights"
              className="text-dark-300 hover:text-white transition-colors"
            >
              Highlights
            </Link>
            {user && (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg text-white transition-all border border-dark-700 hover:border-primary-500/50"
                >
                  <FiLayout className="w-4 h-4" />
                  <span className="font-medium">Dashboard</span>
                </Link>
                {user && user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white transition-all shadow-lg hover:shadow-primary-500/50"
                  >
                    <FiShield className="w-4 h-4" />
                    <span className="font-medium">Admin</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 text-dark-300 hover:text-white transition-colors"
                  >
                    <FiBell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-80 bg-dark-800 rounded-lg shadow-xl border border-dark-700 max-h-96 overflow-hidden"
                    >
                      <div className="p-4 border-b border-dark-700 flex items-center justify-between">
                        <h3 className="text-white font-semibold">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-xs text-primary-400">{unreadCount} new</span>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-dark-400 text-sm">No notifications</div>
                        ) : (
                          notifications.slice(0, 10).map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => !notification.isRead && markAsRead(notification.id)}
                              className={`p-4 border-b border-dark-700 cursor-pointer hover:bg-dark-700 transition-colors ${
                                !notification.isRead ? 'bg-primary-500/10' : ''
                              }`}
                            >
                              <p className="text-white text-sm font-medium">{notification.title}</p>
                              <p className="text-dark-400 text-xs mt-1">{notification.message}</p>
                              <p className="text-dark-500 text-xs mt-1">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-2 border-t border-dark-700 text-center">
                          <Link
                            to="/dashboard"
                            onClick={() => setNotificationsOpen(false)}
                            className="text-primary-400 hover:text-primary-300 text-sm"
                          >
                            View all
                          </Link>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
                <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-dark-300 hover:text-white transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-semibold">
                        {user.username?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span>{user.username}</span>
                </button>

                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-lg shadow-xl border border-dark-700 py-2"
                  >
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-dark-700"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FiUser className="mr-2" />
                      Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-dark-700"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FiSettings className="mr-2" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-white hover:bg-dark-700"
                    >
                      <FiLogOut className="mr-2" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-dark-300 hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-dark-800 bg-dark-900"
        >
          <div className="px-4 py-4 space-y-4">
            <Link
              to="/"
              className="block text-dark-300 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/matches"
              className="block text-dark-300 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Matches
            </Link>
            <Link
              to="/highlights"
              className="block text-dark-300 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Highlights
            </Link>
            {user && (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded-lg text-white transition-all border border-dark-700 hover:border-primary-500/50 mb-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FiLayout className="w-4 h-4" />
                  <span className="font-medium">Dashboard</span>
                </Link>
                <Link
                  to="/profile"
                  className="block text-dark-300 hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                {user && user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg text-white transition-all shadow-lg hover:shadow-primary-500/50 mt-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <FiShield className="w-4 h-4" />
                    <span className="font-medium">Admin</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-dark-300 hover:text-white"
                >
                  Logout
                </button>
              </>
            )}
            {!user && (
              <>
                <Link
                  to="/login"
                  className="block text-dark-300 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block btn-primary text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;


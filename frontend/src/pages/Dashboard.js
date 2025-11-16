import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FiClock, FiHeart, FiBell, FiMessageCircle, FiPlay } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const [watchHistory, setWatchHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [favoriteLeagues, setFavoriteLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [historyRes, notificationsRes] = await Promise.allSettled([
        axiosInstance.get('/user/watch-history'),
        axiosInstance.get('/user/notifications'),
      ]);

      if (historyRes.status === 'fulfilled') {
        setWatchHistory(historyRes.value.data.history || []);
      } else {
        console.error('Failed to fetch watch history:', historyRes.reason);
        setWatchHistory([]);
      }

      if (notificationsRes.status === 'fulfilled') {
        setNotifications(notificationsRes.value.data.notifications || []);
      } else {
        console.error('Failed to fetch notifications:', notificationsRes.reason);
        setNotifications([]);
      }

      setFavoriteLeagues(user?.favoriteLeagues || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setWatchHistory([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await axiosInstance.put(`/user/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.username || 'User'}!
          </h1>
          <p className="text-dark-400">Manage your account and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-400 text-sm">Watch History</p>
                    <p className="text-2xl font-bold text-white">{watchHistory.length}</p>
                  </div>
                  <FiPlay className="w-8 h-8 text-primary-500" />
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-400 text-sm">Favorite Leagues</p>
                    <p className="text-2xl font-bold text-white">{favoriteLeagues.length}</p>
                  </div>
                  <FiHeart className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-400 text-sm">Notifications</p>
                    <p className="text-2xl font-bold text-white">
                      {notifications.filter((n) => !n.isRead).length}
                    </p>
                  </div>
                  <FiBell className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Watch History */}
            <div className="card">
              <h2 className="text-2xl font-bold text-white mb-4">Recent Watch History</h2>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-20" />
                  ))}
                </div>
              ) : watchHistory.length > 0 ? (
                <div className="space-y-4">
                  {watchHistory.slice(0, 5).map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-4 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors"
                    >
                      {item.match.thumbnail && (
                        <img
                          src={item.match.thumbnail}
                          alt={item.match.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <Link
                          to={`/watch/${item.match.id}`}
                          className="text-white font-semibold hover:text-primary-400"
                        >
                          {item.match.title}
                        </Link>
                        <p className="text-dark-400 text-sm">
                          {format(new Date(item.watchedAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <Link
                        to={`/watch/${item.match.id}`}
                        className="btn-primary text-sm py-2 px-4"
                      >
                        Watch Again
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-center py-8">No watch history yet</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="card">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <FiBell className="mr-2" />
                Notifications
              </h2>
              {notifications.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg ${
                        notification.isRead ? 'bg-dark-700' : 'bg-primary-500/10 border border-primary-500/20'
                      }`}
                    >
                      <p className="text-white text-sm font-semibold">{notification.title}</p>
                      <p className="text-dark-400 text-xs mt-1">{notification.message}</p>
                      {!notification.isRead && (
                        <button
                          onClick={() => markNotificationRead(notification.id)}
                          className="text-primary-400 text-xs mt-2 hover:text-primary-300"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-sm text-center py-4">No notifications</p>
              )}
            </div>

            {/* Favorite Leagues */}
            <div className="card">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <FiHeart className="mr-2" />
                Favorite Leagues
              </h2>
              {favoriteLeagues.length > 0 ? (
                <div className="space-y-2">
                  {favoriteLeagues.map((league) => (
                    <div
                      key={league}
                      className="p-2 bg-dark-700 rounded-lg text-white text-sm"
                    >
                      {league}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-sm text-center py-4">
                  No favorite leagues yet
                </p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  to="/matches"
                  className="block w-full btn-secondary text-center py-2"
                >
                  Browse Matches
                </Link>
                <Link
                  to="/profile"
                  className="block w-full btn-secondary text-center py-2"
                >
                  Edit Profile
                </Link>
                <Link
                  to="/dashboard"
                  className="block w-full btn-secondary text-center py-2"
                >
                  <FiMessageCircle className="inline mr-2" />
                  Support Chat
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


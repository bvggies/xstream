import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../../utils/axios';
import { FiUsers, FiPlay, FiFlag, FiTrendingUp, FiActivity } from 'react-icons/fi';
import AdminSidebar from '../../components/Admin/AdminSidebar';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/admin/dashboard');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: FiUsers,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      link: '/admin/users',
    },
    {
      title: 'Total Matches',
      value: stats?.totalMatches || 0,
      icon: FiPlay,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      link: '/admin/matches',
    },
    {
      title: 'Live Matches',
      value: stats?.liveMatches || 0,
      icon: FiActivity,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      link: '/admin/matches?status=LIVE',
    },
    {
      title: 'Pending Reports',
      value: stats?.pendingReports || 0,
      icon: FiFlag,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      link: '/admin/reports',
    },
  ];

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-8">Admin Dashboard</h1>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={stat.link}>
                    <div className="card hover:border-primary-500 transition-all cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-dark-400 text-sm mb-1">{stat.title}</p>
                          <p className="text-3xl font-bold text-white">{stat.value}</p>
                        </div>
                        <div className={`${stat.bgColor} p-3 rounded-lg`}>
                          <Icon className={`${stat.color} w-6 h-6`} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Today's Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Today's Users</h3>
                  <FiTrendingUp className="text-primary-500" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.todayUsers || 0}</p>
              </div>
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Page Views</h3>
                  <FiTrendingUp className="text-primary-500" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.todayPageViews || 0}</p>
              </div>
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Match Views</h3>
                  <FiTrendingUp className="text-primary-500" />
                </div>
                <p className="text-3xl font-bold text-white">{stats.todayMatchViews || 0}</p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8 card">
            <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/admin/matches" className="btn-primary text-center py-3">
                Manage Matches
              </Link>
              <Link to="/admin/users" className="btn-primary text-center py-3">
                Manage Users
              </Link>
              <Link to="/admin/reports" className="btn-primary text-center py-3">
                View Reports
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;


import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '../../utils/axios';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import { FiTrendingUp, FiUsers, FiEye, FiPlay } from 'react-icons/fi';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const fetchAnalytics = async () => {
    try {
      const response = await axiosInstance.get('/admin/analytics', {
        params: { days },
      });
      setAnalytics(response.data.analytics || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalUsers = analytics.reduce((sum, a) => sum + a.dailyUsers, 0);
  const totalPageViews = analytics.reduce((sum, a) => sum + a.pageViews, 0);
  const totalMatchViews = analytics.reduce((sum, a) => sum + a.matchViews, 0);

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Analytics</h1>
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="input-field w-auto"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Total Users</h3>
              <FiUsers className="text-primary-500" />
            </div>
            <p className="text-3xl font-bold text-white">{totalUsers}</p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Page Views</h3>
              <FiEye className="text-primary-500" />
            </div>
            <p className="text-3xl font-bold text-white">{totalPageViews}</p>
          </div>
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Match Views</h3>
              <FiPlay className="text-primary-500" />
            </div>
            <p className="text-3xl font-bold text-white">{totalMatchViews}</p>
          </div>
        </div>

        {/* Analytics Table */}
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-800 border-b border-dark-700">
              <tr>
                <th className="text-left p-4 text-white font-semibold">Date</th>
                <th className="text-left p-4 text-white font-semibold">Daily Users</th>
                <th className="text-left p-4 text-white font-semibold">Page Views</th>
                <th className="text-left p-4 text-white font-semibold">Match Views</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-dark-700 hover:bg-dark-800 transition-colors"
                >
                  <td className="p-4 text-white">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-dark-400">{item.dailyUsers}</td>
                  <td className="p-4 text-dark-400">{item.pageViews}</td>
                  <td className="p-4 text-dark-400">{item.matchViews}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;


import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '../../utils/axios';
import toast from 'react-hot-toast';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import { FiCheck, FiX } from 'react-icons/fi';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const response = await axiosInstance.get('/admin/reports', { params });
      setReports(response.data.reports || []);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (id, status) => {
    try {
      await axiosInstance.put(`/admin/reports/${id}`, { status });
      toast.success('Report updated');
      fetchReports();
    } catch (error) {
      toast.error('Failed to update report');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Reports</h1>
          <div className="flex space-x-2">
            {['', 'PENDING', 'RESOLVED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === status
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                }`}
              >
                {status || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card skeleton h-32" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <span className="text-white font-semibold">{report.user.username}</span>
                      <span className="text-dark-400">reported</span>
                      <span className="text-white">{report.match.title}</span>
                    </div>
                    <p className="text-dark-400 mb-2">{report.reason}</p>
                    <p className="text-dark-500 text-sm">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        report.status === 'PENDING'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : report.status === 'RESOLVED'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {report.status}
                    </span>
                    {report.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => updateReportStatus(report.id, 'RESOLVED')}
                          className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"
                          title="Resolve"
                        >
                          <FiCheck />
                        </button>
                        <button
                          onClick={() => updateReportStatus(report.id, 'REJECTED')}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                          title="Reject"
                        >
                          <FiX />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;


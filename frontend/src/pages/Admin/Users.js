import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '../../utils/axios';
import toast from 'react-hot-toast';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import { FiXCircle, FiUnlock, FiSearch } from 'react-icons/fi';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/admin/users', {
        params: { page, search },
      });
      setUsers(response.data.users || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (id) => {
    try {
      await axiosInstance.put(`/admin/users/${id}/ban`);
      toast.success('User banned');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to ban user');
    }
  };

  const handleUnban = async (id) => {
    try {
      await axiosInstance.put(`/admin/users/${id}/unban`);
      toast.success('User unbanned');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to unban user');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Manage Users</h1>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card skeleton h-20" />
            ))}
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-800 border-b border-dark-700">
                <tr>
                  <th className="text-left p-4 text-white font-semibold">Username</th>
                  <th className="text-left p-4 text-white font-semibold">Email</th>
                  <th className="text-left p-4 text-white font-semibold">Role</th>
                  <th className="text-left p-4 text-white font-semibold">Status</th>
                  <th className="text-left p-4 text-white font-semibold">Joined</th>
                  <th className="text-right p-4 text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-dark-700 hover:bg-dark-800 transition-colors"
                  >
                    <td className="p-4 text-white">{user.username}</td>
                    <td className="p-4 text-dark-400">{user.email}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.role === 'ADMIN'
                            ? 'bg-primary-500/20 text-primary-400'
                            : 'bg-dark-700 text-dark-400'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.isBanned ? (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-dark-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        {user.isBanned ? (
                          <button
                            onClick={() => handleUnban(user.id)}
                            className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"
                            title="Unban"
                          >
                            <FiUnlock />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBan(user.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                            title="Ban"
                          >
                            <FiXCircle />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;


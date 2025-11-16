import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '../../utils/axios';
import toast from 'react-hot-toast';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import { FiPlus, FiEdit, FiTrash2, FiPlay, FiStopCircle } from 'react-icons/fi';
import MatchModal from '../../components/Admin/MatchModal';

const AdminMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await axiosInstance.get('/matches');
      setMatches(response.data.matches || []);
    } catch (error) {
      toast.error('Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  };

  const handleEndMatch = async (id) => {
    if (!window.confirm('Are you sure you want to end this match? It will be moved to finished matches.')) return;

    try {
      await axiosInstance.put(`/admin/matches/${id}/end`);
      toast.success('Match ended');
      fetchMatches();
    } catch (error) {
      toast.error('Failed to end match');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this match?')) return;

    try {
      await axiosInstance.delete(`/admin/matches/${id}`);
      toast.success('Match deleted');
      fetchMatches();
    } catch (error) {
      toast.error('Failed to delete match');
    }
  };

  const handleEdit = (match) => {
    setEditingMatch(match);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingMatch(null);
    fetchMatches();
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Manage Matches</h1>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
            <FiPlus className="mr-2" />
            Add Match
          </button>
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
                  <th className="text-left p-4 text-white font-semibold">Title</th>
                  <th className="text-left p-4 text-white font-semibold">League</th>
                  <th className="text-left p-4 text-white font-semibold">Status</th>
                  <th className="text-left p-4 text-white font-semibold">Date</th>
                  <th className="text-left p-4 text-white font-semibold">Streams</th>
                  <th className="text-right p-4 text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr
                    key={match.id}
                    className="border-b border-dark-700 hover:bg-dark-800 transition-colors"
                  >
                    <td className="p-4 text-white">{match.title}</td>
                    <td className="p-4 text-dark-400">{match.league}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          match.status === 'LIVE'
                            ? 'bg-red-500/20 text-red-400'
                            : match.status === 'UPCOMING'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-dark-700 text-dark-400'
                        }`}
                      >
                        {match.status}
                      </span>
                    </td>
                    <td className="p-4 text-dark-400">
                      {new Date(match.matchDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-dark-400">
                      {match.streamingLinks?.length || 0}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-2">
                        {match.status === 'LIVE' && (
                          <button
                            onClick={() => handleEndMatch(match.id)}
                            className="p-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg text-orange-400 transition-colors"
                            title="End Match"
                          >
                            <FiStopCircle />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(match)}
                          className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-white transition-colors"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(match.id)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <MatchModal
            match={editingMatch}
            onClose={handleModalClose}
          />
        )}
      </div>
    </div>
  );
};

export default AdminMatches;


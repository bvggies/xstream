import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '../../utils/axios';
import toast from 'react-hot-toast';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import AdminHighlightForm from '../../components/Admin/AdminHighlightForm';
import AdminHighlightTable from '../../components/Admin/AdminHighlightTable';
import { FiPlus, FiVideo } from 'react-icons/fi';

const AdminHighlights = () => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    league: '',
    isVisible: '',
  });

  useEffect(() => {
    fetchHighlights();
  }, [filters]);

  const fetchHighlights = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filters.league) params.league = filters.league;
      if (filters.isVisible !== '') params.isVisible = filters.isVisible;

      const response = await axiosInstance.get('/admin/highlights', { params });
      setHighlights(response.data.highlights || []);
    } catch (error) {
      toast.error('Failed to fetch highlights');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this highlight?')) return;

    try {
      await axiosInstance.delete(`/admin/highlights/${id}`);
      toast.success('Highlight deleted');
      fetchHighlights();
    } catch (error) {
      toast.error('Failed to delete highlight');
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      await axiosInstance.patch(`/admin/highlights/${id}/toggle`);
      toast.success('Visibility updated');
      fetchHighlights();
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  const handleEdit = (highlight) => {
    setEditingHighlight(highlight);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingHighlight(null);
    fetchHighlights();
  };

  const filteredHighlights = highlights.filter((highlight) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        highlight.title.toLowerCase().includes(searchLower) ||
        highlight.league.toLowerCase().includes(searchLower) ||
        (highlight.description && highlight.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-dark-900 flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <FiVideo className="text-primary-500 text-4xl" />
            <h1 className="text-4xl font-bold text-white">Manage Highlights</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
            <FiPlus className="mr-2" />
            Add Highlight
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.league}
              onChange={(e) => setFilters({ ...filters, league: e.target.value })}
              className="input-field w-full md:w-auto"
            >
              <option value="">All Leagues</option>
              {[...new Set(highlights.map((h) => h.league))].map((league) => (
                <option key={league} value={league}>
                  {league}
                </option>
              ))}
            </select>
            <select
              value={filters.isVisible}
              onChange={(e) => setFilters({ ...filters, isVisible: e.target.value })}
              className="input-field w-full md:w-auto"
            >
              <option value="">All Status</option>
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
          </div>
        </div>

        <AdminHighlightTable
          highlights={filteredHighlights}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleVisibility={handleToggleVisibility}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {showModal && (
          <AdminHighlightForm
            highlight={editingHighlight}
            onClose={handleModalClose}
            onSuccess={handleModalClose}
          />
        )}
      </div>
    </div>
  );
};

export default AdminHighlights;


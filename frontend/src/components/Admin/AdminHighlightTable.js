import React from 'react';
import { motion } from 'framer-motion';
import { FiEdit, FiTrash2, FiEye, FiEyeOff, FiSearch } from 'react-icons/fi';
import { format } from 'date-fns';

const AdminHighlightTable = ({
  highlights,
  loading,
  onEdit,
  onDelete,
  onToggleVisibility,
  searchTerm,
  onSearchChange,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card skeleton h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-dark-700">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search highlights..."
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-dark-800 border-b border-dark-700">
            <tr>
              <th className="text-left p-4 text-white font-semibold">Thumbnail</th>
              <th className="text-left p-4 text-white font-semibold">Title</th>
              <th className="text-left p-4 text-white font-semibold">League</th>
              <th className="text-left p-4 text-white font-semibold">Date</th>
              <th className="text-left p-4 text-white font-semibold">Status</th>
              <th className="text-right p-4 text-white font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {highlights.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-dark-400">
                  No highlights found
                </td>
              </tr>
            ) : (
              highlights.map((highlight, index) => (
                <motion.tr
                  key={highlight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  data-aos="fade-up"
                  data-aos-delay={index * 50}
                  className="border-b border-dark-700 hover:bg-dark-800 transition-colors"
                >
                  <td className="p-4">
                    <img
                      src={highlight.thumbnailUrl}
                      alt={highlight.title}
                      className="w-20 h-12 object-cover rounded"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80x48?text=No+Image';
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <p className="text-white font-medium">{highlight.title}</p>
                    {highlight.description && (
                      <p className="text-dark-400 text-xs mt-1 line-clamp-1">
                        {highlight.description}
                      </p>
                    )}
                  </td>
                  <td className="p-4 text-dark-400">{highlight.league}</td>
                  <td className="p-4 text-dark-400">
                    {format(new Date(highlight.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        highlight.isVisible
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-dark-700 text-dark-400'
                      }`}
                    >
                      {highlight.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => onToggleVisibility(highlight.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          highlight.isVisible
                            ? 'bg-dark-700 hover:bg-dark-600 text-dark-400'
                            : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                        }`}
                        title={highlight.isVisible ? 'Hide' : 'Show'}
                      >
                        {highlight.isVisible ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <button
                        onClick={() => onEdit(highlight)}
                        className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-white transition-colors"
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => onDelete(highlight.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminHighlightTable;


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../utils/axios';
import toast from 'react-hot-toast';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';

const AdminHighlightForm = ({ highlight, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    matchId: '',
    league: '',
    thumbnailUrl: '',
    videoLinks: [''],
    duration: '',
    isVisible: true,
  });
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMatches();
    if (highlight) {
      setFormData({
        title: highlight.title || '',
        description: highlight.description || '',
        matchId: highlight.matchId || '',
        league: highlight.league || '',
        thumbnailUrl: highlight.thumbnailUrl || '',
        videoLinks: highlight.videoLinks && highlight.videoLinks.length > 0 ? highlight.videoLinks : [''],
        duration: highlight.duration || '',
        isVisible: highlight.isVisible !== undefined ? highlight.isVisible : true,
      });
    }
  }, [highlight]);

  const fetchMatches = async () => {
    try {
      const response = await axiosInstance.get('/matches?status=FINISHED');
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        videoLinks: formData.videoLinks.filter((link) => link.trim()),
        duration: formData.duration ? parseInt(formData.duration) : null,
        matchId: formData.matchId || null,
      };

      if (highlight) {
        await axiosInstance.patch(`/admin/highlights/${highlight.id}`, submitData);
        toast.success('Highlight updated');
      } else {
        await axiosInstance.post('/admin/highlights', submitData);
        toast.success('Highlight created');
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save highlight');
    } finally {
      setLoading(false);
    }
  };

  const addVideoLink = () => {
    setFormData({
      ...formData,
      videoLinks: [...formData.videoLinks, ''],
    });
  };

  const removeVideoLink = (index) => {
    if (formData.videoLinks.length > 1) {
      setFormData({
        ...formData,
        videoLinks: formData.videoLinks.filter((_, i) => i !== index),
      });
    }
  };

  const updateVideoLink = (index, value) => {
    const newLinks = [...formData.videoLinks];
    newLinks[index] = value;
    setFormData({ ...formData, videoLinks: newLinks });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-dark-800 border-b border-dark-700 p-6 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-white">
              {highlight ? 'Edit Highlight' : 'Add Highlight'}
            </h2>
            <button
              onClick={onClose}
              className="text-dark-400 hover:text-white transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">League *</label>
                <input
                  type="text"
                  value={formData.league}
                  onChange={(e) => setFormData({ ...formData, league: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Match (optional)</label>
                <select
                  value={formData.matchId}
                  onChange={(e) => setFormData({ ...formData, matchId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Match</option>
                  {matches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Thumbnail URL *</label>
              <input
                type="url"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                className="input-field"
                required
              />
              {formData.thumbnailUrl && (
                <img
                  src={formData.thumbnailUrl}
                  alt="Preview"
                  className="mt-2 h-32 w-auto rounded-lg object-cover"
                  onError={(e) => (e.target.style.display = 'none')}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Video Links * (YouTube, HLS, MP4, M3U8, Vimeo)
              </label>
              <div className="space-y-2">
                {formData.videoLinks.map((link, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updateVideoLink(index, e.target.value)}
                      className="input-field flex-1"
                      placeholder="https://example.com/video.mp4"
                      required={index === 0}
                    />
                    {formData.videoLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVideoLink(index)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVideoLink}
                  className="btn-secondary flex items-center space-x-2 px-4 py-2"
                >
                  <FiPlus />
                  <span>Add Another Link</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Duration (seconds)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="input-field"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Visibility</label>
                <select
                  value={formData.isVisible}
                  onChange={(e) => setFormData({ ...formData, isVisible: e.target.value === 'true' })}
                  className="input-field"
                >
                  <option value={true}>Visible</option>
                  <option value={false}>Hidden</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-dark-700">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary px-6 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-6 py-2 disabled:opacity-50"
              >
                {loading ? 'Saving...' : highlight ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AdminHighlightForm;


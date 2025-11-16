import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../utils/axios';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';

const MatchModal = ({ match, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    homeTeam: '',
    awayTeam: '',
    league: '',
    matchDate: '',
    status: 'UPCOMING',
  });
  const [streamingLinks, setStreamingLinks] = useState([]);
  const [newLink, setNewLink] = useState({ url: '', type: 'HLS', quality: 'HD' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (match) {
      setFormData({
        title: match.title || '',
        homeTeam: match.homeTeam || '',
        awayTeam: match.awayTeam || '',
        league: match.league || '',
        matchDate: match.matchDate ? new Date(match.matchDate).toISOString().slice(0, 16) : '',
        status: match.status || 'UPCOMING',
      });
      setStreamingLinks(match.streamingLinks || []);
    }
  }, [match]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      const thumbnailInput = document.querySelector('input[type="file"]');
      if (thumbnailInput?.files[0]) {
        formDataToSend.append('thumbnail', thumbnailInput.files[0]);
      }

      if (match) {
        await axiosInstance.put(`/admin/matches/${match.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Match updated');
      } else {
        const response = await axiosInstance.post('/admin/matches', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Match created');
        // Add streaming links if any
        if (streamingLinks.length > 0) {
          for (const link of streamingLinks) {
            await axiosInstance.post(`/admin/matches/${response.data.match.id}/links`, link);
          }
        }
      }
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save match');
    } finally {
      setLoading(false);
    }
  };

  const addStreamingLink = () => {
    if (newLink.url) {
      setStreamingLinks([...streamingLinks, { ...newLink, id: Date.now() }]);
      setNewLink({ url: '', type: 'HLS', quality: 'HD' });
    }
  };

  const removeStreamingLink = (index) => {
    setStreamingLinks(streamingLinks.filter((_, i) => i !== index));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-dark-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-dark-700 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {match ? 'Edit Match' : 'Add Match'}
            </h2>
            <button onClick={onClose} className="text-dark-400 hover:text-white">
              <FiX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">League</label>
                <input
                  type="text"
                  value={formData.league}
                  onChange={(e) => setFormData({ ...formData, league: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Home Team</label>
                <input
                  type="text"
                  value={formData.homeTeam}
                  onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Away Team</label>
                <input
                  type="text"
                  value={formData.awayTeam}
                  onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Match Date</label>
                <input
                  type="datetime-local"
                  value={formData.matchDate}
                  onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-field"
                >
                  <option value="UPCOMING">Upcoming</option>
                  <option value="LIVE">Live</option>
                  <option value="FINISHED">Finished</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Thumbnail</label>
                <input type="file" accept="image/*" className="input-field" />
              </div>
            </div>

            {/* Streaming Links */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Streaming Links</label>
              <div className="space-y-2 mb-4">
                {streamingLinks.map((link, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-dark-700 p-2 rounded">
                    <span className="text-white flex-1">{link.url}</span>
                    <span className="text-dark-400 text-sm">{link.quality}</span>
                    <button
                      type="button"
                      onClick={() => removeStreamingLink(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="Stream URL"
                  className="input-field flex-1"
                />
                <select
                  value={newLink.type}
                  onChange={(e) => setNewLink({ ...newLink, type: e.target.value })}
                  className="input-field w-32"
                >
                  <option value="HLS">HLS</option>
                  <option value="M3U8">M3U8</option>
                  <option value="IFRAME">Iframe</option>
                  <option value="DIRECT">Direct</option>
                </select>
                <input
                  type="text"
                  value={newLink.quality}
                  onChange={(e) => setNewLink({ ...newLink, quality: e.target.value })}
                  placeholder="Quality"
                  className="input-field w-24"
                />
                <button
                  type="button"
                  onClick={addStreamingLink}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : match ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MatchModal;


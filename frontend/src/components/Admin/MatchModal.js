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

      let matchId;
      if (match) {
        // Update existing match
        const updateResponse = await axiosInstance.put(`/admin/matches/${match.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        matchId = match.id;
        toast.success('Match updated');
        
        // Update streaming links - delete old ones and add new ones
        if (match.streamingLinks) {
          // Delete existing links
          for (const link of match.streamingLinks) {
            try {
              await axiosInstance.delete(`/admin/matches/${matchId}/links/${link.id}`);
            } catch (err) {
              console.error('Failed to delete link:', err);
            }
          }
        }
      } else {
        // Create new match
        const response = await axiosInstance.post('/admin/matches', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        matchId = response.data.match.id;
        toast.success('Match created');
      }
      
      // Add all streaming links
      if (streamingLinks.length > 0) {
        for (const link of streamingLinks) {
          if (link.url && link.url.trim()) {
            try {
              await axiosInstance.post(`/admin/matches/${matchId}/links`, {
                url: link.url,
                type: link.type,
                quality: link.quality || 'HD',
              });
            } catch (err) {
              console.error('Failed to add link:', err);
              toast.error(`Failed to add link: ${link.url}`);
            }
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
              <label className="block text-sm font-medium text-white mb-2">
                Streaming Links ({streamingLinks.length})
              </label>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {streamingLinks.map((link, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-dark-700 p-3 rounded-lg border border-dark-600">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate" title={link.url}>{link.url}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-dark-400 text-xs px-2 py-0.5 bg-dark-800 rounded">{link.type}</span>
                        <span className="text-dark-400 text-xs px-2 py-0.5 bg-dark-800 rounded">{link.quality || 'HD'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStreamingLink(index)}
                      className="text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                      title="Remove link"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {streamingLinks.length === 0 && (
                  <p className="text-dark-400 text-sm text-center py-4">No streaming links added yet</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="Stream URL (e.g., https://example.com/stream.m3u8)"
                  className="input-field md:col-span-6"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addStreamingLink();
                    }
                  }}
                />
                <select
                  value={newLink.type}
                  onChange={(e) => setNewLink({ ...newLink, type: e.target.value })}
                  className="input-field md:col-span-3"
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
                  className="input-field md:col-span-2"
                />
                <button
                  type="button"
                  onClick={addStreamingLink}
                  disabled={!newLink.url.trim()}
                  className="btn-secondary md:col-span-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <p className="text-dark-400 text-xs mt-2">
                💡 Tip: Add multiple links so users can switch if one fails
              </p>
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


import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios';
import HighlightPlayer from '../components/HighlightPlayer';
import HighlightCard from '../components/HighlightCard';
import { FiArrowLeft, FiShare2, FiCopy, FiEye, FiCalendar, FiTag, FiTrendingUp, FiBarChart2, FiDownload, FiBookmark, FiBookmarkCheck } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import SkeletonLoader from '../components/SkeletonLoader';

const WatchHighlight = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [highlight, setHighlight] = useState(null);
  const [relatedHighlights, setRelatedHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchHighlight();
  }, [id]);

  const fetchHighlight = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/highlights/${id}`);
      const highlightData = response.data.highlight;
      setHighlight(highlightData);
      setRelatedHighlights(response.data.relatedHighlights || []);
      
      // Parse statistics if available
      if (highlightData.statistics) {
        try {
          const stats = typeof highlightData.statistics === 'string' 
            ? JSON.parse(highlightData.statistics) 
            : highlightData.statistics;
          setStatistics(stats);
        } catch (e) {
          console.error('Failed to parse statistics:', e);
        }
      }
    } catch (error) {
      toast.error('Failed to load highlight');
      navigate('/highlights');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const shareOnSocial = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(highlight?.title || '');
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
  };

  const downloadVideo = () => {
    if (highlight?.videoLinks && highlight.videoLinks.length > 0) {
      window.open(highlight.videoLinks[0], '_blank');
      toast.success('Opening video in new tab...');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SkeletonLoader className="h-96 mb-6" />
          <SkeletonLoader className="h-64" />
        </div>
      </div>
    );
  }

  if (!highlight) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/highlights')}
          className="flex items-center space-x-2 text-dark-400 hover:text-white mb-6 transition-colors"
        >
          <FiArrowLeft />
          <span>Back to Highlights</span>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-0 overflow-hidden"
            >
              <HighlightPlayer videoLinks={highlight.videoLinks} title={highlight.title} />
            </motion.div>

            {/* Video Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-3">{highlight.title}</h1>
                  
                  {/* Match Score Display */}
                  {(highlight.homeScore !== null && highlight.homeScore !== undefined) || 
                   (highlight.awayScore !== null && highlight.awayScore !== undefined) ? (
                    <div className="mb-4 flex items-center space-x-4">
                      <div className="flex items-center space-x-3 bg-gradient-to-r from-primary-500/20 to-primary-600/20 px-6 py-3 rounded-xl border border-primary-500/30">
                        <span className="text-white font-bold text-2xl">
                          {highlight.homeScore ?? 0}
                        </span>
                        <span className="text-primary-400 text-xl font-semibold">-</span>
                        <span className="text-white font-bold text-2xl">
                          {highlight.awayScore ?? 0}
                        </span>
                      </div>
                      {highlight.match && (
                        <div className="text-dark-400 text-sm">
                          <p className="font-semibold text-white mb-1">Match Result</p>
                          <p>{highlight.match.homeTeam} vs {highlight.match.awayTeam}</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={toggleBookmark}
                    className={`p-2 rounded-lg transition-colors ${
                      isBookmarked 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-white'
                    }`}
                    title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                  >
                    {isBookmarked ? <FiBookmarkCheck size={20} /> : <FiBookmark size={20} />}
                  </button>
                  <button
                    onClick={downloadVideo}
                    className="p-2 bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-white rounded-lg transition-colors"
                    title="Download/Open video"
                  >
                    <FiDownload size={20} />
                  </button>
                </div>
              </div>

              {highlight.description && (
                <p className="text-dark-300 mb-4 text-lg leading-relaxed">{highlight.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-dark-400 mb-4">
                <div className="flex items-center space-x-2">
                  <FiTag />
                  <span className="text-primary-400 font-semibold">{highlight.league}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiEye />
                  <span>{highlight.views.toLocaleString()} views</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FiCalendar />
                  <span>{format(new Date(highlight.createdAt), 'MMM dd, yyyy')}</span>
                </div>
                {highlight.duration && (
                  <div className="flex items-center space-x-2">
                    <FiTrendingUp />
                    <span>{Math.floor(highlight.duration / 60)}:{(highlight.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                )}
              </div>

              {/* Match Statistics */}
              {statistics && (
                <div className="mt-6 p-4 bg-dark-800 rounded-xl border border-dark-700">
                  <div className="flex items-center space-x-2 mb-4">
                    <FiBarChart2 className="text-primary-400" />
                    <h3 className="text-lg font-semibold text-white">Match Statistics</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(statistics).map(([key, value]) => {
                      if (typeof value === 'object' && value !== null) {
                        const homeValue = value.home ?? value.homeTeam ?? 0;
                        const awayValue = value.away ?? value.awayTeam ?? 0;
                        const total = homeValue + awayValue;
                        const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
                        
                        return (
                          <div key={key} className="bg-dark-900 p-3 rounded-lg">
                            <p className="text-dark-400 text-xs mb-2 uppercase tracking-wide">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-white font-semibold">{homeValue}</span>
                                <span className="text-dark-500 text-xs">{key}</span>
                                <span className="text-white font-semibold">{awayValue}</span>
                              </div>
                              <div className="w-full bg-dark-700 rounded-full h-2 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-full transition-all"
                                  style={{ width: `${homePercent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}

              {highlight.match && (
                <div className="mt-4 p-4 bg-dark-800 rounded-lg border border-dark-700">
                  <p className="text-dark-400 text-sm mb-2">Related Match:</p>
                  <Link
                    to={`/watch/${highlight.match.id}`}
                    className="text-primary-400 hover:text-primary-300 font-semibold flex items-center space-x-2 group"
                  >
                    <span>{highlight.match.title}</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              )}

              {/* Share Buttons */}
              <div className="mt-6 pt-6 border-t border-dark-700">
                <p className="text-white font-semibold mb-3">Share:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={copyLink}
                    className="btn-secondary flex items-center space-x-2 px-4 py-2"
                  >
                    <FiCopy />
                    <span>Copy Link</span>
                  </button>
                  <button
                    onClick={() => shareOnSocial('twitter')}
                    className="btn-secondary px-4 py-2"
                  >
                    Twitter
                  </button>
                  <button
                    onClick={() => shareOnSocial('facebook')}
                    className="btn-secondary px-4 py-2"
                  >
                    Facebook
                  </button>
                  <button
                    onClick={() => shareOnSocial('whatsapp')}
                    className="btn-secondary px-4 py-2"
                  >
                    WhatsApp
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Match Info Card */}
            {highlight.match && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
                <h3 className="text-lg font-bold text-white mb-4">Match Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                    <span className="text-dark-400 text-sm">Home Team</span>
                    <span className="text-white font-semibold">{highlight.match.homeTeam}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                    <span className="text-dark-400 text-sm">Away Team</span>
                    <span className="text-white font-semibold">{highlight.match.awayTeam}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                    <span className="text-dark-400 text-sm">League</span>
                    <span className="text-primary-400 font-semibold">{highlight.match.league}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                    <span className="text-dark-400 text-sm">Date</span>
                    <span className="text-white text-sm">
                      {format(new Date(highlight.match.matchDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <Link
                    to={`/watch/${highlight.match.id}`}
                    className="block w-full btn-primary text-center mt-4"
                  >
                    Watch Full Match
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Related Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <h2 className="text-xl font-bold text-white mb-4">Related Highlights</h2>
              {relatedHighlights.length > 0 ? (
                <div className="space-y-4">
                  {relatedHighlights.map((related, index) => (
                    <Link
                      key={related.id}
                      to={`/highlights/${related.id}`}
                      className="block hover:opacity-80 transition-opacity"
                    >
                      <div className="flex space-x-3">
                        <img
                          src={related.thumbnailUrl}
                          alt={related.title}
                          className="w-24 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                            {related.title}
                          </h4>
                          <div className="flex items-center space-x-3 text-xs text-dark-400">
                            <span>{related.views.toLocaleString()} views</span>
                            {related.duration && (
                              <span>{Math.floor(related.duration / 60)}:{(related.duration % 60).toString().padStart(2, '0')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-sm">No related highlights</p>
              )}
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-dark-400">Views</span>
                  <span className="text-white font-bold">{highlight.views.toLocaleString()}</span>
                </div>
                {highlight.duration && (
                  <div className="flex items-center justify-between">
                    <span className="text-dark-400">Duration</span>
                    <span className="text-white font-bold">
                      {Math.floor(highlight.duration / 60)}:{(highlight.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-dark-400">Uploaded</span>
                  <span className="text-white font-bold">
                    {format(new Date(highlight.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchHighlight;


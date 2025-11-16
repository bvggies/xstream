import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios';
import HighlightPlayer from '../components/HighlightPlayer';
import HighlightCard from '../components/HighlightCard';
import { FiArrowLeft, FiShare2, FiCopy, FiEye, FiCalendar, FiTag } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import SkeletonLoader from '../components/SkeletonLoader';

const WatchHighlight = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [highlight, setHighlight] = useState(null);
  const [relatedHighlights, setRelatedHighlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHighlight();
  }, [id]);

  const fetchHighlight = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/highlights/${id}`);
      setHighlight(response.data.highlight);
      setRelatedHighlights(response.data.relatedHighlights || []);
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
              <h1 className="text-3xl font-bold text-white mb-3">{highlight.title}</h1>

              {highlight.description && (
                <p className="text-dark-300 mb-4">{highlight.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-dark-400">
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
              </div>

              {highlight.match && (
                <div className="mt-4 p-4 bg-dark-800 rounded-lg">
                  <p className="text-dark-400 text-sm mb-1">Related Match:</p>
                  <Link
                    to={`/watch/${highlight.match.id}`}
                    className="text-primary-400 hover:text-primary-300 font-semibold"
                  >
                    {highlight.match.title}
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

          {/* Sidebar - Related Highlights */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <h2 className="text-xl font-bold text-white mb-4">Related Highlights</h2>
              {relatedHighlights.length > 0 ? (
                <div className="space-y-4">
                  {relatedHighlights.map((related, index) => (
                    <HighlightCard key={related.id} highlight={related} index={index} />
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-sm">No related highlights</p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchHighlight;


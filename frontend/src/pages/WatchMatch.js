import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios';
import toast from 'react-hot-toast';
import Hls from 'hls.js';
import { FiPlay, FiFlag, FiMessageCircle } from 'react-icons/fi';
import Chat from '../components/Chat';

const WatchMatch = () => {
  const { id } = useParams();
  const videoRef = useRef(null);
  const [match, setMatch] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [hls, setHls] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatch();
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [id]);

  useEffect(() => {
    if (selectedLink && videoRef.current) {
      loadStream();
    }
  }, [selectedLink]);

  const fetchMatch = async () => {
    try {
      const response = await axiosInstance.get(`/matches/${id}`);
      const matchData = response.data.match;
      setMatch(matchData);

      if (matchData.streamingLinks && matchData.streamingLinks.length > 0) {
        setSelectedLink(matchData.streamingLinks[0]);
      }

      // Record watch
      await axiosInstance.post(`/matches/${id}/watch`, {
        linkId: matchData.streamingLinks?.[0]?.id,
      });
    } catch (error) {
      toast.error('Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  const loadStream = () => {
    if (!videoRef.current || !selectedLink) return;

    if (hls) {
      hls.destroy();
    }

    if (selectedLink.type === 'HLS' || selectedLink.type === 'M3U8') {
      if (Hls.isSupported()) {
        const hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hlsInstance.loadSource(selectedLink.url);
        hlsInstance.attachMedia(videoRef.current);

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play();
        });

        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                toast.error('Network error. Trying to recover...');
                hlsInstance.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                toast.error('Media error. Trying to recover...');
                hlsInstance.recoverMediaError();
                break;
              default:
                hlsInstance.destroy();
                tryNextLink();
                break;
            }
          }
        });

        setHls(hlsInstance);
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        videoRef.current.src = selectedLink.url;
        videoRef.current.play();
      }
    } else if (selectedLink.type === 'IFRAME') {
      // Handle iframe type
      toast.info('Iframe stream - opening in new window');
      window.open(selectedLink.url, '_blank');
    } else {
      // Direct video
      videoRef.current.src = selectedLink.url;
      videoRef.current.play();
    }
  };

  const tryNextLink = () => {
    if (!match || !match.streamingLinks) return;

    const currentIndex = match.streamingLinks.findIndex((l) => l.id === selectedLink?.id);
    const nextLink = match.streamingLinks[currentIndex + 1];

    if (nextLink) {
      toast.info('Trying next stream...');
      setSelectedLink(nextLink);
    } else {
      toast.error('All streams failed. Please try again later.');
    }
  };

  const reportBrokenLink = async () => {
    try {
      await axiosInstance.post('/user/report', {
        matchId: id,
        reason: 'Broken stream link',
      });
      toast.success('Report submitted. Thank you!');
    } catch (error) {
      toast.error('Failed to submit report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Match not found</p>
          <Link to="/matches" className="btn-primary">
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Match Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link to="/matches" className="text-primary-400 hover:text-primary-300 mb-4 inline-block">
            ← Back to Matches
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{match.title}</h1>
          <div className="flex items-center space-x-4 text-dark-400">
            <span>{match.league}</span>
            {match.status === 'LIVE' && (
              <span className="flex items-center text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
                LIVE
              </span>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <div className="card p-0 overflow-hidden">
              <div className="relative bg-black aspect-video">
                {selectedLink ? (
                  <>
                    {selectedLink.type === 'IFRAME' ? (
                      <iframe
                        src={selectedLink.url}
                        className="w-full h-full"
                        allowFullScreen
                        title={match.title}
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        controls
                        className="w-full h-full"
                        playsInline
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <FiPlay className="w-16 h-16 mx-auto mb-4 text-dark-400" />
                      <p className="text-dark-400">No stream available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stream Controls */}
              {match.streamingLinks && match.streamingLinks.length > 0 && (
                <div className="p-4 bg-dark-800 border-t border-dark-700">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-semibold">Quality:</span>
                      <select
                        value={selectedLink?.id || ''}
                        onChange={(e) => {
                          const link = match.streamingLinks.find((l) => l.id === e.target.value);
                          setSelectedLink(link);
                        }}
                        className="input-field w-auto"
                      >
                        {match.streamingLinks.map((link) => (
                          <option key={link.id} value={link.id}>
                            {link.quality || link.type} ({link.views} views)
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={reportBrokenLink}
                      className="btn-secondary text-sm py-2 px-4 flex items-center"
                    >
                      <FiFlag className="mr-2" />
                      Report Broken Link
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Match Details */}
            <div className="card mt-6">
              <h2 className="text-xl font-bold text-white mb-4">Match Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-dark-400 text-sm">Home Team</p>
                  <p className="text-white font-semibold">{match.homeTeam}</p>
                </div>
                <div>
                  <p className="text-dark-400 text-sm">Away Team</p>
                  <p className="text-white font-semibold">{match.awayTeam}</p>
                </div>
                <div>
                  <p className="text-dark-400 text-sm">League</p>
                  <p className="text-white font-semibold">{match.league}</p>
                </div>
                <div>
                  <p className="text-dark-400 text-sm">Status</p>
                  <p className="text-white font-semibold">{match.status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Chat Toggle */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full btn-primary flex items-center justify-center"
            >
              <FiMessageCircle className="mr-2" />
              {showChat ? 'Hide' : 'Show'} Chat
            </button>

            {/* Chat */}
            {showChat && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card p-0"
              >
                <Chat />
              </motion.div>
            )}

            {/* Stream Links List */}
            {match.streamingLinks && match.streamingLinks.length > 1 && (
              <div className="card">
                <h3 className="text-lg font-bold text-white mb-4">All Streams</h3>
                <div className="space-y-2">
                  {match.streamingLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => setSelectedLink(link)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedLink?.id === link.id
                          ? 'bg-primary-500/20 border border-primary-500'
                          : 'bg-dark-700 hover:bg-dark-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">{link.quality || link.type}</p>
                          <p className="text-dark-400 text-xs">{link.views} views</p>
                        </div>
                        {selectedLink?.id === link.id && (
                          <FiPlay className="text-primary-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchMatch;


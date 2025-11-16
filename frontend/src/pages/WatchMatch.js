import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios';
import toast from 'react-hot-toast';
import Hls from 'hls.js';
import { FiPlay, FiFlag, FiMessageCircle, FiClock, FiUsers, FiCalendar } from 'react-icons/fi';
import Chat from '../components/Chat';
import { calculateTimeRemaining, formatCountdown, canAccessMatch } from '../utils/countdown';
import { format } from 'date-fns';

const WatchMatch = () => {
  const { id } = useParams();
  const videoRef = useRef(null);
  const [match, setMatch] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [hls, setHls] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [accessGranted, setAccessGranted] = useState(false);

  useEffect(() => {
    fetchMatch();
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!match) return;

    const updateCountdown = () => {
      const timeRemaining = calculateTimeRemaining(match.matchDate);
      setCountdown(timeRemaining);
      setAccessGranted(canAccessMatch(match.matchDate) || match.status === 'LIVE' || match.status === 'FINISHED');
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [match]);

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
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Match not found</p>
          <Link to="/matches" className="btn-primary">
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (match.status) {
      case 'LIVE':
        return (
          <span className="flex items-center px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full text-red-400 font-semibold">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
            LIVE
          </span>
        );
      case 'UPCOMING':
        return (
          <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-400 font-semibold">
            UPCOMING
          </span>
        );
      case 'FINISHED':
        return (
          <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-green-400 font-semibold">
            FINISHED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 bg-dark-700 border border-dark-600 rounded-full text-dark-400 font-semibold">
            CANCELLED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Match Info Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to="/matches" className="text-primary-400 hover:text-primary-300 mb-4 inline-flex items-center group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span className="ml-2">Back to Matches</span>
          </Link>
          
          <div className="glass rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-3">{match.title}</h1>
                <div className="flex items-center flex-wrap gap-4 text-dark-300">
                  <div className="flex items-center">
                    <FiCalendar className="mr-2 text-primary-500" />
                    <span>{format(new Date(match.matchDate), 'EEEE, MMMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center">
                    <FiClock className="mr-2 text-primary-500" />
                    <span>{format(new Date(match.matchDate), 'h:mm a')}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-primary-500 mr-2">🏆</span>
                    <span>{match.league}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge()}
                {countdown && !countdown.isExpired && match.status === 'UPCOMING' && (
                  <div className="flex items-center px-4 py-2 bg-primary-500/20 border border-primary-500/50 rounded-full">
                    <FiClock className="mr-2 text-primary-400" />
                    <span className="text-primary-400 font-semibold">
                      {formatCountdown(countdown)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Access Control */}
        {!accessGranted && match.status === 'UPCOMING' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-8 text-center mb-6 border border-primary-500/30"
          >
            <FiClock className="w-16 h-16 mx-auto mb-4 text-primary-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Match Starts Soon</h2>
            <p className="text-dark-300 mb-4">
              This match will be available 2 minutes before kickoff
            </p>
            {countdown && (
              <div className="inline-flex items-center px-6 py-3 bg-primary-500/20 rounded-full">
                <span className="text-primary-400 font-bold text-xl">
                  {formatCountdown(countdown)}
                </span>
              </div>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <div className="glass rounded-xl p-0 overflow-hidden border border-dark-700">
              <div className="relative bg-gradient-to-br from-black via-dark-900 to-black aspect-video">
                {accessGranted || match.status === 'LIVE' || match.status === 'FINISHED' ? (
                  selectedLink ? (
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
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <div className="text-center">
                      <FiClock className="w-16 h-16 mx-auto mb-4 text-primary-500 animate-pulse" />
                      <p className="text-xl font-semibold mb-2">Match Not Available Yet</p>
                      <p className="text-dark-400">
                        Stream will be available 2 minutes before kickoff
                      </p>
                      {countdown && (
                        <div className="mt-4 inline-flex items-center px-4 py-2 bg-primary-500/20 rounded-full">
                          <span className="text-primary-400 font-semibold">
                            {formatCountdown(countdown)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Stream Controls */}
              {match.streamingLinks && match.streamingLinks.length > 0 && (
                <div className="p-4 bg-dark-800 border-t border-dark-700">
                  <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-semibold">Switch Stream:</span>
                      <select
                        value={selectedLink?.id || ''}
                        onChange={(e) => {
                          const link = match.streamingLinks.find((l) => l.id === e.target.value);
                          if (link) {
                            setSelectedLink(link);
                            toast.success(`Switched to ${link.quality || link.type} stream`);
                          }
                        }}
                        className="input-field w-auto min-w-[200px]"
                      >
                        {match.streamingLinks.map((link, index) => (
                          <option key={link.id} value={link.id}>
                            {link.quality || link.type} {link.views > 0 && `(${link.views} views)`} {index === 0 && '⭐'}
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
                  {match.streamingLinks.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {match.streamingLinks.map((link) => (
                        <button
                          key={link.id}
                          onClick={() => {
                            setSelectedLink(link);
                            toast.success(`Switched to ${link.quality || link.type} stream`);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            selectedLink?.id === link.id
                              ? 'bg-primary-500 text-white'
                              : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
                          }`}
                        >
                          {link.quality || link.type}
                          {link.views > 0 && <span className="ml-1 opacity-75">({link.views})</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Match Details */}
            <div className="glass rounded-xl p-6 mt-6 border border-dark-700">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <FiUsers className="mr-2 text-primary-500" />
                Match Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-700">
                  <p className="text-dark-400 text-sm mb-2">Home Team</p>
                  <p className="text-white font-bold text-lg">{match.homeTeam}</p>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-700">
                  <p className="text-dark-400 text-sm mb-2">Away Team</p>
                  <p className="text-white font-bold text-lg">{match.awayTeam}</p>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-700">
                  <p className="text-dark-400 text-sm mb-2">League</p>
                  <p className="text-white font-semibold">{match.league}</p>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-700">
                  <p className="text-dark-400 text-sm mb-2">Status</p>
                  <div className="mt-1">{getStatusBadge()}</div>
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


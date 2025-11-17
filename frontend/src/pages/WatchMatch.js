import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios';
import toast from 'react-hot-toast';
import Hls from 'hls.js';
import { FiPlay, FiFlag, FiMessageCircle, FiClock, FiUsers, FiCalendar } from 'react-icons/fi';
import MatchChat from '../components/MatchChat';
import { calculateTimeRemaining, formatCountdown, canAccessMatch } from '../utils/countdown';
import { format } from 'date-fns';

// Helper function to get proxy URL for M3U8 streams
const getProxyUrl = (originalUrl) => {
  // Use axiosInstance baseURL to ensure consistency
  const API_URL = axiosInstance.defaults.baseURL || process.env.REACT_APP_API_URL || 'https://xstream-backend.vercel.app/api';
  return `${API_URL}/matches/proxy-m3u8?url=${encodeURIComponent(originalUrl)}`;
};

const WatchMatch = () => {
  const { id } = useParams();
  const videoRef = useRef(null);
  const [match, setMatch] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [hls, setHls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [accessGranted, setAccessGranted] = useState(false);
  const [playerType, setPlayerType] = useState('video'); // 'video', 'youtube', 'iframe'
  const [embedUrl, setEmbedUrl] = useState(null);

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
    if (selectedLink) {
      loadStream();
    }
  }, [selectedLink, accessGranted, match?.status]);

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

  // Helper function to extract YouTube video ID
  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Helper function to detect link type
  const detectLinkType = (url, type) => {
    const urlLower = url.toLowerCase();
    
    // Check for YouTube
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
      return 'youtube';
    }
    
    // Check for Vimeo
    if (urlLower.includes('vimeo.com')) {
      return 'vimeo';
    }
    
    // Check for IPTV/HLS/M3U8 streams - enhanced detection
    if (
      type === 'HLS' || 
      type === 'M3U8' || 
      urlLower.includes('.m3u8') || 
      urlLower.includes('.m3u') ||
      urlLower.includes('hls') ||
      urlLower.includes('application/x-mpegurl') ||
      urlLower.includes('application/vnd.apple.mpegurl') ||
      urlLower.match(/\.m3u8(\?|$|#)/i) ||
      urlLower.match(/\.m3u(\?|$|#)/i)
    ) {
      return 'hls';
    }
    
    // Check for iframe type
    if (type === 'IFRAME') {
      return 'iframe';
    }
    
    // Default to direct video
    return 'video';
  };

  // Helper function to get embed URL
  const getEmbedUrl = (url, type) => {
    const linkType = detectLinkType(url, type);
    
    if (linkType === 'youtube') {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      }
    }
    
    if (linkType === 'vimeo') {
      const vimeoId = url.match(/vimeo.com\/(\d+)/)?.[1];
      if (vimeoId) {
        return `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`;
      }
    }
    
    return null;
  };

  const loadStream = () => {
    if (!selectedLink) return;

    // Clean up previous HLS instance
    if (hls) {
      hls.destroy();
      setHls(null);
    }

    // Reset video element when switching streams
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
      videoRef.current.load(); // Reset the video element
    }

    const url = selectedLink.url;
    const type = selectedLink.type;
    const linkType = detectLinkType(url, type);

    // Handle YouTube
    if (linkType === 'youtube') {
      const embed = getEmbedUrl(url, type);
      if (embed) {
        setPlayerType('youtube');
        setEmbedUrl(embed);
        return;
      }
    }

    // Handle Vimeo
    if (linkType === 'vimeo') {
      const embed = getEmbedUrl(url, type);
      if (embed) {
        setPlayerType('iframe');
        setEmbedUrl(embed);
        return;
      }
    }

    // Handle iframe type
    if (linkType === 'iframe' || type === 'IFRAME') {
      setPlayerType('iframe');
      setEmbedUrl(url);
      return;
    }

    // Handle HLS/M3U8 streams
    if (linkType === 'hls' && videoRef.current) {
      setPlayerType('video');
      setEmbedUrl(null);
      
      if (Hls.isSupported()) {
        // Enhanced HLS configuration for live streams and IPTV
        const createHlsInstance = (useProxyUrl = false) => {
          return new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            liveSyncDurationCount: 3, // Reduce latency for live streams
            liveMaxLatencyDurationCount: 5,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            maxBufferSize: 60 * 1000 * 1000, // 60MB
            maxBufferHole: 0.5,
            highBufferWatchdogPeriod: 2,
            nudgeOffset: 0.1,
            nudgeMaxRetry: 5, // Increased retry attempts
            maxFragLoadingTimeOut: 60, // Increased timeout for IPTV streams
            fragLoadingTimeOut: 60, // Increased timeout for IPTV streams
            manifestLoadingTimeOut: 60, // Increased timeout for manifest loading (60s for slow IPTV)
            levelLoadingTimeOut: 60, // Timeout for level loading
            manifestLoadingMaxRetry: 5, // Retry manifest loading
            manifestLoadingRetryDelay: 1000, // Delay between retries
            levelLoadingMaxRetry: 5, // Retry level loading
            fragLoadingMaxRetry: 5, // Retry fragment loading
            fragLoadingRetryDelay: 1000, // Delay between fragment retries
            xhrSetup: (xhr, requestUrl) => {
              // Enhanced CORS handling for IPTV links
              xhr.withCredentials = false;
              // Set CORS mode
              if (xhr.setRequestHeader) {
                // Some IPTV providers require specific headers
                xhr.setRequestHeader('Accept', '*/*');
                xhr.setRequestHeader('Accept-Language', '*');
              }
            },
            // Enable better error recovery
            debug: false,
            capLevelToPlayerSize: true,
            startLevel: -1, // Auto-select best quality
            // Additional IPTV-friendly settings
            abrEwmaDefaultEstimate: 500000, // Default bitrate estimate
            abrBandWidthFactor: 0.95,
            abrBandWidthUpFactor: 0.7,
            maxStarvationDelay: 4,
            maxLoadingDelay: 4,
          });
        };

        let retryCount = 0;
        const maxRetries = 3;
        let useProxy = false; // Track if we're using proxy
        let hlsInstance = createHlsInstance();

        // Function to load source (direct or proxied)
        const loadHlsSource = (sourceUrl, isProxy = false) => {
          if (isProxy) {
            useProxy = true;
            const proxyUrl = getProxyUrl(sourceUrl);
            console.log('Loading M3U8 via proxy:', proxyUrl);
            hlsInstance.loadSource(proxyUrl);
          } else {
            console.log('Loading M3U8 directly:', sourceUrl);
            hlsInstance.loadSource(sourceUrl);
          }
        };

        // For M3U8 links, try direct access first (many streams have proper CORS)
        // Only use proxy if direct access fails with CORS
        console.log('Trying M3U8 stream with direct access first...');
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(videoRef.current);

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed successfully');
          retryCount = 0; // Reset retry count on successful manifest parse
          // Auto-play if match is LIVE or if access is granted (2 minutes before)
          if (match?.status === 'LIVE' || accessGranted) {
            videoRef.current?.play().catch((err) => {
              console.log('Auto-play prevented:', err);
            });
          }
        });

        hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          console.log('HLS quality switched to level:', data.level);
        });

        hlsInstance.on(Hls.Events.FRAG_LOADED, () => {
          retryCount = 0; // Reset retry count on successful fragment load
        });

        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS Error:', {
            type: data.type,
            details: data.details,
            fatal: data.fatal,
            url: data.url || url,
            error: data.error,
            response: data.response,
            networkDetails: data.networkDetails,
          });

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log(`Network error (attempt ${retryCount + 1}/${maxRetries}), attempting to recover...`);
                
                // Provide more specific error messages
                let errorMessage = 'Network error';
                if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR) {
                  if (useProxy) {
                    errorMessage = 'Stream server is unreachable or blocking requests. The stream URL may be invalid or expired.';
                  } else {
                    errorMessage = 'Failed to load stream manifest. The stream may be unavailable or blocked.';
                  }
                } else if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT) {
                  if (useProxy) {
                    errorMessage = 'Stream server is not responding (timeout). The stream may be down or the URL expired.';
                  } else {
                    errorMessage = 'Stream manifest loading timeout. The server may be slow or unreachable.';
                  }
                } else if (data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR) {
                  errorMessage = 'Failed to load video segment. Trying to recover...';
                } else if (data.details === Hls.ErrorDetails.FRAG_LOAD_TIMEOUT) {
                  errorMessage = 'Video segment loading timeout. Trying to recover...';
                } else if (data.details === Hls.ErrorDetails.NETWORK_ERROR) {
                  errorMessage = 'Network connection error. Check your internet connection.';
                }

                // Increment retry count first
                retryCount++;
                
                if (retryCount <= maxRetries) {
                  // If this is the first retry and we haven't tried proxy yet, try proxy
                  // Only try proxy if it's a manifest load error (likely CORS)
                  if (retryCount === 1 && !useProxy && (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR || 
                      data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT)) {
                    console.log('Direct access failed, trying proxy...');
                    toast('Trying proxy...', { duration: 2000, icon: 'ℹ️' });
                    try {
                      hlsInstance.destroy();
                      // Create new HLS instance with same config but using proxy
                      const newHlsInstance = createHlsInstance();
                      newHlsInstance.attachMedia(videoRef.current);
                      
                      // Set up event handlers for new instance
                      newHlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                        console.log('HLS manifest parsed successfully via proxy');
                        retryCount = 0;
                        if (match?.status === 'LIVE' || accessGranted) {
                          videoRef.current?.play().catch((err) => {
                            console.log('Auto-play prevented:', err);
                          });
                        }
                      });

                      newHlsInstance.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
                        console.log('HLS quality switched to level:', data.level);
                      });

                      newHlsInstance.on(Hls.Events.FRAG_LOADED, () => {
                        retryCount = 0;
                      });

                      newHlsInstance.on(Hls.Events.ERROR, (event, data) => {
                        console.error('HLS Error (proxy):', data);
                        if (data.fatal) {
                          toast.error('Stream failed even with proxy. Trying next stream...', { duration: 4000 });
                          setTimeout(() => tryNextLink(), 2000);
                        }
                      });

                      loadHlsSource(url, true); // Use proxy
                      setHls(newHlsInstance);
                      return; // Exit early, let the new instance handle events
                    } catch (e) {
                      console.error('Failed to create proxy HLS instance:', e);
                    }
                  }
                  
                  toast.error(`${errorMessage} (Retry ${retryCount}/${maxRetries})`, { duration: 3000 });
                  
                  try {
                    // Try to recover by restarting the load
                    if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR || 
                        data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT) {
                      // For manifest errors, reload the source (use proxy if we're already using it)
                      loadHlsSource(url, useProxy);
                    } else {
                      // For fragment errors, try to start loading again
                      hlsInstance.startLoad();
                    }
                  } catch (e) {
                    console.error('Recovery attempt failed:', e);
                    if (retryCount >= maxRetries) {
                      toast.error('Unable to recover. Trying next stream...', { duration: 4000 });
                      setTimeout(() => tryNextLink(), 2000);
                    }
                  }
                } else {
                  console.error('Max retries reached, trying next link');
                  toast.error('Stream failed after multiple attempts. Trying next stream...', { duration: 4000 });
                  setTimeout(() => tryNextLink(), 2000);
                }
                break;

              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log(`Media error (attempt ${retryCount + 1}/${maxRetries}), attempting to recover...`);
                
                let mediaErrorMessage = 'Media playback error';
                if (data.details === Hls.ErrorDetails.FRAG_PARSING_ERROR) {
                  mediaErrorMessage = 'Video segment parsing error. Trying to recover...';
                } else if (data.details === Hls.ErrorDetails.FRAG_DECRYPT_ERROR) {
                  mediaErrorMessage = 'Video decryption error. The stream may be encrypted.';
                }

                if (retryCount < maxRetries) {
                  retryCount++;
                  toast.error(`${mediaErrorMessage} (Retry ${retryCount}/${maxRetries})`, { duration: 3000 });
                  
                  try {
                    hlsInstance.recoverMediaError();
                  } catch (e) {
                    console.error('Media recovery failed:', e);
                    if (retryCount >= maxRetries) {
                      toast.error('Unable to recover. Trying next stream...', { duration: 4000 });
                      setTimeout(() => tryNextLink(), 2000);
                    }
                  }
                } else {
                  console.error('Max retries reached, trying next link');
                  toast.error('Stream failed after multiple attempts. Trying next stream...', { duration: 4000 });
                  setTimeout(() => tryNextLink(), 2000);
                }
                break;

              default:
                console.error('Fatal error, destroying HLS instance:', {
                  type: data.type,
                  details: data.details,
                  error: data.error,
                  url: data.url || url,
                });
                
                // If proxy failed and we haven't tried direct yet, try direct
                if (useProxy && (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR || 
                    data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT ||
                    data.details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR)) {
                  console.log('Proxy failed, trying direct access...');
                  toast('Proxy failed. Trying direct access...', { duration: 2000, icon: 'ℹ️' });
                  try {
                    hlsInstance.destroy();
                    useProxy = false;
                    const newHlsInstance = createHlsInstance();
                    newHlsInstance.attachMedia(videoRef.current);
                    
                    newHlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                      console.log('HLS manifest parsed successfully via direct access');
                      retryCount = 0;
                      if (match?.status === 'LIVE' || accessGranted) {
                        videoRef.current?.play().catch((err) => {
                          console.log('Auto-play prevented:', err);
                        });
                      }
                    });

                    newHlsInstance.on(Hls.Events.ERROR, (event, data) => {
                      console.error('HLS Error (direct):', data);
                      if (data.fatal) {
                        toast.error(`Stream error: ${data.details || data.type}. Trying next stream...`, { duration: 4000 });
                        setTimeout(() => tryNextLink(), 2000);
                      }
                    });

                    loadHlsSource(url, false); // Try direct
                    setHls(newHlsInstance);
                    return;
                  } catch (e) {
                    console.error('Failed to create direct HLS instance:', e);
                  }
                }
                
                const errorDetails = data.details || data.type || 'Unknown error';
                toast.error(`Stream error: ${errorDetails}. Trying next stream...`, { duration: 4000 });
                hlsInstance.destroy();
                setTimeout(() => tryNextLink(), 2000);
                break;
            }
          } else {
            // Non-fatal errors, log but continue
            console.warn('Non-fatal HLS error:', data);
            // Don't show toast for non-fatal errors to avoid spam
          }
        });

        setHls(hlsInstance);
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari/iOS)
        console.log('Using native HLS support');
        videoRef.current.crossOrigin = 'anonymous';
        videoRef.current.src = url;
        
        videoRef.current.addEventListener('error', (e) => {
          console.error('Native HLS video error:', e);
          const error = videoRef.current.error;
          if (error) {
            let errorMessage = 'Video playback error';
            switch (error.code) {
              case error.MEDIA_ERR_ABORTED:
                errorMessage = 'Video playback aborted';
                break;
              case error.MEDIA_ERR_NETWORK:
                errorMessage = 'Network error while loading video';
                break;
              case error.MEDIA_ERR_DECODE:
                errorMessage = 'Video decoding error';
                break;
              case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = 'Video format not supported';
                break;
            }
            toast.error(errorMessage);
            tryNextLink();
          }
        });

        videoRef.current.addEventListener('loadedmetadata', () => {
          if (match?.status === 'LIVE' || accessGranted) {
            videoRef.current.play().catch((err) => {
              console.log('Auto-play prevented:', err);
            });
          }
        });
      } else {
        toast.error('HLS playback not supported in this browser. Please use Chrome, Firefox, or Safari.');
      }
      return;
    }

    // Handle direct video (MP4, etc.)
    if (videoRef.current) {
      setPlayerType('video');
      setEmbedUrl(null);
      videoRef.current.src = url;
      videoRef.current.load(); // Force reload with new source
      // Auto-play if match is LIVE or if access is granted (2 minutes before)
      if (match?.status === 'LIVE' || accessGranted) {
        videoRef.current.play().catch((err) => {
          console.log('Auto-play prevented:', err);
        });
      }
    }
  };

  const tryNextLink = () => {
    if (!match || !match.streamingLinks) return;

    const currentIndex = match.streamingLinks.findIndex((l) => l.id === selectedLink?.id);
    const nextLink = match.streamingLinks[currentIndex + 1];

    if (nextLink) {
      toast('Trying next stream...', { icon: '🔄', duration: 2000 });
      setSelectedLink(nextLink);
    } else {
      toast.error(
        'All streams failed. The stream servers may be down or the URLs may be expired. Please try again later or contact support.',
        { duration: 6000 }
      );
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
                    {match.leagueLogo ? (
                      <img src={match.leagueLogo} alt={match.league} className="h-6 w-6 mr-2 object-contain" onError={(e) => e.target.style.display = 'none'} />
                    ) : (
                      <span className="text-primary-500 mr-2">🏆</span>
                    )}
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
                      {playerType === 'youtube' && embedUrl ? (
                        <iframe
                          key={`youtube-${selectedLink?.id}`}
                          src={embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={match.title}
                          frameBorder="0"
                        />
                      ) : playerType === 'iframe' && embedUrl ? (
                        <iframe
                          key={`iframe-${selectedLink?.id}`}
                          src={embedUrl}
                          className="w-full h-full"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          title={match.title}
                          frameBorder="0"
                        />
                      ) : (
                        <video
                          key={`video-${selectedLink?.id}`}
                          ref={videoRef}
                          controls
                          className="w-full h-full"
                          playsInline
                          crossOrigin="anonymous"
                          preload="metadata"
                          onError={(e) => {
                            console.error('Video error:', e);
                            toast.error('Video playback error. Trying next stream...');
                            tryNextLink();
                          }}
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
                            {link.quality || link.type} {index === 0 && '⭐'}
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
                  <div className="flex items-center space-x-3">
                    {match.homeTeamLogo && (
                      <img src={match.homeTeamLogo} alt={match.homeTeam} className="h-10 w-10 object-contain" onError={(e) => e.target.style.display = 'none'} />
                    )}
                    <p className="text-white font-bold text-lg">{match.homeTeam}</p>
                  </div>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-700">
                  <p className="text-dark-400 text-sm mb-2">Away Team</p>
                  <div className="flex items-center space-x-3">
                    {match.awayTeamLogo && (
                      <img src={match.awayTeamLogo} alt={match.awayTeam} className="h-10 w-10 object-contain" onError={(e) => e.target.style.display = 'none'} />
                    )}
                    <p className="text-white font-bold text-lg">{match.awayTeam}</p>
                  </div>
                </div>
                <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-700">
                  <p className="text-dark-400 text-sm mb-2">League</p>
                  <div className="flex items-center space-x-3">
                    {match.leagueLogo && (
                      <img src={match.leagueLogo} alt={match.league} className="h-8 w-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
                    )}
                    <p className="text-white font-semibold">{match.league}</p>
                  </div>
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
            {/* Match Chat */}
            <MatchChat matchId={id} />

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


import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize } from 'react-icons/fi';
import toast from 'react-hot-toast';

const HighlightPlayer = ({ videoLinks, title }) => {
  const videoRef = useRef(null);
  const [hls, setHls] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedLink, setSelectedLink] = useState(videoLinks[0] || '');

  useEffect(() => {
    if (!videoRef.current || !selectedLink) return;

    // Check if it's a YouTube URL
    if (selectedLink.includes('youtube.com') || selectedLink.includes('youtu.be')) {
      // Extract YouTube video ID
      const videoId = extractYouTubeId(selectedLink);
      if (videoId) {
        // Use YouTube iframe embed
        return;
      }
    }

    // Check if it's a Vimeo URL
    if (selectedLink.includes('vimeo.com')) {
      const videoId = extractVimeoId(selectedLink);
      if (videoId) {
        // Use Vimeo iframe embed
        return;
      }
    }

    // Handle HLS/M3U8 streams
    if (selectedLink.includes('.m3u8') || selectedLink.includes('hls')) {
      if (Hls.isSupported()) {
        const hlsInstance = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hlsInstance.loadSource(selectedLink);
        hlsInstance.attachMedia(videoRef.current);

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          setDuration(videoRef.current.duration);
        });

        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            toast.error('Stream error. Trying next source...');
            tryNextLink();
          }
        });

        setHls(hlsInstance);
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        videoRef.current.src = selectedLink;
      }
    } else {
      // Direct video (MP4, etc.)
      videoRef.current.src = selectedLink;
    }

    // Event listeners
    const video = videoRef.current;
    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      if (hls) {
        hls.destroy();
      }
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [selectedLink]);

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const extractVimeoId = (url) => {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const tryNextLink = () => {
    const currentIndex = videoLinks.indexOf(selectedLink);
    const nextLink = videoLinks[currentIndex + 1];
    if (nextLink) {
      setSelectedLink(nextLink);
    } else {
      toast.error('All video sources failed');
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) {
      videoRef.current.currentTime = pos * duration;
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isYouTube = selectedLink.includes('youtube.com') || selectedLink.includes('youtu.be');
  const isVimeo = selectedLink.includes('vimeo.com');

  if (isYouTube) {
    const videoId = extractYouTubeId(selectedLink);
    return (
      <div className="relative w-full bg-dark-900 rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isVimeo) {
    const videoId = extractVimeoId(selectedLink);
    return (
      <div className="relative w-full bg-dark-900 rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1`}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative w-full bg-dark-900 rounded-lg overflow-hidden group">
      <video
        ref={videoRef}
        className="w-full"
        playsInline
        onClick={togglePlay}
      />

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-dark-900/90 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress Bar */}
        <div
          className="w-full h-1 bg-dark-700 rounded-full mb-3 cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePlay}
              className="text-white hover:text-primary-400 transition-colors"
            >
              {playing ? <FiPause size={20} /> : <FiPlay size={20} />}
            </button>
            <button
              onClick={toggleMute}
              className="text-white hover:text-primary-400 transition-colors"
            >
              {muted ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
            </button>
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {videoLinks.length > 1 && (
            <select
              value={selectedLink}
              onChange={(e) => setSelectedLink(e.target.value)}
              className="bg-dark-800 text-white text-sm px-3 py-1 rounded border border-dark-700"
            >
              {videoLinks.map((link, index) => (
                <option key={index} value={link}>
                  Source {index + 1}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => videoRef.current?.requestFullscreen()}
            className="text-white hover:text-primary-400 transition-colors"
          >
            <FiMaximize size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HighlightPlayer;


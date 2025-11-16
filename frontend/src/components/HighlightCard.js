import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPlay, FiEye, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';

const HighlightCard = ({ highlight, index }) => {
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      data-aos="fade-up"
      data-aos-delay={index * 100}
      className="card group cursor-pointer overflow-hidden hover:border-primary-500 transition-all"
    >
      <Link to={`/highlights/${highlight.id}`}>
        <div className="relative h-48 overflow-hidden bg-dark-800">
          <img
            src={highlight.thumbnailUrl}
            alt={highlight.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x225?text=No+Thumbnail';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent" />
          <div className="absolute top-2 right-2 bg-primary-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
            <FiPlay className="w-3 h-3" />
            <span>Highlight</span>
          </div>
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1 bg-dark-900/70 px-2 py-1 rounded">
                <FiClock className="w-3 h-3" />
                <span>{formatDuration(highlight.duration)}</span>
              </span>
              {/* Score Badge */}
              {(highlight.homeScore !== null && highlight.homeScore !== undefined) || 
               (highlight.awayScore !== null && highlight.awayScore !== undefined) ? (
                <span className="bg-primary-500/90 px-2 py-1 rounded font-bold">
                  {highlight.homeScore ?? 0} - {highlight.awayScore ?? 0}
                </span>
              ) : null}
            </div>
            <div className="flex items-center space-x-1 bg-dark-900/70 px-2 py-1 rounded">
              <FiEye className="w-3 h-3" />
              <span>{highlight.views.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-2">
            <span className="text-primary-400 text-xs font-semibold">{highlight.league}</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
            {highlight.title}
          </h3>
          
          {/* Match Score Display */}
          {(highlight.homeScore !== null && highlight.homeScore !== undefined) || 
           (highlight.awayScore !== null && highlight.awayScore !== undefined) ? (
            <div className="mb-2 flex items-center space-x-2">
              <div className="flex items-center space-x-2 bg-dark-800 px-3 py-1.5 rounded-lg">
                <span className="text-white font-bold text-lg">
                  {highlight.homeScore ?? 0}
                </span>
                <span className="text-dark-400">-</span>
                <span className="text-white font-bold text-lg">
                  {highlight.awayScore ?? 0}
                </span>
              </div>
            </div>
          ) : null}
          
          {highlight.description && (
            <p className="text-dark-400 text-sm line-clamp-2 mb-2">{highlight.description}</p>
          )}
          <p className="text-dark-500 text-xs">
            {format(new Date(highlight.createdAt), 'MMM dd, yyyy')}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

export default HighlightCard;


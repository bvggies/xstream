import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios';
import { format } from 'date-fns';
import { FiPlay, FiClock, FiUsers, FiVideo } from 'react-icons/fi';

const Home = () => {
  const [matches, setMatches] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightsLoading, setHighlightsLoading] = useState(true);

  // Define functions before using them in useEffect
  const fetchMatches = async () => {
    try {
      const response = await axiosInstance.get('/matches?status=LIVE,UPCOMING');
      if (response && response.data && Array.isArray(response.data.matches)) {
        setMatches(response.data.matches);
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      setMatches([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedHighlights = async () => {
    try {
      const response = await axiosInstance.get('/highlights?sort=mostViewed');
      if (response && response.data && Array.isArray(response.data.highlights)) {
        const topHighlights = response.data.highlights.slice(0, 3);
        setHighlights(topHighlights);
      } else {
        setHighlights([]);
      }
    } catch (error) {
      console.error('Failed to fetch highlights:', error);
      setHighlights([]); // Set empty array on error
    } finally {
      setHighlightsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch data but don't block rendering if it fails
    fetchMatches().catch(err => {
      console.error('Matches fetch error:', err);
      setMatches([]);
      setLoading(false);
    });
    
    fetchFeaturedHighlights().catch(err => {
      console.error('Highlights fetch error:', err);
      setHighlights([]);
      setHighlightsLoading(false);
    });
    
    const interval = setInterval(() => {
      fetchMatches().catch(err => {
        console.error('Matches fetch error:', err);
        setMatches([]);
      });
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const liveMatches = Array.isArray(matches) ? matches.filter((m) => m.status === 'LIVE') : [];
  const upcomingMatches = Array.isArray(matches) 
    ? matches.filter((m) => m.status === 'UPCOMING').slice(0, 6)
    : [];
  
  // Sort upcoming matches by date
  if (upcomingMatches.length > 0) {
    upcomingMatches.sort((a, b) => new Date(a.matchDate) - new Date(b.matchDate));
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-dark-900">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-900/90 via-dark-900/70 to-dark-900" />
        
        <div className="relative z-10 text-center px-4">
          <motion.img
            src="/logo.png"
            alt="Xstream"
            className="h-24 mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Xstream
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-dark-300 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Live Football Streaming Platform
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link to="/matches" className="btn-primary text-lg px-8 py-4">
              Watch Live Matches
            </Link>
            <Link to="/register" className="btn-secondary text-lg px-8 py-4">
              Get Started
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1 h-3 bg-white/50 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Live Matches Section */}
      {liveMatches.length > 0 && (
        <section className="py-16 bg-dark-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <h2 className="text-3xl font-bold text-white">Live Now</h2>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveMatches.map((match, index) => (
                <MatchCard key={match.id} match={match} index={index} isLive />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Highlights Section */}
      <section className="py-16 bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Featured Highlights</h2>
              <p className="text-dark-400">Watch the best moments from recent matches</p>
            </div>
            <Link
              to="/highlights"
              className="btn-secondary flex items-center space-x-2"
            >
              <span>View All</span>
              <span>→</span>
            </Link>
          </motion.div>
          
          {highlightsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card skeleton h-64" />
              ))}
            </div>
          ) : highlights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {highlights.map((highlight, index) => (
                <motion.div
                  key={highlight.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="card group cursor-pointer overflow-hidden hover:border-primary-500 transition-all"
                >
                  <Link to={`/highlights/${highlight.id}`}>
                    <div className="relative h-40 overflow-hidden bg-dark-800">
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
                        <FiVideo className="w-3 h-3" />
                        <span>Highlight</span>
                      </div>
                      {(highlight.homeScore !== null || highlight.awayScore !== null) && (
                        <div className="absolute bottom-2 left-2 bg-primary-500/90 px-2 py-1 rounded text-xs font-bold">
                          {highlight.homeScore ?? 0} - {highlight.awayScore ?? 0}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <span className="text-primary-400 text-xs font-semibold">{highlight.league}</span>
                      <h3 className="text-lg font-bold text-white mt-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
                        {highlight.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2 text-xs text-dark-400">
                        <span>{highlight.views.toLocaleString()} views</span>
                        <span>{format(new Date(highlight.createdAt), 'MMM dd')}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-dark-400">No highlights available yet</p>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Matches Section */}
      <section className="py-16 bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white mb-8"
          >
            Upcoming Matches
          </motion.h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card skeleton h-64" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingMatches.map((match, index) => (
                <MatchCard key={match.id} match={match} index={index} />
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/matches" className="btn-primary">
              View All Matches
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-white text-center mb-12"
          >
            Why Choose Xstream?
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <FiPlay className="w-12 h-12" />,
                title: 'Live Streaming',
                description: 'Watch live football matches in HD quality with multiple streaming sources.',
              },
              {
                icon: <FiClock className="w-12 h-12" />,
                title: 'Match Reminders',
                description: 'Get notified before your favorite matches start.',
              },
              {
                icon: <FiUsers className="w-12 h-12" />,
                title: 'Community',
                description: 'Join thousands of football fans watching together.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card text-center"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <div className="text-primary-500 mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-dark-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const MatchCard = ({ match, index, isLive = false }) => {
  const matchDate = new Date(match.matchDate);
  const isUpcoming = match.status === 'UPCOMING';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="card hover:border-primary-500 transition-all cursor-pointer group"
      data-aos="fade-up"
      data-aos-delay={index * 100}
    >
      {match.thumbnail && (
        <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
          <img
            src={match.thumbnail}
            alt={match.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {isLive && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>LIVE</span>
            </div>
          )}
        </div>
      )}

      {/* League Logo */}
      <div className="mb-3 flex items-center space-x-2">
        {match.leagueLogo && (
          <div className="w-6 h-6 rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden">
            <img 
              src={match.leagueLogo} 
              alt={match.league} 
              className="w-full h-full object-contain"
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        )}
        <span className="text-primary-400 text-sm font-semibold">{match.league}</span>
      </div>

      <h3 className="text-xl font-bold text-white mb-3">{match.title}</h3>
      
      {/* Teams with Logos */}
      <div className="flex items-center justify-center space-x-3 mb-4">
        <div className="flex items-center space-x-2">
          {match.homeTeamLogo && (
            <div className="w-8 h-8 rounded-full bg-white p-1 flex items-center justify-center overflow-hidden border border-dark-600">
              <img 
                src={match.homeTeamLogo} 
                alt={match.homeTeam} 
                className="w-full h-full object-contain"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          )}
          <span className="text-white text-sm font-medium">{match.homeTeam}</span>
        </div>
        <span className="text-dark-400 text-sm">vs</span>
        <div className="flex items-center space-x-2">
          {match.awayTeamLogo && (
            <div className="w-8 h-8 rounded-full bg-white p-1 flex items-center justify-center overflow-hidden border border-dark-600">
              <img 
                src={match.awayTeamLogo} 
                alt={match.awayTeam} 
                className="w-full h-full object-contain"
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          )}
          <span className="text-white text-sm font-medium">{match.awayTeam}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-dark-400 text-sm">
          <FiClock className="mr-2" />
          {isUpcoming ? format(matchDate, 'MMM dd, HH:mm') : 'Live Now'}
        </div>
        {match.streamingLinks && match.streamingLinks.length > 0 && (
          <Link
            to={`/watch/${match.id}`}
            className="btn-primary text-sm py-2 px-4"
          >
            Watch
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default Home;


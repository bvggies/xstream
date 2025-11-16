import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios';
import { format } from 'date-fns';
import { FiPlay, FiClock, FiFilter } from 'react-icons/fi';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, LIVE, UPCOMING
  const [leagueFilter, setLeagueFilter] = useState('');
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [filter, leagueFilter]);

  const fetchMatches = async () => {
    try {
      const params = {};
      if (filter === 'LIVE') params.status = 'LIVE';
      if (filter === 'UPCOMING') params.status = 'UPCOMING';
      if (leagueFilter) params.league = leagueFilter;

      const response = await axiosInstance.get('/matches', { params });
      const matchesData = response.data.matches || [];
      setMatches(matchesData);

      // Extract unique leagues
      const uniqueLeagues = [...new Set(matchesData.map((m) => m.league))];
      setLeagues(uniqueLeagues);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Matches</h1>
          <p className="text-dark-400">Watch live and upcoming football matches</p>
        </motion.div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <FiFilter className="text-dark-400" />
              <span className="text-white font-semibold">Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'LIVE', 'UPCOMING'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    filter === status
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <select
              value={leagueFilter}
              onChange={(e) => setLeagueFilter(e.target.value)}
              className="input-field w-full md:w-auto"
            >
              <option value="">All Leagues</option>
              {leagues.map((league) => (
                <option key={league} value={league}>
                  {league}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Matches Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card skeleton h-64" />
            ))}
          </div>
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match, index) => (
              <MatchCard key={match.id} match={match} index={index} />
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-dark-400 text-lg">No matches found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MatchCard = ({ match, index }) => {
  const isLive = match.status === 'LIVE';
  const matchDate = new Date(match.matchDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card hover:border-primary-500 transition-all group"
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

      <div className="mb-2">
        <span className="text-primary-400 text-sm font-semibold">{match.league}</span>
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{match.title}</h3>
      <p className="text-dark-400 text-sm mb-4">
        {match.homeTeam} vs {match.awayTeam}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center text-dark-400 text-sm">
          <FiClock className="mr-2" />
          {isLive ? 'Live Now' : format(matchDate, 'MMM dd, HH:mm')}
        </div>
        {match.streamingLinks && match.streamingLinks.length > 0 ? (
          <Link
            to={`/watch/${match.id}`}
            className="btn-primary text-sm py-2 px-4 flex items-center"
          >
            <FiPlay className="mr-1" />
            Watch
          </Link>
        ) : (
          <span className="text-dark-500 text-sm">No streams</span>
        )}
      </div>
    </motion.div>
  );
};

export default Matches;


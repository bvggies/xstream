import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiFilter, FiX } from 'react-icons/fi';
import axiosInstance from '../utils/axios';

const HighlightFilters = ({ onFilterChange }) => {
  const [leagues, setLeagues] = useState([]);
  const [filters, setFilters] = useState({
    league: '',
    team: '',
    date: '',
    sort: 'newest',
  });

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await axiosInstance.get('/highlights');
      const uniqueLeagues = [...new Set(response.data.highlights.map((h) => h.league))];
      setLeagues(uniqueLeagues.sort());
    } catch (error) {
      console.error('Failed to fetch leagues:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      league: '',
      team: '',
      date: '',
      sort: 'newest',
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = filters.league || filters.team || filters.date || filters.sort !== 'newest';

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <FiFilter className="text-dark-400" />
          <span className="text-white font-semibold">Filters:</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={filters.league}
            onChange={(e) => handleFilterChange('league', e.target.value)}
            className="input-field w-full md:w-auto"
          >
            <option value="">All Leagues</option>
            {leagues.map((league) => (
              <option key={league} value={league}>
                {league}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={filters.team}
            onChange={(e) => handleFilterChange('team', e.target.value)}
            placeholder="Search team..."
            className="input-field w-full md:w-auto"
          />

          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            className="input-field w-full md:w-auto"
          />

          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="input-field w-full md:w-auto"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="mostViewed">Most Viewed</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn-secondary flex items-center space-x-2 px-4 py-2"
            >
              <FiX />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default HighlightFilters;


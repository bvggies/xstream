import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axiosInstance from '../utils/axios';
import HighlightGrid from '../components/HighlightGrid';
import HighlightFilters from '../components/HighlightFilters';
import { FiVideo } from 'react-icons/fi';

const Highlights = () => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    league: '',
    team: '',
    date: '',
    sort: 'newest',
  });

  useEffect(() => {
    fetchHighlights();
  }, [filters]);

  const fetchHighlights = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.league) params.league = filters.league;
      if (filters.team) params.team = filters.team;
      if (filters.date) params.date = filters.date;
      if (filters.sort) params.sort = filters.sort;

      const response = await axiosInstance.get('/highlights', { params });
      setHighlights(response.data.highlights || []);
    } catch (error) {
      console.error('Failed to fetch highlights:', error);
      setHighlights([]);
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
          <div className="flex items-center space-x-3 mb-2">
            <FiVideo className="text-primary-500 text-4xl" />
            <h1 className="text-4xl font-bold text-white">Highlights</h1>
          </div>
          <p className="text-dark-400">Watch replay clips from finished matches</p>
        </motion.div>

        <HighlightFilters onFilterChange={setFilters} />

        <HighlightGrid highlights={highlights} loading={loading} />
      </div>
    </div>
  );
};

export default Highlights;


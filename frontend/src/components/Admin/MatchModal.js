import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axiosInstance from '../../utils/axios';
import toast from 'react-hot-toast';
import { FiX, FiSearch } from 'react-icons/fi';
import { popularTeams, getTeamLogo } from '../../data/teams';
import { popularLeagues, getLeagueLogo } from '../../data/leagues';

const MatchModal = ({ match, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    homeTeam: '',
    awayTeam: '',
    homeTeamLogo: '',
    awayTeamLogo: '',
    league: '',
    leagueLogo: '',
    matchDate: '',
    status: 'UPCOMING',
  });
  const [streamingLinks, setStreamingLinks] = useState([]);
  const [newLink, setNewLink] = useState({ url: '', type: 'HLS', quality: 'HD' });
  const [loading, setLoading] = useState(false);
  const [showTeamSelector, setShowTeamSelector] = useState({ home: false, away: false });
  const [showLeagueSelector, setShowLeagueSelector] = useState(false);
  const [teamSearch, setTeamSearch] = useState({ home: '', away: '' });
  const [leagueSearch, setLeagueSearch] = useState('');

  useEffect(() => {
    if (match) {
      setFormData({
        title: match.title || '',
        homeTeam: match.homeTeam || '',
        awayTeam: match.awayTeam || '',
        homeTeamLogo: match.homeTeamLogo || getTeamLogo(match.homeTeam) || '',
        awayTeamLogo: match.awayTeamLogo || getTeamLogo(match.awayTeam) || '',
        league: match.league || '',
        leagueLogo: match.leagueLogo || getLeagueLogo(match.league) || '',
        matchDate: match.matchDate ? new Date(match.matchDate).toISOString().slice(0, 16) : '',
        status: match.status || 'UPCOMING',
      });
      setStreamingLinks(match.streamingLinks || []);
    }
  }, [match]);

  const selectTeam = (team, type) => {
    const logo = getTeamLogo(team.name);
    if (type === 'home') {
      setFormData({ ...formData, homeTeam: team.name, homeTeamLogo: logo || formData.homeTeamLogo });
      setShowTeamSelector({ ...showTeamSelector, home: false });
      setTeamSearch({ ...teamSearch, home: '' });
    } else {
      setFormData({ ...formData, awayTeam: team.name, awayTeamLogo: logo || formData.awayTeamLogo });
      setShowTeamSelector({ ...showTeamSelector, away: false });
      setTeamSearch({ ...teamSearch, away: '' });
    }
  };

  const selectLeague = (league) => {
    const logo = getLeagueLogo(league.name);
    setFormData({ ...formData, league: league.name, leagueLogo: logo || formData.leagueLogo });
    setShowLeagueSelector(false);
    setLeagueSearch('');
  };

  const filteredTeams = (type) => {
    const search = type === 'home' ? teamSearch.home : teamSearch.away;
    if (!search) return popularTeams;
    return popularTeams.filter(team =>
      team.name.toLowerCase().includes(search.toLowerCase())
    );
  };

  const filteredLeagues = () => {
    if (!leagueSearch) return popularLeagues;
    return popularLeagues.filter(league =>
      league.name.toLowerCase().includes(leagueSearch.toLowerCase()) ||
      league.country.toLowerCase().includes(leagueSearch.toLowerCase())
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key]);
      });

      const thumbnailInput = document.querySelector('input[type="file"]');
      if (thumbnailInput?.files[0]) {
        formDataToSend.append('thumbnail', thumbnailInput.files[0]);
      }

      let matchId;
      if (match) {
        // Update existing match
        const updateResponse = await axiosInstance.put(`/admin/matches/${match.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        matchId = match.id;
        toast.success('Match updated');
        
        // Update streaming links - delete old ones and add new ones
        if (match.streamingLinks) {
          // Delete existing links
          for (const link of match.streamingLinks) {
            try {
              await axiosInstance.delete(`/admin/matches/${matchId}/links/${link.id}`);
            } catch (err) {
              console.error('Failed to delete link:', err);
            }
          }
        }
      } else {
        // Create new match
        const response = await axiosInstance.post('/admin/matches', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        matchId = response.data.match.id;
        toast.success('Match created');
      }
      
      // Add all streaming links
      if (streamingLinks.length > 0) {
        for (const link of streamingLinks) {
          if (link.url && link.url.trim()) {
            try {
              await axiosInstance.post(`/admin/matches/${matchId}/links`, {
                url: link.url,
                type: link.type,
                quality: link.quality || 'HD',
              });
            } catch (err) {
              console.error('Failed to add link:', err);
              toast.error(`Failed to add link: ${link.url}`);
            }
          }
        }
      }
      
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save match');
    } finally {
      setLoading(false);
    }
  };

  const addStreamingLink = () => {
    if (newLink.url) {
      setStreamingLinks([...streamingLinks, { ...newLink, id: Date.now() }]);
      setNewLink({ url: '', type: 'HLS', quality: 'HD' });
    }
  };

  const removeStreamingLink = (index) => {
    setStreamingLinks(streamingLinks.filter((_, i) => i !== index));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-dark-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-dark-700 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {match ? 'Edit Match' : 'Add Match'}
            </h2>
            <button onClick={onClose} className="text-dark-400 hover:text-white">
              <FiX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              {/* League */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white mb-2">League</label>
                <div className="relative">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={formData.league}
                        onChange={(e) => {
                          setFormData({ ...formData, league: e.target.value });
                          setShowLeagueSelector(false);
                        }}
                        onFocus={() => setShowLeagueSelector(true)}
                        placeholder="Select or type league name"
                        className="input-field pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLeagueSelector(!showLeagueSelector)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                      >
                        <FiSearch />
                      </button>
                    </div>
                    {formData.leagueLogo && (
                      <div className="relative group">
                        <img 
                          src={formData.leagueLogo} 
                          alt="League logo" 
                          className="h-10 w-10 object-contain rounded border border-dark-600 cursor-pointer hover:border-primary-500 transition-colors" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="hidden absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded">✕</div>
                        {/* Preview on hover */}
                        <div className="hidden group-hover:block absolute top-12 left-0 z-20 bg-dark-800 border border-dark-700 rounded-lg p-3 shadow-2xl">
                          <p className="text-white text-xs mb-2 font-semibold">Logo Preview</p>
                          <img 
                            src={formData.leagueLogo} 
                            alt="Preview" 
                            className="h-24 w-24 object-contain bg-white rounded p-2"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                          <p className="text-dark-400 text-xs mt-2 max-w-[200px] truncate" title={formData.leagueLogo}>
                            {formData.leagueLogo}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {showLeagueSelector && (
                    <div className="absolute z-10 mt-1 w-full bg-dark-800 border border-dark-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      <div className="p-2 sticky top-0 bg-dark-800 border-b border-dark-700">
                        <input
                          type="text"
                          value={leagueSearch}
                          onChange={(e) => setLeagueSearch(e.target.value)}
                          placeholder="Search leagues..."
                          className="input-field w-full bg-dark-900"
                          autoFocus
                        />
                      </div>
                      <div className="p-2">
                        {filteredLeagues().map((league) => (
                          <button
                            key={league.name}
                            type="button"
                            onClick={() => selectLeague(league)}
                            className="w-full flex items-center space-x-3 p-2 hover:bg-dark-700 rounded-lg transition-colors text-left"
                          >
                            {league.logo && (
                              <img src={league.logo} alt={league.name} className="h-8 w-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
                            )}
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium">{league.name}</p>
                              <p className="text-dark-400 text-xs">{league.country}</p>
                            </div>
                          </button>
                        ))}
                        {filteredLeagues().length === 0 && (
                          <p className="text-dark-400 text-sm p-2 text-center">No leagues found</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-white mb-2">League Logo URL (optional)</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={formData.leagueLogo}
                      onChange={(e) => setFormData({ ...formData, leagueLogo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="input-field"
                    />
                    {formData.leagueLogo && (
                      <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                        <p className="text-white text-sm font-semibold mb-2">Logo Preview</p>
                        <div className="flex items-center space-x-4">
                          <div className="bg-white rounded-lg p-3 flex items-center justify-center">
                            <img 
                              src={formData.leagueLogo} 
                              alt="League logo preview" 
                              className="h-20 w-20 object-contain"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23ccc" font-size="12"%3EInvalid%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-dark-400 text-xs break-all">{formData.leagueLogo}</p>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, leagueLogo: '' })}
                              className="mt-2 text-red-400 hover:text-red-300 text-xs"
                            >
                              Remove logo
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Home Team */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Home Team</label>
                <div className="relative">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={formData.homeTeam}
                        onChange={(e) => {
                          setFormData({ ...formData, homeTeam: e.target.value });
                          setShowTeamSelector({ ...showTeamSelector, home: false });
                        }}
                        onFocus={() => setShowTeamSelector({ ...showTeamSelector, home: true })}
                        placeholder="Select or type team name"
                        className="input-field pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowTeamSelector({ ...showTeamSelector, home: !showTeamSelector.home })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                      >
                        <FiSearch />
                      </button>
                    </div>
                    {formData.homeTeamLogo && (
                      <div className="relative group">
                        <img 
                          src={formData.homeTeamLogo} 
                          alt="Home team logo" 
                          className="h-10 w-10 object-contain rounded border border-dark-600 cursor-pointer hover:border-primary-500 transition-colors" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="hidden absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded">✕</div>
                        {/* Preview on hover */}
                        <div className="hidden group-hover:block absolute top-12 left-0 z-20 bg-dark-800 border border-dark-700 rounded-lg p-3 shadow-2xl">
                          <p className="text-white text-xs mb-2 font-semibold">Logo Preview</p>
                          <img 
                            src={formData.homeTeamLogo} 
                            alt="Preview" 
                            className="h-24 w-24 object-contain bg-white rounded p-2"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                          <p className="text-dark-400 text-xs mt-2 max-w-[200px] truncate" title={formData.homeTeamLogo}>
                            {formData.homeTeamLogo}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {showTeamSelector.home && (
                    <div className="absolute z-10 mt-1 w-full bg-dark-800 border border-dark-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      <div className="p-2 sticky top-0 bg-dark-800 border-b border-dark-700">
                        <input
                          type="text"
                          value={teamSearch.home}
                          onChange={(e) => setTeamSearch({ ...teamSearch, home: e.target.value })}
                          placeholder="Search teams..."
                          className="input-field w-full bg-dark-900"
                          autoFocus
                        />
                      </div>
                      <div className="p-2">
                        {filteredTeams('home').map((team) => (
                          <button
                            key={team.name}
                            type="button"
                            onClick={() => selectTeam(team, 'home')}
                            className="w-full flex items-center space-x-3 p-2 hover:bg-dark-700 rounded-lg transition-colors text-left"
                          >
                            {team.logo && (
                              <img src={team.logo} alt={team.name} className="h-8 w-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
                            )}
                            <p className="text-white text-sm font-medium">{team.name}</p>
                          </button>
                        ))}
                        {filteredTeams('home').length === 0 && (
                          <p className="text-dark-400 text-sm p-2 text-center">No teams found</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-white mb-2">Home Team Logo URL (optional)</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={formData.homeTeamLogo}
                      onChange={(e) => setFormData({ ...formData, homeTeamLogo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="input-field"
                    />
                    {formData.homeTeamLogo && (
                      <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                        <p className="text-white text-sm font-semibold mb-2">Logo Preview</p>
                        <div className="flex items-center space-x-4">
                          <div className="bg-white rounded-lg p-3 flex items-center justify-center">
                            <img 
                              src={formData.homeTeamLogo} 
                              alt="Home team logo preview" 
                              className="h-20 w-20 object-contain"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23ccc" font-size="12"%3EInvalid%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-dark-400 text-xs break-all">{formData.homeTeamLogo}</p>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, homeTeamLogo: '' })}
                              className="mt-2 text-red-400 hover:text-red-300 text-xs"
                            >
                              Remove logo
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Away Team */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Away Team</label>
                <div className="relative">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={formData.awayTeam}
                        onChange={(e) => {
                          setFormData({ ...formData, awayTeam: e.target.value });
                          setShowTeamSelector({ ...showTeamSelector, away: false });
                        }}
                        onFocus={() => setShowTeamSelector({ ...showTeamSelector, away: true })}
                        placeholder="Select or type team name"
                        className="input-field pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowTeamSelector({ ...showTeamSelector, away: !showTeamSelector.away })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                      >
                        <FiSearch />
                      </button>
                    </div>
                    {formData.awayTeamLogo && (
                      <div className="relative group">
                        <img 
                          src={formData.awayTeamLogo} 
                          alt="Away team logo" 
                          className="h-10 w-10 object-contain rounded border border-dark-600 cursor-pointer hover:border-primary-500 transition-colors" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="hidden absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded">✕</div>
                        {/* Preview on hover */}
                        <div className="hidden group-hover:block absolute top-12 left-0 z-20 bg-dark-800 border border-dark-700 rounded-lg p-3 shadow-2xl">
                          <p className="text-white text-xs mb-2 font-semibold">Logo Preview</p>
                          <img 
                            src={formData.awayTeamLogo} 
                            alt="Preview" 
                            className="h-24 w-24 object-contain bg-white rounded p-2"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                          <p className="text-dark-400 text-xs mt-2 max-w-[200px] truncate" title={formData.awayTeamLogo}>
                            {formData.awayTeamLogo}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  {showTeamSelector.away && (
                    <div className="absolute z-10 mt-1 w-full bg-dark-800 border border-dark-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      <div className="p-2 sticky top-0 bg-dark-800 border-b border-dark-700">
                        <input
                          type="text"
                          value={teamSearch.away}
                          onChange={(e) => setTeamSearch({ ...teamSearch, away: e.target.value })}
                          placeholder="Search teams..."
                          className="input-field w-full bg-dark-900"
                          autoFocus
                        />
                      </div>
                      <div className="p-2">
                        {filteredTeams('away').map((team) => (
                          <button
                            key={team.name}
                            type="button"
                            onClick={() => selectTeam(team, 'away')}
                            className="w-full flex items-center space-x-3 p-2 hover:bg-dark-700 rounded-lg transition-colors text-left"
                          >
                            {team.logo && (
                              <img src={team.logo} alt={team.name} className="h-8 w-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
                            )}
                            <p className="text-white text-sm font-medium">{team.name}</p>
                          </button>
                        ))}
                        {filteredTeams('away').length === 0 && (
                          <p className="text-dark-400 text-sm p-2 text-center">No teams found</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <label className="block text-sm font-medium text-white mb-2">Away Team Logo URL (optional)</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={formData.awayTeamLogo}
                      onChange={(e) => setFormData({ ...formData, awayTeamLogo: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="input-field"
                    />
                    {formData.awayTeamLogo && (
                      <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                        <p className="text-white text-sm font-semibold mb-2">Logo Preview</p>
                        <div className="flex items-center space-x-4">
                          <div className="bg-white rounded-lg p-3 flex items-center justify-center">
                            <img 
                              src={formData.awayTeamLogo} 
                              alt="Away team logo preview" 
                              className="h-20 w-20 object-contain"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23ccc" font-size="12"%3EInvalid%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-dark-400 text-xs break-all">{formData.awayTeamLogo}</p>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, awayTeamLogo: '' })}
                              className="mt-2 text-red-400 hover:text-red-300 text-xs"
                            >
                              Remove logo
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Match Date</label>
                <input
                  type="datetime-local"
                  value={formData.matchDate}
                  onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-field"
                >
                  <option value="UPCOMING">Upcoming</option>
                  <option value="LIVE">Live</option>
                  <option value="FINISHED">Finished</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Thumbnail</label>
                <input type="file" accept="image/*" className="input-field" />
              </div>
            </div>

            {/* Streaming Links */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Streaming Links ({streamingLinks.length})
              </label>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {streamingLinks.map((link, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-dark-700 p-3 rounded-lg border border-dark-600">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate" title={link.url}>{link.url}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-dark-400 text-xs px-2 py-0.5 bg-dark-800 rounded">{link.type}</span>
                        <span className="text-dark-400 text-xs px-2 py-0.5 bg-dark-800 rounded">{link.quality || 'HD'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStreamingLink(index)}
                      className="text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                      title="Remove link"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {streamingLinks.length === 0 && (
                  <p className="text-dark-400 text-sm text-center py-4">No streaming links added yet</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="Stream URL (e.g., https://example.com/stream.m3u8)"
                  className="input-field md:col-span-6"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addStreamingLink();
                    }
                  }}
                />
                <select
                  value={newLink.type}
                  onChange={(e) => setNewLink({ ...newLink, type: e.target.value })}
                  className="input-field md:col-span-3"
                >
                  <option value="HLS">HLS</option>
                  <option value="M3U8">M3U8</option>
                  <option value="IFRAME">Iframe</option>
                  <option value="DIRECT">Direct</option>
                </select>
                <input
                  type="text"
                  value={newLink.quality}
                  onChange={(e) => setNewLink({ ...newLink, quality: e.target.value })}
                  placeholder="Quality"
                  className="input-field md:col-span-2"
                />
                <button
                  type="button"
                  onClick={addStreamingLink}
                  disabled={!newLink.url.trim()}
                  className="btn-secondary md:col-span-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              <p className="text-dark-400 text-xs mt-2">
                💡 Tip: Add multiple links so users can switch if one fails
              </p>
            </div>

            <div className="flex justify-end space-x-4">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : match ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MatchModal;


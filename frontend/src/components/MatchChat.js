import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiMessageCircle, FiUsers } from 'react-icons/fi';
import axiosInstance from '../utils/axios';
import { getSocket } from '../utils/socket';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const MatchChat = ({ matchId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    if (!user || !matchId) return;

    fetchChatHistory();

    // Join match chat room via socket
    if (socket) {
      socket.emit('join_match_chat', matchId);
      socket.on('match_chat_message', handleNewMessage);

      return () => {
        socket.emit('leave_match_chat', matchId);
        socket.off('match_chat_message', handleNewMessage);
      };
    } else {
      // Poll for new messages if socket not available
      const pollInterval = setInterval(() => {
        fetchChatHistory();
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [user, matchId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      const response = await axiosInstance.get(`/match-chat/${matchId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch match chat history:', error);
    }
  };

  const handleNewMessage = (message) => {
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
    scrollToBottom();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const messageText = inputMessage.trim();
    if (!messageText) return;

    setLoading(true);
    const messageToSend = messageText;
    setInputMessage('');

    try {
      const response = await axiosInstance.post(`/match-chat/${matchId}`, {
        message: messageToSend,
      });

      // Add message to local state
      setMessages((prev) => [...prev, response.data.message]);
      scrollToBottom();
    } catch (error) {
      setInputMessage(messageToSend);
      const errorMsg = error.response?.data?.error || 'Failed to send message';
      toast.error(errorMsg);
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl border border-dark-700 overflow-hidden flex flex-col h-[500px]"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <FiMessageCircle className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold">Match Chat</h3>
            <p className="text-white/80 text-xs flex items-center">
              <FiUsers className="mr-1" />
              {messages.length > 0 ? `${new Set(messages.map(m => m.userId)).size} participants` : 'No messages yet'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          {isOpen ? '−' : '+'}
        </button>
      </div>

      {/* Messages */}
      {isOpen && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-dark-900 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <FiMessageCircle className="w-12 h-12 mx-auto mb-3 text-dark-600" />
                  <p className="text-dark-400">No messages yet</p>
                  <p className="text-dark-500 text-sm mt-1">Be the first to comment!</p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.userId === user.id;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-3 ${
                        isOwnMessage
                          ? 'bg-primary-500 text-white rounded-br-none'
                          : 'bg-dark-700 text-white rounded-bl-none'
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="flex items-center space-x-2 mb-1">
                          {message.user?.avatar ? (
                            <img
                              src={message.user.avatar}
                              alt={message.user.username}
                              className="w-5 h-5 rounded-full"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary-500/30 flex items-center justify-center">
                              <span className="text-xs text-primary-300">
                                {message.user?.username?.[0]?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                          <p className="text-xs font-semibold opacity-80">
                            {message.user?.username || message.username || 'Anonymous'}
                          </p>
                        </div>
                      )}
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${isOwnMessage ? 'text-white/70' : 'text-dark-400'}`}>
                        {format(new Date(message.createdAt), 'h:mm a')}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-dark-700 bg-dark-800">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Share your thoughts..."
                className="flex-1 input-field bg-dark-900 border-dark-700"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSend />
              </button>
            </div>
          </form>
        </>
      )}
    </motion.div>
  );
};

export default MatchChat;


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';
import axiosInstance from '../utils/axios';
import { getSocket } from '../utils/socket';
import toast from 'react-hot-toast';

const ChatButton = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    if (!user) return;

    fetchChatHistory();
    fetchUnreadCount();

    if (socket) {
      socket.on('new_message', handleNewMessage);
      socket.on('message_seen', handleMessageSeen);

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('message_seen', handleMessageSeen);
      };
    }
  }, [user, socket]);

  useEffect(() => {
    if (isOpen && socket) {
      // Mark messages as seen when chat opens
      markMessagesAsSeen();
    }
  }, [isOpen]);

  const fetchChatHistory = async () => {
    try {
      const response = await axiosInstance.get('/chat/history');
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axiosInstance.get('/chat/unread-count');
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleNewMessage = (message) => {
    setMessages((prev) => [...prev, message]);
    if (!isOpen) {
      setUnreadCount((prev) => prev + 1);
      toast.success('New message from support');
    } else {
      markMessagesAsSeen();
    }
  };

  const handleMessageSeen = () => {
    setUnreadCount(0);
  };

  const markMessagesAsSeen = async () => {
    try {
      await axiosInstance.post('/chat/mark-seen');
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark messages as seen:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    setLoading(true);
    try {
      const response = await axiosInstance.post('/chat/send', {
        message: inputMessage,
      });

      setMessages((prev) => [...prev, response.data.message]);
      setInputMessage('');

      if (socket) {
        socket.emit('send_message', {
          message: inputMessage,
        });
      }
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-4 shadow-2xl flex items-center justify-center transition-all"
        aria-label="Open chat"
      >
        <FiMessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-dark-800 rounded-2xl shadow-2xl border border-dark-700 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <FiMessageCircle className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Support Chat</h3>
                  <p className="text-white/80 text-xs">We'll respond soon</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <FiMessageCircle className="w-12 h-12 mx-auto mb-3 text-dark-600" />
                    <p className="text-dark-400">No messages yet</p>
                    <p className="text-dark-500 text-sm mt-1">Start a conversation</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 ${
                        message.isAdmin
                          ? 'bg-primary-500 text-white rounded-br-none'
                          : 'bg-dark-700 text-white rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      <p className={`text-xs mt-1 ${message.isAdmin ? 'text-white/70' : 'text-dark-400'}`}>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-dark-700 bg-dark-800">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatButton;


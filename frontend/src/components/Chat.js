import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../utils/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiMessageCircle } from 'react-icons/fi';
import axiosInstance from '../utils/axios';

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    fetchChatHistory();

    if (socket) {
      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleTyping);

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('user_typing', handleTyping);
      };
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const response = await axiosInstance.get('/chat/history');
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleTyping = (data) => {
    // Could show typing indicator here
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    try {
      const response = await axiosInstance.post('/chat/send', {
        message: inputMessage,
      });

      socket.emit('send_message', {
        message: inputMessage,
        targetUserId: user.role === 'ADMIN' ? undefined : undefined, // Admin can target users
      });

      setMessages((prev) => [...prev, response.data.message]);
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-dark-800 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-dark-700 flex items-center">
        <FiMessageCircle className="text-primary-500 mr-2" />
        <h3 className="text-white font-semibold">Support Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.isAdmin
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-white'
                }`}
              >
                <p className="text-sm">{message.message}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-dark-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 input-field"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="btn-primary px-4"
          >
            <FiSend />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;


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
  const [userConversations, setUserConversations] = useState([]); // For admin: grouped by user
  const [selectedUserId, setSelectedUserId] = useState(null); // For admin: selected user to chat with
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
    } else {
      // If socket not available, poll for new messages (especially for admins)
      const pollInterval = setInterval(() => {
        fetchChatHistory();
        fetchUnreadCount();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(pollInterval);
    }
  }, [user, socket]);

  useEffect(() => {
    if (isOpen && socket && selectedUserId) {
      // Mark messages as seen when chat opens or user changes
      markMessagesAsSeen();
    }
  }, [isOpen, selectedUserId]);

  const fetchChatHistory = async () => {
    try {
      const response = await axiosInstance.get('/chat/history');
      if (user.role === 'ADMIN' && response.data.isAdmin) {
        // Admin view - messages are grouped by user
        setUserConversations(response.data.messages || []);
        // Set selected user to first user with messages, or most recent
        if (response.data.messages && response.data.messages.length > 0) {
          if (!selectedUserId) {
            // Find user with most recent message
            let mostRecent = response.data.messages[0];
            response.data.messages.forEach((conv) => {
              const lastMsg = conv.messages[conv.messages.length - 1];
              const mostRecentLastMsg = mostRecent.messages[mostRecent.messages.length - 1];
              if (new Date(lastMsg.createdAt) > new Date(mostRecentLastMsg.createdAt)) {
                mostRecent = conv;
              }
            });
            setSelectedUserId(mostRecent.userId);
            setMessages(mostRecent.messages || []);
          } else {
            // Update messages for selected user
            const selectedConv = response.data.messages.find((c) => c.userId === selectedUserId);
            setMessages(selectedConv?.messages || []);
          }
        }
      } else {
        // Regular user view
        setMessages(response.data.messages || []);
      }
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
    if (user.role === 'ADMIN') {
      // Update the conversation for the user who sent the message
      setUserConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.userId === message.userId) {
            // Check if message already exists
            if (!conv.messages.some((m) => m.id === message.id)) {
              return { ...conv, messages: [...conv.messages, message] };
            }
          }
          return conv;
        });
        // If user not found, create new conversation
        if (!updated.some((c) => c.userId === message.userId)) {
          updated.push({
            userId: message.userId,
            username: message.username,
            email: '',
            messages: [message],
          });
        }
        return updated;
      });

      // If this message is for the currently selected user, add it to messages
      if (selectedUserId === message.userId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      } else {
        // Increment unread count if chat is not open or different user
        if (!isOpen || selectedUserId !== message.userId) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    } else {
      // Regular user
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1);
        toast.success('New message from support');
      } else {
        markMessagesAsSeen();
      }
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
    const messageText = inputMessage.trim();
    if (!messageText) return;

    setLoading(true);
    const messageToSend = messageText; // Store before clearing
    
    try {
      // Clear input immediately for better UX
      setInputMessage('');
      
      const requestData = {
        message: messageToSend,
      };

      // If admin, use selectedUserId
      if (user.role === 'ADMIN') {
        if (!selectedUserId) {
          toast.error('Please select a user to message');
          setInputMessage(messageToSend);
          setLoading(false);
          return;
        }
        requestData.targetUserId = selectedUserId;
      }
      
      const response = await axiosInstance.post('/chat/send', requestData);

      // Add message to local state (message is already saved via HTTP)
      setMessages((prev) => [...prev, response.data.message]);

      // Socket emit is optional - HTTP endpoint will handle broadcasting
      // But we can emit for real-time updates if socket is connected
      if (socket && socket.connected) {
        socket.emit('send_message', {
          message: messageToSend,
        });
      }

      // Refresh chat history to get latest messages
      setTimeout(() => {
        fetchChatHistory();
      }, 500);
    } catch (error) {
      // Restore input message on error
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
            className="fixed bottom-24 right-6 z-50 w-[500px] h-[600px] bg-dark-800 rounded-2xl shadow-2xl border border-dark-700 flex overflow-hidden"
          >
            {/* Admin: User List Sidebar */}
            {user.role === 'ADMIN' && userConversations.length > 0 && (
              <div className="w-1/3 border-r border-dark-700 bg-dark-900 overflow-y-auto custom-scrollbar">
                <div className="p-3 border-b border-dark-700">
                  <h4 className="text-white font-semibold text-sm">Users</h4>
                </div>
                <div className="divide-y divide-dark-700">
                  {userConversations.map((conv) => {
                    const lastMessage = conv.messages[conv.messages.length - 1];
                    const unreadCount = conv.messages.filter((m) => !m.isAdmin && !m.isSeen).length;
                    return (
                      <button
                        key={conv.userId}
                        onClick={() => {
                          setSelectedUserId(conv.userId);
                          setMessages(conv.messages || []);
                          markMessagesAsSeen();
                        }}
                        className={`w-full text-left p-3 hover:bg-dark-800 transition-colors ${
                          selectedUserId === conv.userId ? 'bg-dark-800 border-l-2 border-primary-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white font-medium text-sm truncate">{conv.username}</p>
                          {unreadCount > 0 && (
                            <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-dark-400 text-xs truncate">
                          {lastMessage?.message || 'No messages'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chat Content */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <FiMessageCircle className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">
                      {user.role === 'ADMIN' 
                        ? selectedUserId 
                          ? userConversations.find(c => c.userId === selectedUserId)?.username || 'Select User'
                          : 'Admin Chat'
                        : 'Support Chat'}
                    </h3>
                    <p className="text-white/80 text-xs">
                      {user.role === 'ADMIN' 
                        ? selectedUserId 
                          ? userConversations.find(c => c.userId === selectedUserId)?.email || ''
                          : 'Select a user to chat'
                        : "We'll respond soon"}
                    </p>
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <FiMessageCircle className="w-12 h-12 mx-auto mb-3 text-dark-600" />
                    <p className="text-dark-400">
                      {user.role === 'ADMIN' ? 'No user messages yet' : 'No messages yet'}
                    </p>
                    <p className="text-dark-500 text-sm mt-1">
                      {user.role === 'ADMIN' ? 'Waiting for user messages...' : 'Start a conversation'}
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'} mb-2`}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatButton;


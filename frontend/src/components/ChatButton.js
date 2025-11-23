import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiMessageCircle, FiX, FiSend, FiSearch } from 'react-icons/fi';
import axiosInstance from '../utils/axios';
import { initSocket, subscribeToUserMessages, subscribeToAdminMessages } from '../utils/socket';
import toast from 'react-hot-toast';

const ChatButton = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userConversations, setUserConversations] = useState([]); // For admin: grouped by user
  const [filteredConversations, setFilteredConversations] = useState([]); // Filtered conversations for admin
  const [selectedUserId, setSelectedUserId] = useState(null); // For admin: selected user to chat with
  const [searchQuery, setSearchQuery] = useState(''); // Search query for admin
  const [inputMessage, setInputMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const userChannelRef = useRef(null);
  const adminChannelRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    fetchChatHistory();
    fetchUnreadCount();

    // Initialize Supabase Realtime and subscribe to messages
    const setupRealtime = async () => {
      await initSocket();
      
      // Subscribe to user messages
      const userChannel = subscribeToUserMessages(user.id, handleNewMessage);
      userChannelRef.current = userChannel;

      // If admin, also subscribe to admin channel
      if (user.role === 'ADMIN') {
        const adminChannel = subscribeToAdminMessages(handleNewMessage);
        adminChannelRef.current = adminChannel;
      }
    };

    setupRealtime();

    // Fallback polling if Supabase not available
    const pollInterval = setInterval(() => {
      if (user) {
        fetchChatHistory();
        fetchUnreadCount();
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(pollInterval);
      userChannelRef.current = null;
      adminChannelRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    if (isOpen && selectedUserId) {
      // Mark messages as seen when chat opens or user changes
      markMessagesAsSeen();
    }
  }, [isOpen, selectedUserId]);

  // Filter conversations based on search query
  useEffect(() => {
    if (!user || !user.role) return;
    
    if (user.role === 'ADMIN' && userConversations.length > 0) {
      if (!searchQuery.trim()) {
        setFilteredConversations(userConversations);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = userConversations.filter((conv) => {
          // Search by username or email
          const matchesUser = 
            conv.username?.toLowerCase().includes(query) ||
            conv.email?.toLowerCase().includes(query);
          
          // Search within messages
          const matchesMessage = conv.messages.some((msg) =>
            msg.message?.toLowerCase().includes(query)
          );
          
          return matchesUser || matchesMessage;
        });
        setFilteredConversations(filtered);
      }
    } else {
      setFilteredConversations(userConversations);
    }
  }, [searchQuery, userConversations, user?.role]);

  const fetchChatHistory = async () => {
    try {
      const response = await axiosInstance.get('/chat/history');
      if (user && user.role === 'ADMIN' && response.data.isAdmin) {
        // Admin view - messages are grouped by user
        const conversations = response.data.messages || [];
        setUserConversations(conversations);
        setFilteredConversations(conversations);
        // Set selected user to first user with messages, or most recent
        if (conversations.length > 0) {
          if (!selectedUserId) {
            // Find user with most recent message
            let mostRecent = conversations[0];
            conversations.forEach((conv) => {
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
            const selectedConv = conversations.find((c) => c.userId === selectedUserId);
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
        if (!user || !user.role) return;
        
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
            email: message.email || '',
            messages: [message],
          });
        }
        
        // Update filtered conversations if search is active
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const filtered = updated.filter((conv) => {
            const matchesUser = 
              conv.username?.toLowerCase().includes(query) ||
              conv.email?.toLowerCase().includes(query);
            const matchesMessage = conv.messages.some((msg) =>
              msg.message?.toLowerCase().includes(query)
            );
            return matchesUser || matchesMessage;
          });
          setFilteredConversations(filtered);
        } else {
          setFilteredConversations(updated);
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
    if (!messageText || !user || !user.role) return;

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
            {user && user.role === 'ADMIN' && (
              <div className="w-1/3 border-r border-dark-700 bg-dark-900 flex flex-col">
                {/* Search Bar */}
                <div className="p-3 border-b border-dark-700">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search users or messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white text-sm placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-dark-400 text-sm">
                        {searchQuery ? 'No users or messages found' : 'No conversations yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-dark-700">
                      {filteredConversations.map((conv) => {
                        const lastMessage = conv.messages[conv.messages.length - 1];
                        const unreadCount = conv.messages.filter((m) => !m.isAdmin && !m.isSeen).length;
                        const isSelected = selectedUserId === conv.userId;
                        
                        return (
                          <button
                            key={conv.userId}
                            onClick={() => {
                              setSelectedUserId(conv.userId);
                              setMessages(conv.messages || []);
                              markMessagesAsSeen();
                            }}
                            className={`w-full text-left p-3 hover:bg-dark-800 transition-colors relative ${
                              isSelected ? 'bg-dark-800 border-l-2 border-primary-500' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm truncate">{conv.username}</p>
                                {conv.email && (
                                  <p className="text-dark-500 text-xs truncate">{conv.email}</p>
                                )}
                              </div>
                              {unreadCount > 0 && (
                                <span className="ml-2 bg-primary-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center flex-shrink-0">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-dark-400 text-xs truncate mt-1">
                              {lastMessage?.message || 'No messages'}
                            </p>
                            {unreadCount > 0 && !isSelected && (
                              <div className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Total Unread Count */}
                {userConversations.length > 0 && (
                  <div className="p-3 border-t border-dark-700 bg-dark-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-400">Total Unread:</span>
                      <span className="text-primary-400 font-bold">
                        {userConversations.reduce((total, conv) => {
                          return total + conv.messages.filter((m) => !m.isAdmin && !m.isSeen).length;
                        }, 0)}
                      </span>
                    </div>
                  </div>
                )}
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
                          {user && user.role === 'ADMIN' 
                            ? selectedUserId 
                              ? userConversations.find(c => c.userId === selectedUserId)?.username || 'Select User'
                              : 'Admin Chat'
                            : 'Support Chat'}
                        </h3>
                        <p className="text-white/80 text-xs">
                          {user && user.role === 'ADMIN' 
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
                      {user && user.role === 'ADMIN' ? 'No user messages yet' : 'No messages yet'}
                    </p>
                    <p className="text-dark-500 text-sm mt-1">
                      {user && user.role === 'ADMIN' ? 'Waiting for user messages...' : 'Start a conversation'}
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


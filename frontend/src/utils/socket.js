import { supabase, getAuthenticatedSupabase } from './supabase';
import axiosInstance from './axios';

let realtimeClient = null;
let channels = new Map();

// Initialize Supabase Realtime connection
export const initSocket = async () => {
  if (realtimeClient) {
    return realtimeClient;
  }

  // Get access token from axios instance (it should have the token in headers)
  try {
    // Try to get token from localStorage or cookies
    const token = localStorage.getItem('accessToken') || 
                  document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];
    
    if (token && supabase) {
      realtimeClient = getAuthenticatedSupabase(token);
      console.log('Supabase Realtime initialized');
    } else if (supabase) {
      realtimeClient = supabase;
      console.log('Supabase Realtime initialized (unauthenticated)');
    } else {
      console.warn('Supabase not configured. Real-time features disabled.');
    }
  } catch (error) {
    console.error('Error initializing Supabase Realtime:', error);
  }

  return realtimeClient;
};

// Subscribe to a channel
export const subscribeToChannel = (channelName, event, callback) => {
  if (!realtimeClient) {
    console.warn('Realtime client not initialized');
    return null;
  }

  const channel = realtimeClient.channel(channelName);
  
  channel.on('broadcast', { event }, (payload) => {
    callback(payload.payload);
  });

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`Subscribed to channel: ${channelName}`);
    } else if (status === 'CHANNEL_ERROR') {
      console.error(`Error subscribing to channel: ${channelName}`);
    }
  });

  channels.set(channelName, channel);
  return channel;
};

// Unsubscribe from a channel
export const unsubscribeFromChannel = (channelName) => {
  const channel = channels.get(channelName);
  if (channel) {
    realtimeClient?.removeChannel(channel);
    channels.delete(channelName);
    console.log(`Unsubscribed from channel: ${channelName}`);
  }
};

// Join a match chat room
export const joinMatchChat = (matchId, onMessage) => {
  const channelName = `match:${matchId}`;
  return subscribeToChannel(channelName, 'match_chat_message', onMessage);
};

// Leave a match chat room
export const leaveMatchChat = (matchId) => {
  const channelName = `match:${matchId}`;
  unsubscribeFromChannel(channelName);
};

// Subscribe to user messages
export const subscribeToUserMessages = (userId, onMessage) => {
  const channelName = `user:${userId}`;
  return subscribeToChannel(channelName, 'new_message', onMessage);
};

// Subscribe to admin messages
export const subscribeToAdminMessages = (onMessage) => {
  return subscribeToChannel('admin', 'new_message', onMessage);
};

// Get socket instance (for backward compatibility)
export const getSocket = () => {
  return realtimeClient;
};

// Disconnect socket
export const disconnectSocket = () => {
  // Unsubscribe from all channels
  channels.forEach((channel, channelName) => {
    realtimeClient?.removeChannel(channel);
  });
  channels.clear();
  
  // Disconnect Supabase client
  if (realtimeClient) {
    realtimeClient.removeAllChannels();
    realtimeClient = null;
  }
  
  console.log('Disconnected from Supabase Realtime');
};

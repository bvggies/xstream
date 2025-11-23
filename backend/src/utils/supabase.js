const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase credentials not found. Real-time features will not work.');
}

// Create Supabase client with service role key (for server-side operations)
const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Helper to broadcast messages via Supabase Realtime
const broadcastMessage = async (channelName, event, payload) => {
  if (!supabase) {
    console.warn('Supabase not configured. Cannot broadcast message.');
    return;
  }

  try {
    const channel = supabase.channel(channelName);
    
    // Subscribe to the channel first
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Send the broadcast message
        channel.send({
          type: 'broadcast',
          event,
          payload,
        });
      }
    });
  } catch (error) {
    console.error('Error broadcasting message:', error);
  }
};

module.exports = { supabase, broadcastMessage };


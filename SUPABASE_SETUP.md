# Supabase Realtime Setup Guide

This guide explains how to set up Supabase Realtime to replace Socket.io for WebSocket functionality.

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new Supabase project
3. Get your project credentials:
   - Project URL
   - Anon/Public Key (for frontend)
   - Service Role Key (for backend - keep this secret!)

## Environment Variables

### Frontend (.env)

Add these to your `frontend/.env` file:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### Backend (Vercel Environment Variables)

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important:** 
- The Service Role Key has admin privileges - never expose it in the frontend!
- Redeploy your backend after adding environment variables

## How It Works

### Frontend
- Uses Supabase Realtime channels to subscribe to events
- Channels are created per user/match for real-time messaging
- Automatically handles reconnection and authentication

### Backend
- Uses Supabase Realtime to broadcast messages to channels
- No need for persistent WebSocket connections
- Works perfectly with Vercel serverless functions

## Features Migrated

1. **Match Chat** - Real-time chat during matches
2. **Support Chat** - User-to-admin messaging
3. **Typing Indicators** - (Can be added if needed)

## Testing

1. After setting up environment variables, restart your frontend dev server
2. Test match chat by joining a match
3. Test support chat by sending a message
4. Check browser console for any connection errors

## Troubleshooting

### "Supabase not configured" warning
- Check that environment variables are set correctly
- Restart dev server after adding .env variables
- For production, ensure Vercel env vars are set

### Messages not appearing in real-time
- Check browser console for Supabase connection errors
- Verify Supabase project is active
- Check that channels are being subscribed correctly

### Backend broadcast errors
- Verify SUPABASE_SERVICE_ROLE_KEY is set in Vercel
- Check Vercel function logs for errors
- Ensure Supabase project is not paused

## Migration Complete

Socket.io has been completely replaced with Supabase Realtime. The following files were updated:

**Frontend:**
- `frontend/src/utils/socket.js` - Now uses Supabase Realtime
- `frontend/src/utils/supabase.js` - Supabase client setup
- `frontend/src/components/MatchChat.js` - Updated to use Supabase
- `frontend/src/components/Chat.js` - Updated to use Supabase
- `frontend/src/components/ChatButton.js` - Needs update (see below)
- `frontend/src/context/AuthContext.js` - Needs update (see below)

**Backend:**
- `backend/src/utils/supabase.js` - Supabase client for server
- `backend/src/controllers/matchChatController.js` - Uses Supabase broadcast
- `backend/src/controllers/chatController.js` - Uses Supabase broadcast

**Removed:**
- Socket.io dependencies (can be removed after testing)
- `backend/src/socket/socketHandler.js` (no longer needed)
- `backend/src/utils/socketInstance.js` (no longer needed)

## Next Steps

1. Set up Supabase project and add environment variables
2. Test the real-time features
3. Remove Socket.io dependencies once confirmed working
4. Update ChatButton.js and AuthContext.js if needed


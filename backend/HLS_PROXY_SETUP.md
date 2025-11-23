# HLS Proxy Setup Guide

## Issue
Live m3u8 streams don't play because segments, child playlists, and key files are blocked by CORS.

## Solution
The proxy now rewrites all URLs in the m3u8 playlist to route through the backend proxy, which handles:
- `.ts` video segments
- `.m4s` video segments  
- Child playlists (variant playlists)
- `.key` encryption key files
- All other HLS resources

## Required Environment Variable

### For Vercel Deployment:

1. Go to **Vercel Dashboard** → Your Backend Project → **Settings** → **Environment Variables**

2. Add a new environment variable:
   - **Name:** `BASE_URL`
   - **Value:** `https://xstream-backend.vercel.app` (or your actual backend URL)
   - **Environment:** Select **Production**, **Preview**, and **Development**

3. **Important:** 
   - Use your actual backend URL (without `/api` at the end)
   - Must use `https://` protocol
   - No trailing slash

4. **Redeploy** your backend after adding the environment variable

### Example:
```
BASE_URL=https://xstream-backend.vercel.app
```

## How It Works

1. When an m3u8 file is requested via `/api/matches/proxy-m3u8?url=...`:
   - The backend fetches the original m3u8 file
   - All URLs inside the playlist are rewritten to route through `/api/matches/proxy`
   - The modified playlist is returned

2. When segments/child playlists are requested via `/api/matches/proxy?url=...`:
   - The backend fetches the resource
   - Returns it with proper CORS headers
   - Handles binary data (segments, keys) correctly

## Testing

1. After setting `BASE_URL` and redeploying, test with a live m3u8 stream
2. Check browser console for proxy logs
3. Check Vercel function logs for any errors

## Troubleshooting

### Stream still doesn't play:
1. Verify `BASE_URL` is set correctly in Vercel
2. Check Vercel function logs for errors
3. Verify the proxy endpoint is accessible: `https://your-backend.vercel.app/api/matches/proxy-m3u8?url=...`
4. Check browser Network tab to see if proxy requests are being made

### Proxy URLs are incorrect:
- Make sure `BASE_URL` is set without trailing slash
- Make sure `BASE_URL` uses `https://` protocol
- Redeploy after setting the environment variable

### 404 errors on segments:
- Check that `/api/matches/proxy` route is accessible
- Verify URLs in the rewritten playlist are correct
- Check Vercel logs for routing issues


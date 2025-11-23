# Testing the HLS Proxy

## Quick Test

To test if the proxy is working, try accessing this URL directly in your browser:

```
https://xstream-backend.vercel.app/api/matches/proxy-m3u8?url=https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
```

This should return a rewritten m3u8 playlist with all URLs pointing to your proxy.

## Expected Behavior

1. **If BASE_URL is set correctly:**
   - The playlist should be returned
   - All URLs in the playlist should start with `https://xstream-backend.vercel.app/api/matches/proxy?url=...`
   - Segments should load through the proxy

2. **If BASE_URL is NOT set:**
   - The playlist might still be returned
   - But URLs might be incorrect (e.g., relative URLs or wrong domain)
   - Segments will fail to load

## Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Backend Project → **Functions** tab
2. Click on a recent function invocation
3. Look for logs starting with:
   - `Proxy M3U8 - Base URL:`
   - `Proxy M3U8 - Proxy Base URL:`
   - `Proxy M3U8 - Original URL:`
   - `Proxy M3U8 - Rewritten playlist:`

## Common Issues

### Issue 1: BASE_URL not set
**Symptom:** Proxy URLs in playlist are incorrect or relative

**Fix:** Set `BASE_URL` environment variable in Vercel:
- Name: `BASE_URL`
- Value: `https://xstream-backend.vercel.app`
- Environment: Production, Preview, Development

### Issue 2: Proxy endpoint returns 500 error
**Symptom:** Browser shows error when accessing proxy URL

**Check:** Vercel function logs for error details

### Issue 3: Segments still fail to load
**Symptom:** Manifest loads but segments fail

**Possible causes:**
- BASE_URL is incorrect
- Segment proxy endpoint (`/api/matches/proxy`) is not working
- CORS issues with segment proxy
- Original stream server is blocking requests

## Debug Steps

1. **Test the proxy endpoint directly:**
   ```
   https://xstream-backend.vercel.app/api/matches/proxy-m3u8?url=YOUR_STREAM_URL
   ```

2. **Check the response:**
   - Open in browser or use curl
   - Verify all URLs are rewritten to use the proxy
   - Check if URLs are absolute (start with `https://`)

3. **Test segment proxy:**
   ```
   https://xstream-backend.vercel.app/api/matches/proxy?url=SEGMENT_URL
   ```
   Should return the segment file

4. **Check browser Network tab:**
   - Look for requests to `/api/matches/proxy-m3u8`
   - Look for requests to `/api/matches/proxy`
   - Check response status codes
   - Check response content


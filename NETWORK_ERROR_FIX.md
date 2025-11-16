# Network Error Fix Guide

## Issue: Network Error on Registration

This means the frontend cannot connect to the backend API.

## Quick Fixes

### Step 1: Check Frontend Environment Variable

Create/update `frontend/.env` file:

```env
REACT_APP_API_URL=https://your-backend-url.vercel.app/api
```

**Important:**
- Replace `your-backend-url.vercel.app` with your actual Vercel backend URL
- Must include `/api` at the end
- No trailing slash

### Step 2: Restart Frontend Dev Server

After updating `.env`:
```bash
cd frontend
# Stop the server (Ctrl+C)
npm start
```

**Note:** React requires restart to pick up new environment variables!

### Step 3: Verify Backend is Running

Test your backend:
```
https://your-backend-url.vercel.app/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### Step 4: Check Browser Console

Open browser DevTools (F12) → Console tab

Look for:
- `API URL: ...` - Shows what URL is being used
- `Making request to: ...` - Shows the full request URL
- Any CORS errors
- Network errors

### Step 5: Check Network Tab

Open browser DevTools (F12) → Network tab

1. Try registering again
2. Look for the `/auth/register` request
3. Check:
   - **Status**: Should be 200/201 (not failed/blocked)
   - **Request URL**: Should match your backend
   - **CORS errors**: Red text about CORS

## Common Issues

### Issue 1: Wrong Backend URL

**Symptom:** Network error, request goes to wrong URL

**Fix:**
1. Get your backend URL from Vercel dashboard
2. Update `frontend/.env`:
   ```
   REACT_APP_API_URL=https://xstream-backend-xxx.vercel.app/api
   ```
3. Restart frontend server

### Issue 2: CORS Error

**Symptom:** CORS error in console, request blocked

**Fix:**
1. Go to Vercel Dashboard → Backend Project → Settings → Environment Variables
2. Set `FRONTEND_URL` to your frontend URL:
   ```
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
3. Redeploy backend

### Issue 3: Backend Not Deployed

**Symptom:** 404 or connection refused

**Fix:**
1. Check Vercel dashboard - is backend deployed?
2. Check deployment status
3. Verify backend URL is correct

### Issue 4: Local Development

**If running locally:**

**Backend:**
```bash
cd backend
npm run dev
# Should run on http://localhost:5000
```

**Frontend `.env`:**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

**Then restart frontend:**
```bash
cd frontend
npm start
```

## Debug Checklist

- [ ] `REACT_APP_API_URL` is set in `frontend/.env`
- [ ] Frontend server was restarted after setting env var
- [ ] Backend is deployed and accessible
- [ ] Backend health check works: `/api/health`
- [ ] `FRONTEND_URL` is set in backend env vars
- [ ] No CORS errors in browser console
- [ ] Network tab shows the request being made

## Test Backend Connection

Open browser console and run:
```javascript
fetch('https://your-backend-url.vercel.app/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

If this fails, the backend URL is wrong or backend is down.

---

**Most Common Fix:** Set `REACT_APP_API_URL` in `frontend/.env` and restart the dev server!


# Quick Environment Setup

## Fix Network Error

The error shows your backend URL is missing `/api`. Here's how to fix it:

### Step 1: Create `frontend/.env` file

Create a file named `.env` in the `frontend` folder with:

```env
REACT_APP_API_URL=https://xstream-backend.vercel.app/api
```

**Important:**
- ✅ Must include `/api` at the end
- ✅ No trailing slash
- ✅ Use your actual backend URL from Vercel

### Step 2: Restart Frontend Server

**CRITICAL:** You MUST restart the frontend server after creating/updating `.env`:

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd frontend
npm start
```

### Step 3: Verify

1. Open browser console (F12)
2. Look for: `API URL: https://xstream-backend.vercel.app/api`
3. Try registering again

## Test Backend Connection

Test if backend is accessible:

```
https://xstream-backend.vercel.app/api/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

If this fails, your backend isn't deployed or URL is wrong.

## Common Mistakes

❌ **Wrong:**
```env
REACT_APP_API_URL=https://xstream-backend.vercel.app/
REACT_APP_API_URL=https://xstream-backend.vercel.app
```

✅ **Correct:**
```env
REACT_APP_API_URL=https://xstream-backend.vercel.app/api
```

## Still Not Working?

1. **Check backend is deployed:**
   - Go to Vercel dashboard
   - Check if backend project is deployed
   - Copy the exact URL

2. **Check CORS:**
   - Backend env var `FRONTEND_URL` should match your frontend URL
   - Redeploy backend after setting it

3. **Check browser console:**
   - Look for CORS errors
   - Check network tab for failed requests

---

**Quick Fix:** Create `frontend/.env` with correct URL and restart server!


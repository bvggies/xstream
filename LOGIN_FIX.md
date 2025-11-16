# Fix "Cannot connect to server" Login Error

## Quick Fix Steps

### Step 1: Check Your Environment

**Are you running locally or on Vercel?**

#### If Running Locally (Development):

1. **Create/Update `frontend/.env` file:**
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

2. **Make sure backend is running:**
   ```bash
   cd backend
   npm run dev
   ```
   Should show: `Server running on port 5000`

3. **Restart frontend server:**
   ```bash
   cd frontend
   # Stop server (Ctrl+C)
   npm start
   ```

#### If Running on Vercel (Production):

1. **Set Environment Variable in Vercel Dashboard:**
   - Go to Vercel Dashboard → Frontend Project → Settings → Environment Variables
   - Add: `REACT_APP_API_URL` = `https://xstream-backend.vercel.app/api`
   - Make sure it's set for **Production**, **Preview**, and **Development**
   - **Redeploy** the frontend project

2. **Verify Backend is Accessible:**
   - Open: `https://xstream-backend.vercel.app/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`
   - If this fails, your backend isn't deployed correctly

### Step 2: Verify Backend URL

**Check your actual backend URL:**
1. Go to Vercel Dashboard → Backend Project
2. Copy the exact URL (e.g., `https://xstream-backend-xxx.vercel.app`)
3. Update `.env` or Vercel env var to: `https://your-actual-backend-url.vercel.app/api`

### Step 3: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for: `API URL: ...` - This shows what URL is being used
4. Try logging in again
5. Check **Network** tab for the `/auth/login` request:
   - Status code (should be 200/201, not failed)
   - Request URL (should match your backend)
   - Response (check for CORS errors)

### Step 4: Common Issues

#### Issue 1: Wrong Backend URL
**Symptom:** Network error, request goes to wrong URL

**Fix:**
- Check Vercel dashboard for exact backend URL
- Update `REACT_APP_API_URL` to include `/api` at the end
- No trailing slash

#### Issue 2: CORS Error
**Symptom:** CORS error in browser console

**Fix:**
1. Go to Vercel Dashboard → Backend Project → Settings → Environment Variables
2. Set `FRONTEND_URL` = `https://xstream-wheat.vercel.app`
3. Redeploy backend

#### Issue 3: Backend Not Deployed
**Symptom:** 404 or connection refused

**Fix:**
1. Check Vercel dashboard - is backend deployed?
2. Check deployment status
3. Verify backend URL is correct

### Step 5: Test Backend Connection

Open browser console and run:
```javascript
fetch('https://xstream-backend.vercel.app/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

If this fails, the backend URL is wrong or backend is down.

## Debug Checklist

- [ ] `REACT_APP_API_URL` is set correctly (with `/api` at end, no trailing slash)
- [ ] Frontend server was restarted after setting env var (if local)
- [ ] Environment variable is set in Vercel dashboard (if production)
- [ ] Frontend was redeployed after setting env var (if production)
- [ ] Backend is deployed and accessible
- [ ] Backend health check works: `/api/health`
- [ ] `FRONTEND_URL` is set in backend env vars
- [ ] No CORS errors in browser console
- [ ] Network tab shows the request being made

## Still Not Working?

1. **Check browser console** for exact error message
2. **Check Network tab** for failed request details
3. **Check Vercel logs** for backend errors
4. **Verify backend URL** in Vercel dashboard

---

**Most Common Fix:** Set `REACT_APP_API_URL` correctly and restart/redeploy!


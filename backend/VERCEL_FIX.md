# Vercel Deployment Fix

## Issue: Serverless Function Crashed

The error occurs because Vercel uses serverless functions, which require a different setup than traditional Node.js servers.

## Changes Made

### 1. Updated `src/server.js`
- Removed HTTP server creation for production
- Export Express app directly for Vercel
- Socket.io only runs in local development
- Serverless-compatible configuration

### 2. Created `api/index.js`
- Vercel serverless function entry point
- Exports the Express app

### 3. Created `vercel.json`
- Vercel configuration file
- Routes all requests to the serverless function

## Important Notes

### Socket.io Limitation
⚠️ **Socket.io does NOT work in Vercel serverless functions** (free tier)

**Solutions:**
1. **Use polling fallback** (automatic in Socket.io client)
2. **Upgrade to Vercel Pro** for WebSocket support
3. **Use alternative**: Pusher, Ably, or separate Socket.io server

### For Now
- Chat will use HTTP polling (slower but works)
- All other features work normally

## Deployment Steps

1. **Push changes to GitHub**:
   ```bash
   git add .
   git commit -m "Fix Vercel serverless deployment"
   git push
   ```

2. **Redeploy on Vercel**:
   - Go to Vercel dashboard
   - Your project should auto-redeploy
   - Or manually trigger redeploy

3. **Verify Environment Variables**:
   - Check all env vars are set in Vercel dashboard
   - Especially `DATABASE_URL`

4. **Test**:
   - Visit: `https://your-backend.vercel.app/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

## Troubleshooting

### Still Getting 500 Error?

1. **Check Vercel Logs**:
   - Go to Vercel dashboard → Your Project → Functions
   - Click on the function to see error logs

2. **Common Issues**:
   - Missing `DATABASE_URL` env var
   - Prisma client not generated
   - Missing dependencies

3. **Fix Prisma**:
   ```bash
   # In Vercel build command, ensure:
   npm install && npm run prisma:generate
   ```

4. **Check Build Logs**:
   - Vercel dashboard → Deployments → Click deployment → View build logs

## Testing Locally

```bash
cd backend
npm run dev
```

Visit: http://localhost:5000/api/health

---

**After fixing, your backend should work on Vercel!** 🚀


# Quick Fix for Vercel 500 Error

## Most Likely Issue: Missing Environment Variables

### Step 1: Check Vercel Function Logs (CRITICAL)

1. Go to **Vercel Dashboard** → Your Project
2. Click **Deployments** tab
3. Click on the **latest deployment** (the one with the error)
4. Click **Functions** tab
5. Click on the function name
6. **Copy the full error message** - this tells us exactly what's wrong!

### Step 2: Verify Environment Variables

Go to **Vercel Dashboard** → **Settings** → **Environment Variables**

**You MUST have these set:**

```
DATABASE_URL=postgresql://neondb_owner:npg_tQO60jBNVnih@ep-quiet-mountain-ah64qrsd-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=generate-random-32-chars
JWT_REFRESH_SECRET=generate-random-32-chars
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
```

**To generate secrets (Windows PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Step 3: Test Simple Function First

Visit: `https://your-backend.vercel.app/api/test`

If this works, the issue is in the main server code.
If this fails, Vercel setup is wrong.

### Step 4: Alternative - Use Vercel Auto-Detection

Delete `vercel.json` and let Vercel auto-detect:

1. Delete `backend/vercel.json`
2. Ensure `backend/api/index.js` exists
3. Redeploy

Vercel will automatically detect the `api` folder.

### Step 5: Check Build Logs

In Vercel Dashboard → Deployments → Click deployment → **Build Logs**

Look for:
- ❌ `npm install` failures
- ❌ `prisma generate` errors
- ❌ Missing modules
- ❌ Build timeouts

### Step 6: Common Fixes

#### Fix 1: Prisma Not Generated
**Error:** `Cannot find module '@prisma/client'`

**Solution:** In Vercel project settings:
- Build Command: `npm install && npm run prisma:generate`

#### Fix 2: Database Connection
**Error:** `Can't reach database server`

**Solution:**
1. Verify `DATABASE_URL` in Vercel env vars
2. Check Neon dashboard - database must be active
3. Test connection: `psql "your-connection-string"`

#### Fix 3: Wrong Root Directory
**Error:** `Cannot find module`

**Solution:** In Vercel project settings:
- Root Directory: `backend`
- NOT the root of the repo!

### Step 7: Minimal Working Example

If nothing works, try this minimal `api/index.js`:

```javascript
const express = require('express');
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
```

If this works, gradually add back features.

---

## Action Items

1. ✅ **Check Vercel function logs** (most important!)
2. ✅ **Verify all environment variables are set**
3. ✅ **Test `/api/test` endpoint**
4. ✅ **Check build logs for errors**
5. ✅ **Verify root directory is `backend`**

**Share the error message from Vercel logs and I can help fix it!**


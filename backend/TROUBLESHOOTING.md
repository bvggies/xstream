# Troubleshooting Vercel Deployment

## Current Error: FUNCTION_INVOCATION_FAILED

### Step 1: Check Vercel Function Logs

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click **Functions** tab
6. Click on the function to see detailed logs

**Look for:**
- Error messages
- Stack traces
- Missing module errors
- Database connection errors

### Step 2: Verify Environment Variables

In Vercel Dashboard → Settings → Environment Variables, ensure:

✅ **Required Variables:**
```
DATABASE_URL=postgresql://neondb_owner:npg_tQO60jBNVnih@ep-quiet-mountain-ah64qrsd-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

### Step 3: Verify Build Settings

**Root Directory:** `backend`
**Build Command:** `npm install && npm run prisma:generate`
**Output Directory:** (empty)
**Install Command:** `npm install`

### Step 4: Common Issues & Fixes

#### Issue 1: Prisma Client Not Generated
**Error:** `Cannot find module '@prisma/client'`

**Fix:** Ensure build command includes:
```
npm install && npm run prisma:generate
```

#### Issue 2: Database Connection Error
**Error:** `Can't reach database server`

**Fix:**
1. Verify `DATABASE_URL` is set correctly
2. Check Neon dashboard - database must be active
3. Ensure connection string includes `?sslmode=require`

#### Issue 3: Missing Dependencies
**Error:** `Cannot find module 'xxx'`

**Fix:**
1. Check `package.json` has all dependencies
2. Ensure `npm install` runs in build
3. Check build logs for missing packages

#### Issue 4: Path Issues
**Error:** `Cannot find module '../src/server'`

**Fix:**
- Verify file structure:
  ```
  backend/
    api/
      index.js
    src/
      server.js
  ```

### Step 5: Test Locally First

```bash
cd backend
npm install
npm run prisma:generate
node api/index.js
```

Then test:
```bash
curl http://localhost:3000/api/health
```

### Step 6: Alternative Entry Point

If `api/index.js` doesn't work, try creating `api/[...].js`:

```javascript
// api/[...].js
const app = require('../src/server');
module.exports = app;
```

Then update `vercel.json`:
```json
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/[...].js"
    }
  ]
}
```

### Step 7: Minimal Test Function

Create `api/test.js` to test if functions work:

```javascript
// api/test.js
module.exports = (req, res) => {
  res.json({ message: 'Function works!' });
};
```

Test: `https://your-app.vercel.app/api/test`

If this works, the issue is in the main server code.

### Step 8: Check Prisma Schema

Ensure Prisma can generate client:
```bash
cd backend
npx prisma generate
```

If this fails locally, fix it before deploying.

### Step 9: Enable Debug Logging

Add to `api/index.js`:
```javascript
console.log('Environment:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('Starting server...');
```

Check logs in Vercel dashboard.

### Step 10: Contact Support

If nothing works:
1. Copy full error from Vercel logs
2. Check Vercel status page
3. Try creating a minimal Express app first
4. Gradually add features

---

## Quick Fix Checklist

- [ ] Environment variables set in Vercel
- [ ] Build command includes `prisma:generate`
- [ ] Root directory is `backend`
- [ ] `api/index.js` exists and exports app
- [ ] `vercel.json` routes to correct function
- [ ] Database is active in Neon dashboard
- [ ] Test locally first
- [ ] Check Vercel function logs

---

**Most Common Fix:** Ensure `DATABASE_URL` is set in Vercel environment variables!


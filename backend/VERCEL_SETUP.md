# Vercel Setup Instructions

## The Issue: File Being Served as Text

If you're seeing the code instead of it executing, Vercel isn't recognizing it as a serverless function.

## Solution: Correct Vercel Project Settings

### Step 1: Delete vercel.json (Let Vercel Auto-Detect)

1. Delete `backend/vercel.json` from your repo
2. Vercel will auto-detect the `api` folder

### Step 2: Configure Project in Vercel Dashboard

Go to **Vercel Dashboard** → Your Project → **Settings** → **General**

**Critical Settings:**

1. **Root Directory:** `backend`
2. **Build Command:** `npm install && npm run prisma:generate`
3. **Output Directory:** (leave EMPTY)
4. **Install Command:** `npm install`
5. **Framework Preset:** Other

### Step 3: Verify File Structure

Your `backend` folder should have:
```
backend/
  api/
    index.js    ← This is the serverless function
  src/
    server.js   ← Main Express app
  package.json
  prisma/
    schema.prisma
```

### Step 4: Environment Variables

In **Vercel Dashboard** → **Settings** → **Environment Variables**:

```
DATABASE_URL=postgresql://neondb_owner:npg_tQO60jBNVnih@ep-quiet-mountain-ah64qrsd-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

### Step 5: Alternative - Use vercel.json (If Auto-Detect Doesn't Work)

If auto-detection fails, use this `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index"
    },
    {
      "source": "/(.*)",
      "destination": "/api/index"
    }
  ]
}
```

**Important:** Note the destination is `/api/index` (no `.js` extension)

### Step 6: Test

1. Push changes to GitHub
2. Vercel will auto-deploy
3. Visit: `https://your-backend.vercel.app/api/health`
4. Should return: `{"status":"ok",...}`

### Step 7: If Still Not Working

Try this minimal `api/index.js`:

```javascript
module.exports = (req, res) => {
  res.json({ message: 'Function works!', url: req.url });
};
```

If this works, gradually add back the Express app.

---

## Quick Checklist

- [ ] Root Directory set to `backend` in Vercel
- [ ] Build Command includes `prisma:generate`
- [ ] `api/index.js` exists and exports the app
- [ ] Environment variables are set
- [ ] Test `/api/test` endpoint first
- [ ] Check function logs in Vercel dashboard

---

**Most Common Fix:** Set Root Directory to `backend` in Vercel project settings!


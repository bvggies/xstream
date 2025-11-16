# Deployment Guide for Xstream

## 🚀 Quick Deployment Guide

### Prerequisites
- GitHub account
- Neon PostgreSQL account (free tier available)
- Vercel account (free tier available)

## Step 1: Database Setup (Neon PostgreSQL)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://user:password@host/dbname`)
4. Save this for later use

## Step 2: Backend Deployment

### Option A: Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: `npm install && npm run prisma:generate`
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`
   - **Start Command**: `npm start`

6. Add Environment Variables:
   ```
   DATABASE_URL=your_neon_connection_string
   JWT_SECRET=your_random_secret_key_here
   JWT_REFRESH_SECRET=your_random_refresh_secret_here
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   PORT=5000
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-url.vercel.app
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=5242880
   ```

7. Deploy!

### Option B: Render

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: xstream-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install && npm run prisma:generate`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: `backend`

5. Add the same environment variables as above
6. Deploy!

### Post-Deployment: Run Migrations

After backend is deployed, you need to run Prisma migrations:

1. SSH into your server or use Render shell
2. Run: `cd backend && npx prisma migrate deploy`
3. Or use Prisma Studio: `npx prisma studio`

## Step 3: Frontend Deployment (Vercel)

1. Go to Vercel dashboard
2. Click "New Project"
3. Import the same GitHub repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Create React App
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

5. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://your-backend-url.vercel.app/api
   ```
   (or your Render backend URL)

6. Deploy!

## Step 4: Update CORS and Frontend URL

After both are deployed:

1. Update backend `FRONTEND_URL` env var to your frontend URL
2. Redeploy backend
3. Update frontend `REACT_APP_API_URL` to your backend URL
4. Redeploy frontend

## Step 5: File Uploads (Optional)

For file uploads to work in production:

- **Vercel**: Use Vercel Blob or external storage (S3, Cloudinary)
- **Render**: Use external storage (S3, Cloudinary)

Update `backend/src/middleware/upload.js` to use external storage.

## Step 6: Email Configuration

For password reset emails:

1. Use Gmail App Password:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Generate App Password
   - Use it as `EMAIL_PASS`

2. Or use SendGrid/Mailgun:
   - Update `backend/src/services/emailService.js`
   - Use their SMTP settings

## Step 7: Create Admin User

After deployment, create an admin user:

1. Register normally through the app
2. Connect to your database (Neon dashboard → SQL Editor)
3. Run:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```

## 🎉 You're Done!

Your app should now be live at:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.vercel.app`

## Troubleshooting

### Database Connection Issues
- Check `DATABASE_URL` format
- Ensure Neon database is active
- Check firewall settings

### CORS Errors
- Verify `FRONTEND_URL` in backend matches frontend domain
- Check browser console for exact error

### Build Failures
- Check Node.js version (should be 18+)
- Verify all dependencies are in package.json
- Check build logs for specific errors

### Socket.io Issues
- Ensure WebSocket is enabled on hosting platform
- Check Socket.io CORS configuration
- Verify Socket.io version compatibility

## Monitoring

- Use Vercel Analytics for frontend
- Use Render logs for backend
- Set up error tracking (Sentry recommended)

---

Happy deploying! 🚀


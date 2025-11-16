# Deployment Guide for Xstream

## 🚀 Complete Deployment Guide

Deploy Xstream using **GitHub**, **Vercel**, and **Neon PostgreSQL**.

### Prerequisites
- ✅ GitHub account (free)
- ✅ Neon PostgreSQL account (free tier available at [neon.tech](https://neon.tech))
- ✅ Vercel account (free tier available at [vercel.com](https://vercel.com))

---

## Step 1: Push Code to GitHub

1. **Create a GitHub repository** (if you haven't already):
   - Go to [github.com](https://github.com) and create a new repository
   - Name it `xstream` (or your preferred name)

2. **Push your code**:
   ```bash
   git remote add origin https://github.com/yourusername/xstream.git
   git branch -M main
   git push -u origin main
   ```

---

## Step 2: Set Up Neon PostgreSQL Database

1. **Create Neon Account**:
   - Go to [neon.tech](https://neon.tech)
   - Sign up with GitHub (recommended) or email

2. **Create a New Project**:
   - Click "Create Project"
   - Choose a project name (e.g., "xstream")
   - Select a region closest to your users
   - Click "Create Project"

3. **Get Connection String**:
   - After project creation, you'll see a connection string
   - It looks like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
   - **Copy this connection string** - you'll need it for backend deployment

4. **Test Connection** (Optional):
   - Use Neon's SQL Editor to verify the database is working
   - You can run: `SELECT 1;` to test

---

## Step 3: Deploy Backend to Vercel

1. **Go to Vercel Dashboard**:
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub (recommended)

2. **Import GitHub Repository**:
   - Click "Add New..." → "Project"
   - Select your `xstream` repository
   - Click "Import"

3. **Configure Backend Project**:
   - **Project Name**: `xstream-backend` (or your choice)
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
   - **Build Command**: `npm install && npm run prisma:generate`
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`
   - **Start Command**: `npm start`

4. **Add Environment Variables**:
   Click "Environment Variables" and add:
   
   ```
   DATABASE_URL=your_neon_connection_string_here
   JWT_SECRET=generate_random_32_char_string
   JWT_REFRESH_SECRET=generate_random_32_char_string
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://your-frontend-app.vercel.app
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-gmail-app-password
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=5242880
   ```

   **Generate JWT Secrets** (use one of these):
   ```bash
   # Linux/Mac:
   openssl rand -base64 32
   
   # Windows PowerShell:
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   ```

   **Note**: Leave `FRONTEND_URL` empty for now - we'll update it after frontend deployment.

5. **Deploy Backend**:
   - Click "Deploy"
   - Wait for deployment to complete
   - **Copy your backend URL** (e.g., `https://xstream-backend.vercel.app`)

---

## Step 4: Run Database Migrations

After backend is deployed, run Prisma migrations:

1. **Option 1: Using Vercel CLI** (Recommended):
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link to your project
   cd backend
   vercel link
   
   # Run migrations
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

2. **Option 2: Using Neon SQL Editor**:
   - Go to Neon dashboard → SQL Editor
   - Run the migration SQL manually (from `prisma/migrations` folder)

3. **Option 3: Using Prisma Studio Locally**:
   ```bash
   cd backend
   # Set DATABASE_URL in your local .env
   npx prisma migrate deploy
   ```

---

## Step 5: Deploy Frontend to Vercel

1. **Go to Vercel Dashboard**:
   - Click "Add New..." → "Project"
   - Select the same `xstream` repository

2. **Configure Frontend Project**:
   - **Project Name**: `xstream` (or your choice)
   - **Root Directory**: `frontend`
   - **Framework Preset**: Create React App
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

3. **Add Environment Variable**:
   ```
   REACT_APP_API_URL=https://your-backend-url.vercel.app/api
   ```
   Replace `your-backend-url.vercel.app` with your actual backend URL from Step 3.

4. **Deploy Frontend**:
   - Click "Deploy"
   - Wait for deployment to complete
   - **Copy your frontend URL** (e.g., `https://xstream.vercel.app`)

---

## Step 6: Update Backend CORS Configuration

1. **Go back to Backend Project** in Vercel:
   - Navigate to Settings → Environment Variables
   - Update `FRONTEND_URL` to your frontend URL:
     ```
     FRONTEND_URL=https://your-frontend-app.vercel.app
     ```

2. **Redeploy Backend**:
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment
   - This ensures CORS is properly configured

---

## Step 7: Create Admin User

After deployment, create your admin account:

1. **Register via Frontend**:
   - Go to your frontend URL
   - Click "Sign Up" and create an account
   - Note your email address

2. **Make User Admin**:
   - Go to Neon dashboard → SQL Editor
   - Run this SQL query:
     ```sql
     UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
     ```
   - Replace `your-email@example.com` with your registered email

3. **Verify Admin Access**:
   - Logout and login again
   - You should see the "Admin" link in the navbar

---

## Step 8: Configure File Uploads (Optional)

Vercel has a serverless architecture, so file uploads need external storage:

### Option 1: Vercel Blob (Recommended)
1. Install Vercel Blob:
   ```bash
   npm install @vercel/blob
   ```
2. Update `backend/src/middleware/upload.js` to use Vercel Blob
3. Add `BLOB_READ_WRITE_TOKEN` to Vercel environment variables

### Option 2: Cloudinary (Alternative)
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your API credentials
3. Update upload middleware to use Cloudinary SDK
4. Add Cloudinary env vars to Vercel

**Note**: For now, file uploads will work but files won't persist between deployments. Use external storage for production.

---

## Step 9: Configure Email (Optional)

For password reset and email verification:

### Gmail Setup:
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password:
   - Go to App Passwords
   - Generate password for "Mail"
   - Copy the 16-character password
4. Add to Vercel environment variables:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-char-app-password
   ```

### Alternative: SendGrid
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get API key
3. Update `backend/src/services/emailService.js` to use SendGrid
4. Add SendGrid credentials to Vercel

---

## 🎉 Deployment Complete!

Your application is now live:

- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-backend.vercel.app/api`
- **Database**: Neon PostgreSQL (managed)

---

## 🔧 Troubleshooting

### Database Connection Issues
- ✅ Verify `DATABASE_URL` includes `?sslmode=require`
- ✅ Check Neon dashboard - ensure database is active
- ✅ Verify connection string format is correct

### CORS Errors
- ✅ Ensure `FRONTEND_URL` in backend matches frontend domain exactly
- ✅ Check browser console for specific CORS error
- ✅ Redeploy backend after updating `FRONTEND_URL`

### Build Failures
- ✅ Check Node.js version in Vercel (should be 18+)
- ✅ Verify all dependencies in `package.json`
- ✅ Check build logs in Vercel dashboard for specific errors
- ✅ Ensure `prisma:generate` runs in build command

### Socket.io Issues
- ✅ Vercel supports WebSockets on Pro plan
- ✅ For free tier, Socket.io will use polling fallback
- ✅ Check Socket.io CORS configuration matches frontend URL

### Migration Errors
- ✅ Ensure `DATABASE_URL` is set correctly
- ✅ Run `npx prisma generate` before migrations
- ✅ Check Prisma migration files are committed to GitHub

---

## 📊 Monitoring & Analytics

### Vercel Analytics
- Enable Vercel Analytics in project settings
- View real-time analytics in Vercel dashboard

### Neon Monitoring
- Check database performance in Neon dashboard
- Monitor connection pool usage
- View query performance

### Error Tracking
- Consider adding Sentry for error tracking
- Monitor Vercel function logs
- Check Neon query logs

---

## 🔄 Updating Your Deployment

### To Update Code:
1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
2. Vercel automatically deploys on push to main branch

### To Update Environment Variables:
1. Go to Vercel project → Settings → Environment Variables
2. Update/add variables
3. Redeploy (Vercel will prompt you)

### To Run New Migrations:
1. Create migration locally:
   ```bash
   cd backend
   npx prisma migrate dev --name your_migration_name
   ```
2. Push to GitHub
3. Run `npx prisma migrate deploy` via Vercel CLI or Neon SQL Editor

---

## 📝 Quick Reference

### Important URLs:
- **GitHub Repo**: `https://github.com/yourusername/xstream`
- **Vercel Dashboard**: `https://vercel.com/dashboard`
- **Neon Dashboard**: `https://console.neon.tech`

### Key Environment Variables:
- `DATABASE_URL` - Neon connection string
- `JWT_SECRET` - Random 32+ char string
- `FRONTEND_URL` - Your frontend Vercel URL
- `REACT_APP_API_URL` - Your backend Vercel URL + `/api`

---

## 🎯 Next Steps

1. ✅ Test all features (login, streaming, admin panel)
2. ✅ Set up custom domain (optional)
3. ✅ Configure email service
4. ✅ Set up file storage (Vercel Blob/Cloudinary)
5. ✅ Enable Vercel Analytics
6. ✅ Set up error tracking (Sentry)

---

**Happy deploying! 🚀**

For issues or questions, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

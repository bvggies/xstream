# Setup Instructions

## 🚀 Complete Setup Guide

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Database Setup

1. **Create Neon PostgreSQL Database:**
   - Go to [neon.tech](https://neon.tech)
   - Sign up/login
   - Create a new project
   - Copy the connection string

2. **Configure Backend Environment:**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `.env` and add your database URL:
   ```env
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   ```

3. **Run Database Migrations:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Seed Database (Optional):**
   ```bash
   npm run seed
   ```
   This creates:
   - Admin user: `admin@xstream.com` / `admin123`
   - Test user: `user@xstream.com` / `user123`
   - Sample matches

### Step 3: Configure Backend

Edit `backend/.env` with all required values:

```env
# Database
DATABASE_URL="your_neon_connection_string"

# JWT Secrets (generate random strings)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

**Generate JWT Secrets:**
```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Step 4: Configure Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 5: Create Upload Directories

```bash
# Backend uploads directory
mkdir -p backend/uploads/avatars
mkdir -p backend/uploads/thumbnails
```

### Step 6: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Step 7: Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

### Step 8: Create Admin User (if not seeded)

**Option 1: Using Script**
```bash
cd backend
npm run create-admin your-email@example.com your-password
```

**Option 2: Using Prisma Studio**
```bash
cd backend
npm run prisma:studio
```
Then update user role to `ADMIN` in the UI.

**Option 3: SQL Query**
Connect to your database and run:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## 🔧 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` format
- Check if database is active in Neon dashboard
- Ensure SSL mode is set correctly

### Port Already in Use
- Change `PORT` in backend `.env`
- Update `REACT_APP_API_URL` in frontend `.env`

### CORS Errors
- Verify `FRONTEND_URL` in backend `.env` matches frontend URL
- Check browser console for exact error

### Prisma Errors
- Run `npm run prisma:generate` after schema changes
- Run `npm run prisma:migrate` to apply migrations
- Check `DATABASE_URL` is correct

### Build Errors
- Ensure Node.js version is 18+
- Delete `node_modules` and `package-lock.json`, then `npm install`
- Check for missing dependencies

## 📝 Next Steps

1. ✅ Verify login works
2. ✅ Test admin panel access
3. ✅ Add your first match via admin panel
4. ✅ Test streaming functionality
5. ✅ Customize branding (logo, colors)

## 🎨 Customization

**Change Colors:**
Edit `frontend/tailwind.config.js` - modify the `primary` color values.

**Change Logo:**
Replace `frontend/public/logo.png` and `frontend/public/favicon.png`

**Email Templates:**
Edit `backend/src/services/emailService.js`

---

Need help? Check the [README.md](README.md) or [DEPLOYMENT.md](DEPLOYMENT.md) for more details.


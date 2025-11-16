# Quick Start Guide - Xstream

## 🚀 Get Started in 5 Minutes

### 1. Clone and Install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL

# Frontend  
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your backend URL
```

### 2. Database Setup

1. Create a Neon PostgreSQL database at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Update `backend/.env`:
   ```
   DATABASE_URL="your_neon_connection_string"
   ```

### 3. Run Migrations

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Development Servers

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

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### 6. Create Admin User

1. Register a new account at http://localhost:3000/register
2. Connect to your database and run:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
   ```

### 7. Test Features

- ✅ Register/Login
- ✅ Browse matches
- ✅ Watch streams (add matches via admin panel)
- ✅ User dashboard
- ✅ Admin panel
- ✅ Real-time chat

## 📝 Important Notes

- **Email Verification**: In development, check console/logs for verification tokens
- **File Uploads**: Create `backend/uploads` directory for local storage
- **Socket.io**: Ensure WebSocket is enabled in your environment

## 🐛 Common Issues

**Database Connection Error:**
- Verify DATABASE_URL format
- Check Neon database is active

**CORS Error:**
- Ensure FRONTEND_URL in backend .env matches frontend URL

**Build Errors:**
- Run `npm install` in both directories
- Check Node.js version (18+)

## 📚 Next Steps

- Read [README.md](README.md) for full documentation
- Read [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Customize colors in `frontend/tailwind.config.js`
- Add your logo/favicon to `frontend/public/`

---

Happy coding! 🎉


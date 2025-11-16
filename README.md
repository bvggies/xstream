# Xstream - Live Football Streaming Platform

A complete, production-ready live football streaming web application built with React, Node.js, Express, and PostgreSQL.

## 🚀 Features

### User Features
- **Live Streaming**: Watch live football matches with HLS.js player
- **Match Management**: Browse live and upcoming matches
- **User Dashboard**: Personalized dashboard with watch history and favorites
- **Profile Management**: Edit profile, change password, manage settings
- **Real-time Chat**: Support chat with admin using Socket.io
- **Notifications**: Match reminders and updates
- **Watch History**: Track watched matches
- **Favorite Leagues**: Save favorite leagues for quick access

### Admin Features
- **Full CRUD**: Manage matches, users, streaming links
- **Analytics Dashboard**: View daily users, page views, match views
- **User Management**: Ban/unban users, view user details
- **Report Management**: Handle broken link reports
- **Audit Logs**: Track all admin actions
- **Real-time Chat**: Support users via chat system

## 🛠️ Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Framer Motion (animations)
- AOS (scroll animations)
- HLS.js (video streaming)
- Socket.io Client (real-time chat)
- React Router (routing)
- Axios (HTTP client)

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL (Neon)
- Socket.io (real-time)
- JWT (authentication)
- Bcrypt (password hashing)
- Multer (file uploads)
- Nodemailer (email)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Neon PostgreSQL)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
DATABASE_URL="postgresql://user:password@host:5432/xstream?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

5. Generate Prisma client:
```bash
npm run prisma:generate
```

6. Run database migrations:
```bash
npm run prisma:migrate
```

7. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm start
```

## 🗄️ Database Schema

The application uses Prisma with PostgreSQL. Key models:

- **User**: User accounts with authentication
- **Match**: Football matches with streaming links
- **StreamingLink**: Multiple streaming sources per match
- **WatchHistory**: User watch history
- **Notification**: User notifications
- **ChatMessage**: Support chat messages
- **Report**: Broken link reports
- **AuditLog**: Admin action logs
- **Analytics**: Daily analytics data

## 🔐 Authentication

- JWT tokens stored in httpOnly secure cookies
- Access token (15 min expiry)
- Refresh token (7 day expiry)
- Automatic token refresh on 401 errors
- Password reset via email
- Email verification

## 📡 Real-time Features

- Socket.io for real-time chat
- Live match status updates
- Admin-user chat support
- Typing indicators

## 🎨 UI/UX Features

- Modern glassmorphism design
- Smooth animations (Framer Motion + AOS)
- Fully responsive (mobile-first)
- Dark theme
- Premium sports streaming look
- Black + Emerald + White color palette

## 🚀 Deployment

Deploy using **GitHub**, **Vercel**, and **Neon PostgreSQL**.

### Quick Deployment Steps

1. **Push code to GitHub**:
   ```bash
   git push origin main
   ```

2. **Set up Neon PostgreSQL**:
   - Create account at [neon.tech](https://neon.tech)
   - Create new project
   - Copy connection string

3. **Deploy Backend to Vercel**:
   - Import GitHub repository
   - Set root directory: `backend`
   - Build command: `npm install && npm run prisma:generate`
   - Add environment variables (see DEPLOYMENT.md)

4. **Deploy Frontend to Vercel**:
   - Import same GitHub repository
   - Set root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Add `REACT_APP_API_URL` environment variable

5. **Run Database Migrations**:
   ```bash
   npx prisma migrate deploy
   ```

**📖 For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**

## 📝 Environment Variables

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for access tokens
- `JWT_REFRESH_SECRET`: Secret for refresh tokens
- `FRONTEND_URL`: Frontend URL for CORS
- `EMAIL_*`: Email configuration for password reset

### Frontend
- `REACT_APP_API_URL`: Backend API URL

## 🧪 Testing

To test the application:

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm start`
3. Register a new account
4. Verify email (check console for token in development)
5. Login and explore features

## 📁 Project Structure

```
/backend
  /src
    /controllers    # Route controllers
    /routes         # API routes
    /middleware     # Auth, validation, error handling
    /services       # Email, etc.
    /utils          # Prisma, JWT utilities
    /socket         # Socket.io handlers
  /prisma
    schema.prisma   # Database schema
  server.js         # Entry point

/frontend
  /src
    /pages          # Page components
    /components     # Reusable components
    /layouts        # Layout components
    /context        # React context (Auth)
    /utils          # Axios, socket utilities
    /assets         # Images, etc.
  App.js            # Main app component
  index.js          # Entry point
```

## 🔒 Security Features

- Helmet.js for security headers
- Rate limiting
- CORS configuration
- Input validation (express-validator)
- SQL injection protection (Prisma)
- XSS protection
- httpOnly cookies for tokens
- Password hashing (bcrypt)

## 📱 Mobile Responsiveness

- Fully responsive design
- Mobile-optimized navigation
- Touch-friendly UI
- Mobile drawer sidebar
- Optimized for all screen sizes

## 🎯 Key Features Implementation

- ✅ Admin dashboard with full CRUD
- ✅ User dashboard with personalization
- ✅ Live streaming with HLS.js
- ✅ Real-time chat with Socket.io
- ✅ JWT authentication (httpOnly cookies)
- ✅ Modern auth pages (Login, Register, Forgot Password)
- ✅ Beautiful profile page with tabs
- ✅ Mobile responsive design
- ✅ Analytics and reporting
- ✅ Audit logging

## 📄 License

This project is proprietary software.

## 🤝 Support

For support, use the in-app chat feature or contact the admin.

---

Built with ❤️ for football fans worldwide.


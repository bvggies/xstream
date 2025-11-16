# Database Setup Guide

## 🗄️ Neon PostgreSQL Setup

### Your Connection String

```
postgresql://neondb_owner:npg_tQO60jBNVnih@ep-quiet-mountain-ah64qrsd-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Step 1: Update Backend .env File

1. Navigate to `backend` directory
2. Copy `.env.example` to `.env` (if not exists):
   ```bash
   cd backend
   cp .env.example .env
   ```

3. Edit `.env` and update `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_tQO60jBNVnih@ep-quiet-mountain-ah64qrsd-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
   ```

### Step 2: Test Database Connection

```bash
cd backend
npm run test:db
```

This will:
- ✅ Test connection to Neon database
- ✅ Verify database is accessible
- ✅ List existing tables

### Step 3: Generate Prisma Client

```bash
npm run prisma:generate
```

### Step 4: Run Database Migrations

```bash
npm run prisma:migrate
```

This will:
- Create all database tables
- Set up relationships
- Create indexes

### Step 5: Verify Setup

```bash
# Open Prisma Studio to view database
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` to view your database.

---

## 🔧 Troubleshooting

### Connection Issues

**Error: "Connection refused"**
- ✅ Check Neon dashboard - ensure database is active
- ✅ Verify connection string is correct
- ✅ Check if IP is whitelisted (Neon allows all by default)

**Error: "SSL required"**
- ✅ Ensure `?sslmode=require` is at the end of connection string
- ✅ Neon requires SSL connections

**Error: "Authentication failed"**
- ✅ Verify username and password in connection string
- ✅ Check if password contains special characters (may need URL encoding)

### Migration Issues

**Error: "Migration failed"**
- ✅ Ensure Prisma client is generated: `npm run prisma:generate`
- ✅ Check database connection: `npm run test:db`
- ✅ Verify you have write permissions

---

## 📊 Database Schema

After running migrations, you'll have these tables:

- `users` - User accounts
- `matches` - Football matches
- `streaming_links` - Streaming sources
- `watch_history` - User watch history
- `notifications` - User notifications
- `chat_messages` - Support chat
- `reports` - Broken link reports
- `audit_logs` - Admin actions
- `analytics` - Daily analytics

---

## 🚀 Quick Commands

```bash
# Test connection
npm run test:db

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open database GUI
npm run prisma:studio

# Seed sample data
npm run seed

# Create admin user
npm run create-admin email@example.com password
```

---

## 🔐 Security Notes

- ⚠️ Never commit `.env` file to Git (already in .gitignore)
- ⚠️ Keep your database password secure
- ⚠️ Use environment variables in production (Vercel)
- ⚠️ Rotate passwords regularly

---

## 📝 Next Steps

1. ✅ Test database connection
2. ✅ Run migrations
3. ✅ Seed sample data (optional)
4. ✅ Create admin user
5. ✅ Start backend server: `npm run dev`

For production deployment, see [DEPLOYMENT.md](../DEPLOYMENT.md)


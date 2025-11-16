# Database Setup - Quick Guide

## Your Neon PostgreSQL Connection String

```
postgresql://neondb_owner:npg_tQO60jBNVnih@ep-quiet-mountain-ah64qrsd-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Quick Setup Steps

### 1. Create .env File

In the `backend` directory, create a `.env` file with this content:

```env
DATABASE_URL="postgresql://neondb_owner:npg_tQO60jBNVnih@ep-quiet-mountain-ah64qrsd-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

JWT_SECRET="your-random-secret-key-min-32-characters"
JWT_REFRESH_SECRET="your-random-refresh-secret-min-32-characters"
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

### 2. Generate JWT Secrets

Run these commands to generate secure secrets:

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Linux/Mac:**
```bash
openssl rand -base64 32
```

Copy the output and use as `JWT_SECRET` and `JWT_REFRESH_SECRET` (use different values for each).

### 3. Test Database Connection

```bash
npm run test:db
```

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Run Migrations

```bash
npm run prisma:migrate
```

### 6. (Optional) Seed Database

```bash
npm run seed
```

This creates:
- Admin user: `admin@xstream.com` / `admin123`
- Test user: `user@xstream.com` / `user123`
- Sample matches

### 7. Start Backend

```bash
npm run dev
```

---

## Verify Everything Works

1. ✅ Database connection test passes
2. ✅ Migrations run successfully
3. ✅ Backend server starts on http://localhost:5000
4. ✅ Health check: http://localhost:5000/api/health

---

## Troubleshooting

**Connection Error?**
- Check Neon dashboard - database must be active
- Verify connection string is correct
- Ensure `?sslmode=require` is included

**Migration Error?**
- Run `npm run prisma:generate` first
- Check database connection: `npm run test:db`

**Need Help?**
- See [SETUP_DATABASE.md](../SETUP_DATABASE.md) for detailed guide
- Check Neon dashboard for database status


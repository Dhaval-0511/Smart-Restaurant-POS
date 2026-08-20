# Deployment Guide

## Project
Smart Restaurant Operations & POS Platform

## Version
1.0

## Prepared By
Prince Movaliya

## Purpose
This document defines the local setup instructions, environment variables, and deployment steps for the platform.

---

## 1. Prerequisites
- Node.js v18+
- PostgreSQL v15+
- npm or yarn
- Git

---

## 2. Environment Variables

### server/.env
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/odoo_cafe
PORT=5000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
JWT_REMEMBER_ME_EXPIRES_IN=30d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
CLIENT_URL=http://localhost:5173
```

---

## 3. Local Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd Odoo-Cafe-latest
```

### Step 2: Install Dependencies
```bash
# Root
npm install

# Server
cd server
npm install

# Client
cd ../client
npm install
```

### Step 3: Setup PostgreSQL
- Install PostgreSQL from https://www.postgresql.org/download
- Create database:
```sql
CREATE DATABASE odoo_cafe;
```

### Step 4: Configure Environment
- Copy server/.env example and fill in your values
- Set DATABASE_URL with your PostgreSQL credentials

### Step 5: Run Database Migrations
```bash
cd server
npx prisma db push
```

### Step 6: Seed Database (Optional)
```bash
npm run prisma:seed
```

### Step 7: Start Development Servers
```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- pgAdmin: http://localhost/pgadmin4

---

## 4. Common Errors

### Cannot connect to database
- Ensure PostgreSQL service is running
- Verify DATABASE_URL in .env
- Check username and password

### Port already in use
- PostgreSQL default: 5432
- Server default: 5000
- Client default: 5173
- Change ports in .env or vite.config if needed

### Prisma client not generated
```bash
cd server
npx prisma generate
```

---

## 5. Production Deployment (Future)
- Containerize with Docker
- Deploy backend on VPS or cloud (Railway, Render, AWS)
- Deploy frontend on Vercel or Netlify
- Use managed PostgreSQL (Supabase, Neon, or RDS)
- Set all environment variables in hosting platform
- Enable HTTPS

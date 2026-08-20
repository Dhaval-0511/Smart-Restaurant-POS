# Setup Guide

## Prerequisites
- Node.js v18+
- PostgreSQL (or Neon cloud DB)

## Installation

### 1. Clone the repo
```bash
git clone https://github.com/Dhaval-0511/Smart-Restaurant-POS.git
cd Smart-Restaurant-POS
```

### 2. Setup Server
```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:
```
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

Push schema & seed database:
```bash
npx prisma db push
node prisma/custom_seed.js
```

Start server:
```bash
npm run dev
```
> Runs on http://localhost:5000

### 3. Setup Client
```bash
cd client
npm install
npm run dev
```
> Runs on http://localhost:5173

## Default Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin1@cafe.com | password123 |
| Admin | admin2@cafe.com | password123 |
| Employee | emp1@cafe.com | password123 |
| Employee | emp2@cafe.com | password123 |
| Employee | emp3@cafe.com | password123 |

# Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

## Step-by-Step Setup

### 1. Install Dependencies

```bash
# From the root of the monorepo
npm install

# Or from the api directory
cd apps/api
npm install
```

### 2. Set Up PostgreSQL Database

**Option A: Using Docker (Recommended)**

```bash
docker run --name genova-postgres \
  -e POSTGRES_USER=genova \
  -e POSTGRES_PASSWORD=genova123 \
  -e POSTGRES_DB=genova_dev \
  -p 5432:5432 \
  -d postgres:14
```

**Option B: Using Local PostgreSQL**

```bash
# Create database
createdb genova_dev

# Or using psql
psql -U postgres
CREATE DATABASE genova_dev;
\q
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update the `.env` file with your database credentials:

```env
# Database Configuration
DATABASE_URL=postgresql://genova:genova123@localhost:5432/genova_dev

# JWT Configuration (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Server Configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Push Database Schema

**Option A: Push schema directly (for development)**

```bash
npm run db:push
```

**Option B: Create migration (recommended for production)**

```bash
npm run db:migrate
```

When prompted, enter a migration name like: `init`

### 6. Verify Setup

Check that the database tables were created:

```bash
npm run db:studio
```

This will open Prisma Studio in your browser where you can view the database schema.

### 7. Run Tests

```bash
npm test
```

### 8. Start Development Server

```bash
npm run dev
```

The API should now be running at `http://localhost:3000`

### 9. Test the API

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Register a User:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## Troubleshooting

### Database Connection Issues

**Error: `P1001: Can't reach database server`**

- Check that PostgreSQL is running: `pg_isready`
- Verify the DATABASE_URL in `.env`
- Check firewall settings

**Error: `P1003: Database does not exist`**

- Create the database: `createdb genova_dev`
- Or update DATABASE_URL to point to an existing database

### Prisma Issues

**Error: `@prisma/client did not initialize yet`**

- Run: `npm run db:generate`
- Restart your development server

**Error: `Migration failed`**

- Reset the database: `npx prisma migrate reset`
- Push schema again: `npm run db:push`

### Port Already in Use

If port 3000 is already in use:

1. Change PORT in `.env` to another port (e.g., 3001)
2. Or kill the process using port 3000:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

## Next Steps

After setup is complete:

1. ✅ Authentication system is ready
2. 📝 Implement user profile management (Task 3)
3. 📝 Implement class management (Task 4)
4. 📝 Continue with remaining tasks

## Useful Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:migrate       # Create and run migrations
npm run db:studio        # Open Prisma Studio

# Testing
npm test                 # Run all tests
npm run test:property    # Run property-based tests only

# Code Quality
npm run lint             # Run ESLint
npm run check-types      # Run TypeScript type checking
```

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `JWT_SECRET` | Secret key for JWT signing | - | ✅ |
| `JWT_ACCESS_EXPIRATION` | Access token expiration | 15m | ❌ |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiration | 7d | ❌ |
| `NODE_ENV` | Environment (development/production) | development | ❌ |
| `PORT` | Server port | 3000 | ❌ |
| `LOG_LEVEL` | Logging level | info | ❌ |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 60000 | ❌ |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 | ❌ |

## Production Deployment Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Use a managed PostgreSQL database
- [ ] Enable SSL for database connection
- [ ] Set up proper logging and monitoring
- [ ] Configure CORS for your frontend domain
- [ ] Set up rate limiting
- [ ] Enable HTTPS
- [ ] Set up automated backups
- [ ] Configure environment-specific secrets
- [ ] Run security audit: `npm audit`

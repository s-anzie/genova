# Authentication Quick Reference

## 🚀 Quick Start

```bash
# 1. Setup database
docker run --name genova-postgres -e POSTGRES_PASSWORD=genova123 -p 5432:5432 -d postgres:14

# 2. Configure .env
echo "DATABASE_URL=postgresql://postgres:genova123@localhost:5432/genova_dev" > .env
echo "JWT_SECRET=your-secret-key" >> .env

# 3. Setup database
npm run db:push

# 4. Start server
npm run dev
```

## 📡 API Endpoints

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT"  // Optional: STUDENT, TUTOR, ADMIN
}

Response: { accessToken, refreshToken, user }
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response: { accessToken, refreshToken, user }
```

### Refresh Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}

Response: { accessToken }
```

### Logout
```bash
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}

Response: { success: true }
```

### Forgot Password
```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: { resetToken }  // In production, sent via email
```

### Reset Password
```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token",
  "newPassword": "newPassword123"
}

Response: { success: true }
```

### Get Current User
```bash
GET /api/auth/me
Authorization: Bearer your-access-token

Response: { user }
```

## 🔐 Using Authentication in Code

### Protect a Route
```typescript
import { authenticate, authorize } from './middleware/auth.middleware';
import { Role } from '@prisma/client';

// Require authentication
router.get('/protected', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Require specific role
router.post('/admin-only', 
  authenticate, 
  authorize(Role.ADMIN), 
  (req, res) => {
    // Only admins can access
  }
);

// Multiple roles allowed
router.get('/tutors-and-admins',
  authenticate,
  authorize(Role.TUTOR, Role.ADMIN),
  (req, res) => {
    // Tutors and admins can access
  }
);
```

### Access User in Request
```typescript
router.get('/profile', authenticate, (req, res) => {
  const userId = req.user.userId;
  const email = req.user.email;
  const role = req.user.role;
  
  // Use user information
});
```

### Use Auth Service
```typescript
import { register, login, hashPassword } from './services/auth.service';

// Register user
const result = await register({
  email: 'user@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
});

// Login user
const tokens = await login({
  email: 'user@example.com',
  password: 'password123',
});

// Hash password
const hash = await hashPassword('myPassword');
```

## 🧪 Testing

### Run Tests
```bash
npm test                    # All tests
npm test auth.service       # Specific test file
npm run test:property       # Property-based tests
```

### Test with curl
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current user (replace TOKEN)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## 🗄️ Database Models

### User
```typescript
{
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TUTOR' | 'ADMIN';
  walletBalance: number;
  isVerified: boolean;
  isActive: boolean;
  // ... more fields
}
```

### Access User Data
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Find user
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
});

// Update user
await prisma.user.update({
  where: { id: userId },
  data: { isVerified: true }
});

// Create student profile
await prisma.studentProfile.create({
  data: {
    userId: user.id,
    educationLevel: 'high_school',
    preferredSubjects: ['math', 'physics']
  }
});
```

## ⚙️ Configuration

### Environment Variables
```bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=your-secret-key

# Optional
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
PORT=3000
NODE_ENV=development
```

### Token Expiration
- Access Token: 15 minutes (short-lived)
- Refresh Token: 7 days (long-lived)
- Password Reset: 1 hour

### Security Settings
- Password: Minimum 8 characters
- Bcrypt Rounds: 12
- Rate Limit: 100 requests/minute

## 🐛 Common Issues

### "Can't reach database server"
```bash
# Check PostgreSQL is running
pg_isready

# Or start Docker container
docker start genova-postgres
```

### "Email already registered"
```bash
# Email must be unique
# Use different email or delete existing user
```

### "Invalid or expired token"
```bash
# Token expired - use refresh token to get new access token
# Or login again
```

### "Prisma Client not initialized"
```bash
npm run db:generate
```

## 📚 Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "field": "email",
    "timestamp": "2025-12-20T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

## 🔑 HTTP Status Codes

- `200` - Success
- `201` - Created (registration)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate email)
- `500` - Internal Server Error

## 💡 Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (Expo Secure Store on mobile)
3. **Refresh tokens before expiration**
4. **Logout on token refresh failure**
5. **Never log passwords or tokens**
6. **Validate input on both client and server**
7. **Use environment variables for secrets**
8. **Implement rate limiting**
9. **Monitor failed login attempts**
10. **Keep dependencies updated**

## 🔗 Related Files

- `src/services/auth.service.ts` - Business logic
- `src/middleware/auth.middleware.ts` - Route protection
- `src/routes/auth.routes.ts` - API endpoints
- `prisma/schema.prisma` - Database schema
- `README.md` - Full documentation
- `SETUP.md` - Setup instructions

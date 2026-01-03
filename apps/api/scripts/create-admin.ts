import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@genova.com' }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('Email: admin@genova.com');
      console.log('User ID:', existingAdmin.id);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@genova.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'System',
        role: 'ADMIN',
        isVerified: true,
      }
    });

    console.log('✅ Admin user created successfully');
    console.log('Email: admin@genova.com');
    console.log('Password: Admin123!');
    console.log('User ID:', admin.id);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

/*
Post for login
curl -X POST http://localhost:5001/api/auth/login \ -H "Content-Type: application/json" \ -d '{ "email": "admin@genova.com", "password": "Admin123!" }' | jq -r '.data.accessToken'

run the maintenance cron job
curl -X POST http://localhost:5001/api/maintenance/generate-sessions \
>   -H "Content-Type: application/json" \
>   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxYzQyMDkzYS02NWY5LTQzNWQtOTFjOS1jYmM5YmQ3MTY0NWYiLCJlbWFpbCI6ImFkbWluQGdlbm92YS5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NjczNzU1NTAsImV4cCI6MTc2NzM3NjQ1MCwiYXVkIjoiZ2Vub3ZhLW1vYmlsZSIsImlzcyI6Imdlbm92YS1hcGkifQ.GD9Bh7NxkNpwi3fT7fDCTkIUaqaiYz6ew1yKnK5Mm9Y" | jq
*/
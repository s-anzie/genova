// Types partagés pour l'application web

export type UserRole = 'admin' | 'tutor' | 'student';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  tutorId: string;
  studentId: string;
  subject: string;
  scheduledAt: Date;
  duration: number; // en minutes
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  notes?: string;
  rating?: number;
}

export interface Tutor extends User {
  role: 'tutor';
  subjects: string[];
  hourlyRate: number;
  bio?: string;
  rating?: number;
  totalSessions: number;
}

export interface Student extends User {
  role: 'student';
  level: 'elementary' | 'middle' | 'high' | 'university';
  subjects: string[];
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

export interface Stats {
  totalUsers: number;
  totalTutors: number;
  totalStudents: number;
  totalSessions: number;
  activeSessions: number;
  revenue: number;
}

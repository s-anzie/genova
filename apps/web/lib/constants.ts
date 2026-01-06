// Constantes de l'application

export const APP_NAME = 'Plateforme de Tutorat';

export const ROUTES = {
  HOME: '/',
  
  // Admin routes
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_TUTORS: '/admin/tutors',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_SESSIONS: '/admin/sessions',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_SETTINGS: '/admin/settings',
  
  // Tutor routes
  TUTOR: '/tutor',
  TUTOR_SESSIONS: '/tutor/sessions',
  TUTOR_STUDENTS: '/tutor/students',
  TUTOR_SCHEDULE: '/tutor/schedule',
  TUTOR_EARNINGS: '/tutor/earnings',
  TUTOR_PROFILE: '/tutor/profile',
  
  // Student routes
  STUDENT: '/student',
  STUDENT_SESSIONS: '/student/sessions',
  STUDENT_TUTORS: '/student/tutors',
  STUDENT_SCHEDULE: '/student/schedule',
  STUDENT_PROGRESS: '/student/progress',
  STUDENT_PROFILE: '/student/profile',
} as const;

export const SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  TUTOR: 'tutor',
  STUDENT: 'student',
} as const;

export const EDUCATION_LEVELS = {
  ELEMENTARY: 'elementary',
  MIDDLE: 'middle',
  HIGH: 'high',
  UNIVERSITY: 'university',
} as const;

export const EDUCATION_LEVEL_LABELS = {
  [EDUCATION_LEVELS.ELEMENTARY]: 'Primaire',
  [EDUCATION_LEVELS.MIDDLE]: 'Collège',
  [EDUCATION_LEVELS.HIGH]: 'Lycée',
  [EDUCATION_LEVELS.UNIVERSITY]: 'Université',
} as const;

export const SESSION_STATUS_LABELS = {
  [SESSION_STATUS.SCHEDULED]: 'Planifiée',
  [SESSION_STATUS.ONGOING]: 'En cours',
  [SESSION_STATUS.COMPLETED]: 'Terminée',
  [SESSION_STATUS.CANCELLED]: 'Annulée',
} as const;

export const DEFAULT_SESSION_DURATION = 60; // minutes
export const DEFAULT_CANCELLATION_DELAY = 24; // heures

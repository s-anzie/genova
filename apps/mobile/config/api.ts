/**
 * Configuration de l'API
 * 
 * IMPORTANT: Sur mobile, localhost ne fonctionne pas car il pointe vers le téléphone lui-même.
 * Utilisez l'adresse IP locale de votre PC pour le développement.
 * 
 * Pour trouver votre adresse IP:
 * - Windows: ipconfig
 * - Mac/Linux: ifconfig ou ip addr
 */

// Adresse IP locale du PC pour le développement
const LOCAL_IP = '192.168.1.151';
const LOCAL_IP_Phone = '10.209.150.124'

// Port de l'API
const API_PORT = '5001';

// URL de base de l'API
export const API_BASE_URL = `http://${LOCAL_IP}:${API_PORT}/api`;

// URLs spécifiques
export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    refresh: `${API_BASE_URL}/auth/refresh`,
    forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
  },
  students: {
    profile: `${API_BASE_URL}/students/profile`,
  },
  tutors: {
    profile: `${API_BASE_URL}/tutors/profile`,
  },
  classes: {
    base: `${API_BASE_URL}/classes`,
    byId: (id: string) => `${API_BASE_URL}/classes/${id}`,
    members: (id: string) => `${API_BASE_URL}/classes/${id}/members`,
    removeMember: (classId: string, studentId: string) => 
      `${API_BASE_URL}/classes/${classId}/members/${studentId}`,
    invitation: (id: string) => `${API_BASE_URL}/classes/${id}/invitation`,
    inviteByEmail: (id: string) => `${API_BASE_URL}/classes/${id}/invite`,
  },
  payments: {
    intent: `${API_BASE_URL}/payments/intent`,
    confirm: `${API_BASE_URL}/payments/confirm`,
    wallet: `${API_BASE_URL}/payments/wallet`,
    history: `${API_BASE_URL}/payments/history`,
    withdraw: `${API_BASE_URL}/payments/withdraw`,
  },
};

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur de requête pour ajouter le token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Intercepteur de réponse pour gérer les erreurs et le refresh token
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Si l'erreur est 401 et qu'on n'a pas déjà tenté de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Si un refresh est déjà en cours, mettre la requête en file d'attente
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = this.getRefreshToken();
            
            if (!refreshToken) {
              // Pas de refresh token, déconnecter
              this.handleLogout();
              return Promise.reject(this.handleError(error));
            }

            // Tenter de rafraîchir le token
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data.data;

            // Sauvegarder les nouveaux tokens
            this.setToken(accessToken);
            this.setRefreshToken(newRefreshToken);

            // Mettre à jour le header de la requête originale
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            // Traiter toutes les requêtes en file d'attente
            this.processQueue(null);

            // Réessayer la requête originale
            return this.client(originalRequest);
          } catch (refreshError) {
            // Le refresh a échoué, déconnecter l'utilisateur
            this.processQueue(refreshError);
            this.handleLogout();
            return Promise.reject(this.handleError(error));
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private processQueue(error: any) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });
    this.failedQueue = [];
  }

  private handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Rediriger vers la page de login
      window.location.href = '/login';
    }
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  private setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  private setRefreshToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', token);
    }
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Erreur de réponse du serveur
      const data = error.response.data as any;
      return {
        message: data?.message || data?.error || 'Une erreur est survenue',
        status: error.response.status,
        code: data?.code,
        details: data?.details,
      };
    } else if (error.request) {
      // Pas de réponse du serveur
      return {
        message: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
        status: 0,
      };
    } else {
      // Erreur lors de la configuration de la requête
      return {
        message: error.message || 'Une erreur inattendue est survenue',
      };
    }
  }

  // Méthodes génériques
  async get<T = any>(url: string, config?: any): Promise<ApiResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return this.client.put(url, data, config);
  }

  async delete<T = any>(url: string, config?: any): Promise<ApiResponse<T>> {
    return this.client.delete(url, config);
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
    return this.client.patch(url, data, config);
  }

  // Auth
  async login(email: string, password: string) {
    return this.post('/auth/login', { email, password });
  }

  async logout() {
    return this.post('/auth/logout');
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  // Users
  async getUsers() {
    return this.get('/users');
  }

  async getUser(id: string) {
    return this.get(`/users/${id}`);
  }

  async createUser(data: any) {
    return this.post('/users', data);
  }

  async updateUser(id: string, data: any) {
    return this.put(`/users/${id}`, data);
  }

  async deleteUser(id: string) {
    return this.delete(`/users/${id}`);
  }

  // Sessions
  async getSessions() {
    return this.get('/sessions');
  }

  async getSession(id: string) {
    return this.get(`/sessions/${id}`);
  }

  async createSession(data: any) {
    return this.post('/sessions', data);
  }

  async updateSession(id: string, data: any) {
    return this.put(`/sessions/${id}`, data);
  }

  async deleteSession(id: string) {
    return this.delete(`/sessions/${id}`);
  }

  // Tutors
  async getTutors() {
    return this.get('/tutors');
  }

  async getTutor(id: string) {
    return this.get(`/tutors/${id}`);
  }

  // Students
  async getStudents() {
    return this.get('/students');
  }

  async getStudent(id: string) {
    return this.get(`/students/${id}`);
  }

  // Stats (Admin)
  async getStats() {
    return this.get('/admin/stats');
  }

  async getReports(params?: any) {
    return this.get('/admin/reports', { params });
  }

  // Education System
  async getCountries() {
    return this.get('/education/countries');
  }

  async getEducationSystems(countryCode?: string) {
    return this.get('/education/systems', { params: { countryCode } });
  }

  async getEducationLevels(systemId: string) {
    return this.get(`/education/systems/${systemId}/levels`);
  }

  async getStreams(levelId: string) {
    return this.get(`/education/levels/${levelId}/streams`);
  }

  async getSubjects(category?: string) {
    return this.get('/education/subjects', { params: { category } });
  }

  async getLevelSubjects(levelId: string, category?: string) {
    return this.get(`/education/levels/${levelId}/subjects`, { params: { category } });
  }

  async getLanguages() {
    return this.get('/education/languages');
  }

  async getCities(countryCode: string) {
    return this.get(`/education/countries/${countryCode}/cities`);
  }

  async getSubjectCategories() {
    return this.get('/education/subject-categories');
  }

  // Mobile Money Operators
  async getOperators(country?: string) {
    return this.get('/operators', { params: { country } });
  }

  async getOperator(id: string) {
    return this.get(`/operators/${id}`);
  }

  async createOperator(data: any) {
    return this.post('/operators', data);
  }

  async updateOperator(id: string, data: any) {
    return this.put(`/operators/${id}`, data);
  }

  async deleteOperator(id: string) {
    return this.delete(`/operators/${id}`);
  }

  async seedCameroonOperators() {
    return this.post('/operators/seed/cameroon');
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;

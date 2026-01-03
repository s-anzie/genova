import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient, ApiClientClass } from '@/utils/api-client';
import { useAuth } from './auth-context';
import {
  UserResponse,
  StudentProfileResponse,
  TutorProfileResponse,
} from '@/types/api';

interface ProfileContextType {
  user: UserResponse | null;
  studentProfile: StudentProfileResponse | null;
  tutorProfile: TutorProfileResponse | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateUserProfile: (data: Partial<UserResponse>) => Promise<void>;
  updateStudentProfile: (data: Partial<StudentProfileResponse>) => Promise<void>;
  updateTutorProfile: (data: Partial<TutorProfileResponse>) => Promise<void>;
  uploadAvatar: (uri: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isAuthenticated } = useAuth();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfileResponse | null>(null);
  const [tutorProfile, setTutorProfile] = useState<TutorProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!isAuthenticated || !authUser) {
      setUser(null);
      setStudentProfile(null);
      setTutorProfile(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch user profile
      const userRes = await apiClient.get<{ data: UserResponse }>('/auth/me');
      setUser(userRes.data);

      // Fetch role-specific profile
      if (authUser.role === 'STUDENT' || authUser.role === 'student') {
        try {
          const studentRes = await apiClient.get<{ data: StudentProfileResponse }>(
            `/profiles/student/${authUser.id}`
          );
          setStudentProfile(studentRes.data);
        } catch (err) {
          console.log('No student profile found');
          setStudentProfile(null);
        }
      } else if (authUser.role === 'TUTOR' || authUser.role === 'tutor') {
        try {
          const tutorRes = await apiClient.get<{ data: TutorProfileResponse }>(
            `/profiles/tutor/${authUser.id}`
          );
          setTutorProfile(tutorRes.data);
        } catch (err) {
          console.log('No tutor profile found');
          setTutorProfile(null);
        }
      }
    } catch (err: any) {
      // Ignore logout errors - they're expected during logout flow
      if (ApiClientClass.isLogoutError(err)) {
        console.log('⚠️ Profile load skipped: logout in progress');
        return;
      }
      console.error('Failed to load profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  const updateUserProfile = useCallback(async (data: Partial<UserResponse>) => {
    try {
      setError(null);
      const response = await apiClient.put<{ data: UserResponse }>('/profiles/me', data);
      setUser(response.data);
    } catch (err: any) {
      console.error('Failed to update user profile:', err);
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  }, []);

  const updateStudentProfile = useCallback(async (data: Partial<StudentProfileResponse>) => {
    try {
      setError(null);
      const response = await apiClient.put<{ data: StudentProfileResponse }>(
        '/profiles/student',
        data
      );
      setStudentProfile(response.data);
    } catch (err: any) {
      console.error('Failed to update student profile:', err);
      setError(err.message || 'Failed to update student profile');
      throw err;
    }
  }, []);

  const updateTutorProfile = useCallback(async (data: Partial<TutorProfileResponse>) => {
    try {
      setError(null);
      const response = await apiClient.put<{ data: TutorProfileResponse }>(
        '/profiles/tutor',
        data
      );
      setTutorProfile(response.data);
    } catch (err: any) {
      console.error('Failed to update tutor profile:', err);
      setError(err.message || 'Failed to update tutor profile');
      throw err;
    }
  }, []);

  const uploadAvatar = useCallback(async (uri: string) => {
    try {
      setError(null);
      
      // Create form data for file upload
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('avatar', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await apiClient.post<{ data: { avatarUrl: string } }>(
        '/profiles/me/avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Update user with new avatar URL
      if (user) {
        setUser({ ...user, avatarUrl: response.data.avatarUrl });
      }
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      setError(err.message || 'Failed to upload avatar');
      throw err;
    }
  }, [user]);

  return (
    <ProfileContext.Provider
      value={{
        user,
        studentProfile,
        tutorProfile,
        isLoading,
        error,
        refreshProfile,
        updateUserProfile,
        updateStudentProfile,
        updateTutorProfile,
        uploadAvatar,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

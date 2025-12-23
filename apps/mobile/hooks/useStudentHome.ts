import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/api-client';
import {
    UserResponse,
    SessionResponse,
    ClassResponse,
    SessionReportResponse
} from '@/types/api';

interface StudentHomeData {
    user: UserResponse | null;
    nextSession: SessionResponse | null;
    todaySessions: SessionResponse[];
    activeClasses: ClassResponse[];
    recentReports: SessionReportResponse[];
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
}

export function useStudentHome() {
    const [data, setData] = useState<StudentHomeData>({
        user: null,
        nextSession: null,
        todaySessions: [],
        activeClasses: [],
        recentReports: [],
        isLoading: true,
        isRefreshing: false,
        error: null,
    });

    const fetchData = useCallback(async (isRefresh = false) => {
        try {
            if (!isRefresh) {
                setData(prev => ({ ...prev, isLoading: true, error: null }));
            } else {
                setData(prev => ({ ...prev, isRefreshing: true, error: null }));
            }

            // 1. Fetch User Profile
            const userRes = await apiClient.get<{ data: UserResponse }>('/profiles/user/me').catch(() => apiClient.get<{ data: UserResponse }>('/users/me'));

            // 2. Fetch Confirmed Sessions (Upcoming)
            const now = new Date();
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);

            const nextWeek = new Date(now);
            nextWeek.setDate(now.getDate() + 7);

            // Fetch upcoming sessions for the next week
            const sessionsRes = await apiClient.get<{ data: SessionResponse[] }>(
                `/sessions?status=CONFIRMED&startDate=${now.toISOString()}&endDate=${nextWeek.toISOString()}`
            );

            const allUpcoming = sessionsRes.data || [];

            // Sort by date just in case
            allUpcoming.sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());

            const nextSession = allUpcoming.length > 0 ? allUpcoming[0] : null;

            // Filter for "Today"
            const todayEnd = new Date(todayStart);
            todayEnd.setHours(23, 59, 59, 999);

            const todaySessions = allUpcoming.filter(s => {
                const sDate = new Date(s.scheduledStart);
                return sDate >= todayStart && sDate <= todayEnd;
            });

            // 3. Fetch Active Classes
            const classesRes = await apiClient.get<{ data: ClassResponse[] }>('/classes');
            const activeClasses = (classesRes.data || []).filter(c => c.isActive);

            // 4. Fetch Recent Reports
            const reportsRes = await apiClient.get<{ data: SessionReportResponse[] }>('/sessions/reports/student');
            const recentReports = (reportsRes.data || []).slice(0, 5); // Take last 5

            setData({
                user: userRes.data || null,
                nextSession,
                todaySessions,
                activeClasses,
                recentReports,
                isLoading: false,
                isRefreshing: false,
                error: null,
            });

        } catch (error: any) {
            console.error('Error fetching student home data:', error);
            setData(prev => ({
                ...prev,
                isLoading: false,
                isRefreshing: false,
                error: error.message || 'Failed to load data',
            }));
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = () => fetchData(true);

    return { ...data, refresh };
}

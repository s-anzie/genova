import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/utils/api-client';
import { useAuth } from '@/contexts/auth-context';
import {
    UserResponse,
    SessionResponse,
    TutorProfileResponse
} from '@/types/api';

interface TutorHomeData {
    user: UserResponse | null;
    profile: TutorProfileResponse | null;
    pendingRequests: SessionResponse[];
    nextSession: SessionResponse | null;
    todayEarnings: number;
    monthEarnings: number;
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
}

export function useTutorHome() {
    const { user: authUser } = useAuth();
    const [data, setData] = useState<TutorHomeData>({
        user: null,
        profile: null,
        pendingRequests: [],
        nextSession: null,
        todayEarnings: 0,
        monthEarnings: 0,
        isLoading: true,
        isRefreshing: false,
        error: null,
    });

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!authUser?.id) {
            console.log('No authenticated user, skipping data fetch');
            return;
        }

        try {
            if (!isRefresh) {
                setData(prev => ({ ...prev, isLoading: true, error: null }));
            } else {
                setData(prev => ({ ...prev, isRefreshing: true, error: null }));
            }

            // 1. Fetch User & Profile
            const [userRes, profileRes] = await Promise.all([
                apiClient.get<{ data: UserResponse }>(`/profiles/user/${authUser.id}`),
                apiClient.get<{ data: TutorProfileResponse }>(`/profiles/tutor/${authUser.id}`).catch(() => ({ data: null }))
            ]);

            const userId = userRes.data?.id;

            // 2. Fetch Pending Requests
            const pendingRes = await apiClient.get<{ data: SessionResponse[] }>(
                `/sessions?status=PENDING`
            );
            const pendingRequests = pendingRes.data || [];

            // 3. Fetch Next Session (Confirmed)
            const now = new Date();
            const nextWeek = new Date(now);
            nextWeek.setDate(now.getDate() + 7);

            const sessionsRes = await apiClient.get<{ data: SessionResponse[] }>(
                `/sessions?status=CONFIRMED&startDate=${now.toISOString()}&endDate=${nextWeek.toISOString()}`
            );
            const allUpcoming = sessionsRes.data || [];
            allUpcoming.sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
            const nextSession = allUpcoming.length > 0 ? allUpcoming[0] : null;

            // 4. Calculate Earnings (Mock logic or real if API supports it)
            // We will assume walletBalance is the source of truth for "Current Balance"
            // But for "This Month", we might need to fetch completed sessions for this month.
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const historyRes = await apiClient.get<{ data: SessionResponse[] }>(
                `/sessions?status=COMPLETED&startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
            );
            const completedSessions = historyRes.data || [];
            const monthEarnings = completedSessions.reduce((acc, curr) => acc + (curr.price || 0), 0);

            setData({
                user: userRes.data || null,
                profile: profileRes.data || null,
                pendingRequests,
                nextSession,
                todayEarnings: 0, // Placeholder or fetch specifically for today
                monthEarnings,
                isLoading: false,
                isRefreshing: false,
                error: null,
            });

        } catch (error: any) {
            console.error('Error fetching tutor home data:', error);
            setData(prev => ({
                ...prev,
                isLoading: false,
                isRefreshing: false,
                error: error.message || 'Failed to load data',
            }));
        }
    }, [authUser?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refresh = () => fetchData(true);

    return { ...data, refresh };
}

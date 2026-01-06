'use client';

import { useEffect, useState } from 'react';
import { Users, GraduationCap, Calendar, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatsCard } from '@/components/layout/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  activeTutors: number;
  activeStudents: number;
  sessionsThisMonth: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  tutor: string;
  student: string;
  date: string;
  status: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeTutors: 0,
    activeStudents: 0,
    sessionsThisMonth: 0,
  });
  const [sessionsTrend, setSessionsTrend] = useState({ value: 0, isPositive: true });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/stats/dashboard');
      setStats(response.data.stats);
      setSessionsTrend(response.data.trends.sessions);
      setRecentActivity(response.data.recentActivity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: 'warning', label: 'En attente' },
      CONFIRMED: { variant: 'success', label: 'Confirmée' },
      COMPLETED: { variant: 'default', label: 'Terminée' },
      CANCELLED: { variant: 'error', label: 'Annulée' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de la plateforme Genova"
        action={
          <Button>
            Exporter les données
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Utilisateurs totaux"
          value={loading ? '...' : stats.totalUsers.toString()}
          icon={Users}
          iconColor="text-primary"
        />
        <StatsCard
          title="Tuteurs actifs"
          value={loading ? '...' : stats.activeTutors.toString()}
          icon={GraduationCap}
          iconColor="text-success"
        />
        <StatsCard
          title="Étudiants actifs"
          value={loading ? '...' : stats.activeStudents.toString()}
          icon={Users}
          iconColor="text-warning"
        />
        <StatsCard
          title="Sessions ce mois"
          value={loading ? '...' : stats.sessionsThisMonth.toString()}
          icon={Calendar}
          iconColor="text-error"
          trend={sessionsTrend}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Croissance des utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-400">Graphique à venir</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Sessions par semaine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-400">Graphique à venir</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activité récente</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/admin/activity'}
            >
              Voir tout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              Chargement...
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Aucune activité pour le moment
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{activity.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Tuteur: {activity.tutor} • Étudiant: {activity.student}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

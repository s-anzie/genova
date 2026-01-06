'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface Activity {
  id: string;
  type: string;
  description: string;
  tutor: string;
  student: string;
  date: string;
  status: string;
  scheduledDate: string;
}

export default function ActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchActivities();
  }, [page]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response: any = await api.get('/stats/activity', {
        params: { page, limit: 12 },
      });
      setActivities(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
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
      IN_PROGRESS: { variant: 'info', label: 'En cours' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <PageHeader
          title="Activité de la plateforme"
          description="Historique complet de toutes les activités"
        />
      </div>

      <Card>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              Chargement...
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              Aucune activité pour le moment
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/admin/sessions/${activity.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="font-semibold text-sm">{activity.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Tuteur:</span> {activity.tutor}
                      </div>
                      <div>
                        <span className="font-medium">Étudiant:</span> {activity.student}
                      </div>
                      <div>
                        <span className="font-medium">Créée le:</span>{' '}
                        {new Date(activity.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div>
                        <span className="font-medium">Prévue le:</span>{' '}
                        {new Date(activity.scheduledDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && activities.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {pagination.page} sur {pagination.totalPages || 1} • {pagination.total} activité(s) au total
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= (pagination.totalPages || 1) || loading}
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

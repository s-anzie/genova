'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { SearchBar } from '@/components/layout/search-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { api } from '@/lib/api';

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchSessions();
  }, [statusFilter, timeFilter, page, itemsPerPage, searchQuery]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page,
        limit: itemsPerPage,
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      // Add date filter for upcoming/past
      const now = new Date().toISOString();
      if (timeFilter === 'upcoming') {
        params.startDate = now;
      } else if (timeFilter === 'past') {
        params.endDate = now;
      }

      const response: any = await api.get('/sessions', { params });
      setSessions(response.data || []);
      
      if (response.pagination) {
        setPagination(response.pagination);
      } else {
        // Fallback si pas de pagination du backend
        setPagination({
          page: page,
          limit: itemsPerPage,
          total: (response.data || []).length,
          totalPages: 1,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement');
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

  if (error) {
    return (
      <div>
        <PageHeader
          title="Gestion des sessions"
          description="Gérer toutes les sessions de tutorat"
        />
        <Alert variant="error" title="Erreur de chargement">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Gestion des sessions"
        description="Gérer toutes les sessions de tutorat"
      />

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchBar 
            placeholder="Rechercher une session..." 
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setPage(1);
            }}
          />
        </div>
        <select 
          className="h-11 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium"
          value={timeFilter}
          onChange={(e) => {
            setTimeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="upcoming">À venir</option>
          <option value="past">Passées</option>
          <option value="all">Toutes</option>
        </select>
        <select 
          className="h-11 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="CONFIRMED">Confirmée</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="COMPLETED">Terminée</option>
          <option value="CANCELLED">Annulée</option>
        </select>
        <select 
          className="h-11 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium"
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value="12">12 par page</option>
          <option value="24">24 par page</option>
          <option value="50">50 par page</option>
          <option value="100">100 par page</option>
        </select>
      </div>

      {/* Sessions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date & Heure
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Matière
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Étudiant
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tuteur
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Chargement...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Aucune session trouvée
                  </td>
                </tr>
              ) : (
                sessions.map((session: any) => {
                  const sessionDate = new Date(session.scheduledAt || session.date);
                  const dateStr = sessionDate.toLocaleDateString('fr-FR');
                  const timeStr = sessionDate.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });

                  return (
                    <tr 
                      key={session.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/sessions/${session.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-semibold text-sm">{dateStr}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeStr}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">
                          {session.subject?.name || session.subject || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {session.student ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {session.student.firstName} {session.student.lastName}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {session.tutor ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-secondary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {session.tutor.firstName} {session.tutor.lastName}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Non assigné</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(session.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/sessions/${session.id}`);
                          }}
                        >
                          Voir détails
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && sessions.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {pagination.page} sur {pagination.totalPages || 1} • {pagination.total} session(s) au total
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

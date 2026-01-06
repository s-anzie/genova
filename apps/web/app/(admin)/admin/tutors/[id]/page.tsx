'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  GraduationCap, 
  Mail, 
  Phone, 
  Calendar,
  BookOpen,
  Clock,
  Star,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Toast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface TutorDetails {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  profile?: {
    bio?: string;
    specialties?: string[];
    experience?: string;
  };
}

interface Session {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  student: {
    firstName: string;
    lastName: string;
  };
  status: string;
}

interface Stats {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  averageRating: number;
  totalStudents: number;
}

export default function TutorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tutorId = params.id as string;

  const [tutor, setTutor] = useState<TutorDetails | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    fetchTutorDetails();
  }, [tutorId]);

  const fetchTutorDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch tutor info
      const tutorRes = await api.get(`/users/${tutorId}`);
      setTutor(tutorRes.data);

      // TODO: Fetch stats and sessions when endpoints are ready
      // For now, using mock data
      setStats({
        totalSessions: 45,
        completedSessions: 38,
        upcomingSessions: 7,
        averageRating: 4.8,
        totalStudents: 12,
      });

      setUpcomingSessions([]);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="p-8">
        <Alert variant="error" title="Erreur">
          {error || 'Tuteur non trouvé'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {tutor.firstName} {tutor.lastName}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={tutor.isActive ? 'success' : 'outline'}>
                  {tutor.isActive ? 'Actif' : 'Inactif'}
                </Badge>
                <Badge variant={tutor.isVerified ? 'success' : 'warning'}>
                  {tutor.isVerified ? 'Vérifié' : 'Non vérifié'}
                </Badge>
                {stats && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{stats.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline">
            <Edit className="w-4 h-4" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tutor Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Info */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Informations de contact</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{tutor.email}</span>
                </div>
                {tutor.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{tutor.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Inscrit le {new Date(tutor.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Card */}
          {stats && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Statistiques</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Sessions totales</p>
                    <p className="text-2xl font-bold">{stats.totalSessions}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Complétées</p>
                      <p className="text-lg font-semibold text-green-600">{stats.completedSessions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">À venir</p>
                      <p className="text-lg font-semibold text-blue-600">{stats.upcomingSessions}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Étudiants</p>
                    <p className="text-xl font-semibold">{stats.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Note moyenne</p>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <p className="text-xl font-semibold">{stats.averageRating.toFixed(1)}/5</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Specialties */}
          {tutor.profile?.specialties && tutor.profile.specialties.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Spécialités</h2>
                <div className="flex flex-wrap gap-2">
                  {tutor.profile.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Sessions */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Sessions à venir</h2>
              
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucune session à venir</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div 
                      key={session.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/sessions/${session.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{session.subject}</span>
                          <Badge variant="outline" className="text-xs">
                            {session.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {new Date(session.date).toLocaleDateString('fr-FR')} • {session.startTime} - {session.endTime}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Étudiant: {session.student.firstName} {session.student.lastName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Bio */}
          {tutor.profile?.bio && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Biographie</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{tutor.profile.bio}</p>
              </div>
            </Card>
          )}

          {/* Experience */}
          {tutor.profile?.experience && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Expérience</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{tutor.profile.experience}</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

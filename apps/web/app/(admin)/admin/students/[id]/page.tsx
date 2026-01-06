'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  CreditCard,
  BookOpen,
  Clock,
  Plus,
  Edit,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface StudentDetails {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  profile?: {
    birthDate?: string;
    address?: string;
    city?: string;
    countryCode?: string;
    educationSystemId?: string;
    educationLevelId?: string;
    educationStreamId?: string;
  };
  country?: {
    name: string;
    code: string;
  };
  educationSystem?: {
    name: string;
    code: string;
  };
  educationLevel?: {
    name: string;
    code: string;
  };
  educationStream?: {
    name: string;
    code: string;
  };
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  sessionsRemaining: number;
  totalSessions: number;
}

interface Class {
  id: string;
  name: string;
  subject: string;
  level: string;
  schedule: string;
  status: string;
}

interface Session {
  id: string;
  date?: string;
  scheduledAt?: string;
  startTime?: string;
  endTime?: string;
  subject?: string | {
    name: string;
    code: string;
  };
  tutor?: {
    firstName: string;
    lastName: string;
  };
  status: string;
}

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStudentDetails();
  }, [studentId]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch student info
      const studentRes = await api.get(`/users/${studentId}`);
      setStudent(studentRes.data);

      // Fetch student's sessions (limit to upcoming only)
      try {
        const sessionsRes = await api.get('/sessions', {
          params: { 
            studentId: studentId,
            startDate: new Date().toISOString(),
            limit: 10,
          }
        });
        
        console.log('Sessions response:', sessionsRes);
        console.log('Sessions data:', sessionsRes.data);
        
        // Filter and sort upcoming sessions
        const now = new Date();
        const upcoming = (sessionsRes.data || [])
          .filter((session: any) => {
            const sessionDate = new Date(session.scheduledAt || session.scheduledStart || session.date);
            return sessionDate >= now && session.status !== 'CANCELLED' && session.status !== 'COMPLETED';
          })
          .sort((a: any, b: any) => {
            const dateA = new Date(a.scheduledAt || a.scheduledStart || a.date);
            const dateB = new Date(b.scheduledAt || b.scheduledStart || b.date);
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 5); // Show only next 5 sessions
        
        console.log('Upcoming sessions:', upcoming);
        setUpcomingSessions(upcoming);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setUpcomingSessions([]);
      }

      // Fetch student's classes
      try {
        const classesRes = await api.get(`/users/${studentId}/classes`);
        console.log('Classes response:', classesRes);
        console.log('Classes data:', classesRes.data);
        setClasses(classesRes.data || []);
      } catch (err) {
        setClasses([]);
      }

      // Fetch subscription (TODO: when endpoint is ready)
      setSubscription({
        id: '1',
        plan: 'Premium',
        status: 'ACTIVE',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        sessionsRemaining: 15,
        totalSessions: 20,
      });
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSessions = async () => {
    try {
      setToast({ message: 'Génération des sessions en cours...', type: 'info' });
      
      // Call the backend endpoint to generate sessions
      const response = await api.post(`/users/${studentId}/generate-sessions`, {
        weeksAhead: 4, // Generate for 4 weeks ahead
      });
      
      const { sessionsGenerated, classesProcessed } = response.data;
      
      if (sessionsGenerated === 0) {
        setToast({ 
          message: 'Aucune nouvelle session à générer. Les sessions existent déjà ou aucune classe n\'est assignée.', 
          type: 'info' 
        });
      } else {
        setToast({ 
          message: `${sessionsGenerated} session(s) générée(s) pour ${classesProcessed} classe(s)`, 
          type: 'success' 
        });
      }
      
      fetchStudentDetails();
    } catch (err: any) {
      setToast({ message: err?.message || 'Erreur lors de la génération', type: 'error' });
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      // TODO: Fetch classes that match student's education level
      const res = await api.get('/classes', {
        params: {
          educationLevelId: student?.profile?.educationLevelId,
        },
      });
      setAvailableClasses(res.data || []);
    } catch (err: any) {
      setToast({ message: 'Erreur lors du chargement des classes', type: 'error' });
    }
  };

  const handleAddToClass = async () => {
    if (!selectedClassId) return;
    
    setIsSubmitting(true);
    try {
      // TODO: Add student to class endpoint
      await api.post(`/classes/${selectedClassId}/students`, {
        studentId: studentId,
      });
      
      setToast({ message: 'Étudiant ajouté à la classe avec succès', type: 'success' });
      setIsAddClassModalOpen(false);
      fetchStudentDetails();
    } catch (err: any) {
      setToast({ message: err?.message || 'Erreur lors de l\'ajout', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddClassModal = () => {
    fetchAvailableClasses();
    setSelectedClassId('');
    setIsAddClassModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-8">
        <Alert variant="error" title="Erreur">
          {error || 'Étudiant non trouvé'}
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
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {student.firstName} {student.lastName}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant={student.isActive ? 'success' : 'outline'}>
                  {student.isActive ? 'Actif' : 'Inactif'}
                </Badge>
                <Badge variant={student.isVerified ? 'success' : 'warning'}>
                  {student.isVerified ? 'Vérifié' : 'Non vérifié'}
                </Badge>
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
        {/* Left Column - Student Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Info */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Informations de contact</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{student.email}</span>
                </div>
                {student.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{student.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Inscrit le {new Date(student.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Education Info */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Informations scolaires</h2>
              <div className="space-y-3">
                {student.country && (
                  <div>
                    <p className="text-xs text-gray-600">Pays</p>
                    <p className="font-semibold">{student.country.name}</p>
                  </div>
                )}
                {student.educationSystem && (
                  <div>
                    <p className="text-xs text-gray-600">Système éducatif</p>
                    <p className="font-semibold">{student.educationSystem.name}</p>
                  </div>
                )}
                {student.educationLevel && (
                  <div>
                    <p className="text-xs text-gray-600">Niveau</p>
                    <p className="font-semibold">{student.educationLevel.name}</p>
                  </div>
                )}
                {student.educationStream && (
                  <div>
                    <p className="text-xs text-gray-600">Filière</p>
                    <p className="font-semibold">{student.educationStream.name}</p>
                  </div>
                )}
                {!student.educationSystem && !student.educationLevel && (
                  <p className="text-sm text-gray-500 italic">
                    Informations scolaires non renseignées
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Subscription Card */}
          {subscription && (
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Abonnement</h2>
                  <Badge variant={subscription.status === 'ACTIVE' ? 'success' : 'outline'}>
                    {subscription.status}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Plan</p>
                    <p className="font-semibold">{subscription.plan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Sessions restantes</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(subscription.sessionsRemaining / subscription.totalSessions) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold">
                        {subscription.sessionsRemaining}/{subscription.totalSessions}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Période</p>
                    <p className="text-sm">
                      {new Date(subscription.startDate).toLocaleDateString('fr-FR')} - {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Classes & Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Sessions */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Sessions à venir</h2>
                <Button size="sm" onClick={handleGenerateSessions}>
                  <Plus className="w-4 h-4" />
                  Générer sessions
                </Button>
              </div>
              
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucune session à venir</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={handleGenerateSessions}>
                    Générer les premières sessions
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => {
                    const sessionDate = new Date(session.date || session.scheduledAt || new Date());
                    const dateStr = sessionDate.toLocaleDateString('fr-FR');
                    const subjectName = typeof session.subject === 'string' 
                      ? session.subject 
                      : session.subject?.name || 'Session';
                    
                    return (
                      <div 
                        key={session.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/admin/sessions/${session.id}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{subjectName}</span>
                            <Badge variant="outline" className="text-xs">
                              {session.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {dateStr} • {session.startTime || 'Horaire à définir'}
                            {session.endTime && ` - ${session.endTime}`}
                          </p>
                          {session.tutor && (
                            <p className="text-xs text-gray-500 mt-1">
                              Tuteur: {session.tutor.firstName} {session.tutor.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Classes */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Classes</h2>
                <Button size="sm" variant="outline" onClick={openAddClassModal}>
                  <Plus className="w-4 h-4" />
                  Ajouter à une classe
                </Button>
              </div>
              
              {classes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Aucune classe assignée</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={openAddClassModal}>
                    Ajouter à une classe
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes.map((cls) => (
                    <div 
                      key={cls.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/classes/${cls.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{cls.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {cls.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{cls.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">{cls.level}</p>
                      <p className="text-xs text-gray-500">{cls.schedule}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Add to Class Modal */}
      <Modal
        isOpen={isAddClassModalOpen}
        onClose={() => setIsAddClassModalOpen(false)}
        title="Ajouter à une classe"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Sélectionnez une classe pour cet étudiant
          </p>
          
          {availableClasses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Aucune classe disponible</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableClasses.map((cls) => (
                <div
                  key={cls.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedClassId === cls.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedClassId(cls.id)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold">{cls.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {cls.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{cls.subject}</p>
                  <p className="text-xs text-gray-500">{cls.level}</p>
                  <p className="text-xs text-gray-500">{cls.schedule}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddClassModalOpen(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddToClass}
              disabled={!selectedClassId || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Ajout...' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>

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

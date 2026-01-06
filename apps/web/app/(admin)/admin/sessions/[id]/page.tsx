'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  User,
  BookOpen,
  Edit,
  X,
  Check,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Toast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface SessionDetails {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  subject: {
    name: string;
    code: string;
  };
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tutor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  class?: {
    id: string;
    name: string;
  };
  notes?: string;
  createdAt: string;
}

interface Tutor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function SessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionDetails | null>(null);
  const [availableTutors, setAvailableTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [isAssignTutorModalOpen, setIsAssignTutorModalOpen] = useState(false);
  const [isChangeTutorModalOpen, setIsChangeTutorModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRevalidateDialogOpen, setIsRevalidateDialogOpen] = useState(false);
  const [selectedTutorId, setSelectedTutorId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/sessions/${sessionId}`);
      setSession(res.data);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement de la session');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTutors = async () => {
    try {
      // TODO: Fetch tutors available for this session time slot
      const res = await api.get('/users', { params: { role: 'TUTOR', isActive: 'true' } });
      setAvailableTutors(res.data || []);
    } catch (err: any) {
      setToast({ message: 'Erreur lors du chargement des tuteurs', type: 'error' });
    }
  };

  const handleAssignTutor = async () => {
    if (!selectedTutorId) return;
    
    setIsSubmitting(true);
    try {
      await api.put(`/sessions/${sessionId}`, {
        tutorId: selectedTutorId,
        status: 'CONFIRMED',
      });
      setToast({ message: 'Tuteur assigné avec succès', type: 'success' });
      setIsAssignTutorModalOpen(false);
      fetchSessionDetails();
    } catch (err: any) {
      setToast({ message: err?.message || 'Erreur lors de l\'assignation', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeTutor = async () => {
    if (!selectedTutorId) return;
    
    setIsSubmitting(true);
    try {
      await api.put(`/sessions/${sessionId}`, {
        tutorId: selectedTutorId,
      });
      setToast({ message: 'Tuteur changé avec succès', type: 'success' });
      setIsChangeTutorModalOpen(false);
      fetchSessionDetails();
    } catch (err: any) {
      setToast({ message: err?.message || 'Erreur lors du changement', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSession = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/sessions/${sessionId}/cancel`, {
        reason: 'Annulée par l\'administrateur',
      });
      setToast({ message: 'Session annulée avec succès', type: 'success' });
      setIsCancelDialogOpen(false);
      fetchSessionDetails();
    } catch (err: any) {
      setToast({ message: err?.message || 'Erreur lors de l\'annulation', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevalidateSession = async () => {
    setIsSubmitting(true);
    try {
      await api.put(`/sessions/${sessionId}/status`, {
        status: 'CONFIRMED',
      });
      setToast({ message: 'Session revalidée avec succès', type: 'success' });
      setIsRevalidateDialogOpen(false);
      fetchSessionDetails();
    } catch (err: any) {
      setToast({ message: err?.message || 'Erreur lors de la revalidation', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAssignTutorModal = () => {
    fetchAvailableTutors();
    setSelectedTutorId('');
    setIsAssignTutorModalOpen(true);
  };

  const openChangeTutorModal = () => {
    fetchAvailableTutors();
    setSelectedTutorId(session?.tutor?.id || '');
    setIsChangeTutorModalOpen(true);
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-8">
        <Alert variant="error" title="Erreur">
          {error || 'Session non trouvée'}
        </Alert>
      </div>
    );
  }

  const canAssignTutor = session.status === 'PENDING' && !session.tutor;
  const canChangeTutor = session.status !== 'COMPLETED' && session.status !== 'CANCELLED';
  const canCancel = session.status !== 'COMPLETED' && session.status !== 'CANCELLED';
  const canRevalidate = session.status === 'CANCELLED';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Session de {session.subject.name}
            </h1>
            <div className="flex items-center gap-3">
              {getStatusBadge(session.status)}
              <span className="text-sm text-gray-600">
                Créée le {new Date(session.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {canAssignTutor && (
              <Button onClick={openAssignTutorModal}>
                <UserPlus className="w-4 h-4" />
                Assigner un tuteur
              </Button>
            )}
            {canChangeTutor && session.tutor && (
              <Button variant="outline" onClick={openChangeTutorModal}>
                <RefreshCw className="w-4 h-4" />
                Changer de tuteur
              </Button>
            )}
            {canRevalidate && (
              <Button variant="outline" onClick={() => setIsRevalidateDialogOpen(true)}>
                <Check className="w-4 h-4" />
                Revalider
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(true)}>
                <X className="w-4 h-4" />
                Annuler
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Session Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date & Time */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Date et horaire</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold">{new Date(session.date).toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Horaire</p>
                    <p className="font-semibold">{session.startTime} - {session.endTime}</p>
                    <p className="text-xs text-gray-500">{session.duration} minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Subject & Class */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Matière et classe</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Matière</p>
                    <p className="font-semibold">{session.subject.name}</p>
                    <p className="text-xs text-gray-500">Code: {session.subject.code}</p>
                  </div>
                </div>
                {session.class && (
                  <div 
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => router.push(`/admin/classes/${session.class!.id}`)}
                  >
                    <p className="text-sm text-gray-600">Classe</p>
                    <p className="font-semibold">{session.class.name}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Notes */}
          {session.notes && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{session.notes}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Participants */}
        <div className="lg:col-span-1 space-y-6">
          {/* Student */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Étudiant</h2>
              {session.student ? (
                <div 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => router.push(`/admin/students/${session.student!.id}`)}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{session.student.firstName} {session.student.lastName}</p>
                    <p className="text-xs text-gray-600">{session.student.email}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Aucun étudiant associé</p>
                </div>
              )}
            </div>
          </Card>

          {/* Tutor */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Tuteur</h2>
              {session.tutor ? (
                <div 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => router.push(`/admin/tutors/${session.tutor!.id}`)}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{session.tutor.firstName} {session.tutor.lastName}</p>
                    <p className="text-xs text-gray-600">{session.tutor.email}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">Aucun tuteur assigné</p>
                  {canAssignTutor && (
                    <Button size="sm" onClick={openAssignTutorModal}>
                      <UserPlus className="w-4 h-4" />
                      Assigner un tuteur
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Assign Tutor Modal */}
      <Modal
        isOpen={isAssignTutorModalOpen}
        onClose={() => setIsAssignTutorModalOpen(false)}
        title="Assigner un tuteur"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Sélectionnez un tuteur disponible pour cette session
          </p>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableTutors.map((tutor) => (
              <div
                key={tutor.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedTutorId === tutor.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTutorId(tutor.id)}
              >
                <p className="font-semibold">{tutor.firstName} {tutor.lastName}</p>
                <p className="text-xs text-gray-600">{tutor.email}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignTutorModalOpen(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssignTutor}
              disabled={!selectedTutorId || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Assignation...' : 'Assigner'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Tutor Modal */}
      <Modal
        isOpen={isChangeTutorModalOpen}
        onClose={() => setIsChangeTutorModalOpen(false)}
        title="Changer de tuteur"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Sélectionnez un nouveau tuteur pour cette session
          </p>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableTutors.map((tutor) => (
              <div
                key={tutor.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedTutorId === tutor.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTutorId(tutor.id)}
              >
                <p className="font-semibold">{tutor.firstName} {tutor.lastName}</p>
                <p className="text-xs text-gray-600">{tutor.email}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsChangeTutorModalOpen(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleChangeTutor}
              disabled={!selectedTutorId || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Changement...' : 'Changer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Dialog */}
      <ConfirmDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={handleCancelSession}
        title="Annuler la session"
        message="Êtes-vous sûr de vouloir annuler cette session ? Cette action peut entraîner un remboursement."
        confirmText="Annuler la session"
        isLoading={isSubmitting}
      />

      {/* Revalidate Dialog */}
      <ConfirmDialog
        isOpen={isRevalidateDialogOpen}
        onClose={() => setIsRevalidateDialogOpen(false)}
        onConfirm={handleRevalidateSession}
        title="Revalider la session"
        message="Êtes-vous sûr de vouloir revalider cette session annulée ?"
        confirmText="Revalider"
        isLoading={isSubmitting}
      />

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

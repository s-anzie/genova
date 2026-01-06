'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { SearchBar } from '@/components/layout/search-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { useTutors } from '@/hooks/useTutors';
import { api } from '@/lib/api';

interface Tutor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export default function TutorsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const { tutors, loading, error, pagination, refetch } = useTutors({ 
    search: searchQuery || undefined,
    page, 
    limit: itemsPerPage 
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    countryCode: 'CM',
    isActive: true,
    isVerified: false,
  });

  const handleAdd = () => {
    setSelectedTutor(null);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      countryCode: 'CM',
      isActive: true,
      isVerified: false,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setFormData({
      email: tutor.email,
      password: '',
      firstName: tutor.firstName,
      lastName: tutor.lastName,
      phone: tutor.phone || '',
      countryCode: 'CM',
      isActive: tutor.isActive,
      isVerified: tutor.isVerified,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedTutor) {
        await api.put(`/users/${selectedTutor.id}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: 'TUTOR',
          isActive: formData.isActive,
          isVerified: formData.isVerified,
          countryCode: formData.countryCode,
        });
        setToast({ message: 'Tuteur modifié avec succès', type: 'success' });
      } else {
        await api.post('/users', {
          ...formData,
          role: 'TUTOR',
        });
        setToast({ message: 'Tuteur créé avec succès', type: 'success' });
      }
      await refetch();
      setIsModalOpen(false);
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Une erreur est survenue');
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedTutor) return;
    setIsSubmitting(true);

    try {
      await api.delete(`/users/${selectedTutor.id}`);
      await refetch();
      setIsDeleteDialogOpen(false);
      setToast({ message: 'Tuteur supprimé avec succès', type: 'success' });
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Une erreur est survenue');
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div>
        <PageHeader
          title="Gestion des tuteurs"
          description="Gérer les tuteurs de la plateforme"
        />
        <Alert variant="error" title="Erreur de chargement">
          {error.message}
          {error.status && <span className="block mt-1 text-xs">Code: {error.status}</span>}
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Gestion des tuteurs"
        description="Gérer les tuteurs de la plateforme"
        action={
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            Ajouter un tuteur
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchBar 
            placeholder="Rechercher un tuteur..." 
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setPage(1);
            }}
          />
        </div>
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

      {/* Tutors Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : tutors.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun tuteur trouvé</h3>
            <p className="text-gray-500 mb-4">Commencez par ajouter votre premier tuteur</p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4" />
              Ajouter un tuteur
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutors.map((tutor: any) => (
            <Card key={tutor.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="font-bold text-lg hover:text-primary cursor-pointer transition-colors"
                      onClick={() => router.push(`/admin/tutors/${tutor.id}`)}
                    >
                      {tutor.firstName} {tutor.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{tutor.email}</p>
                  </div>
                  <Badge variant={tutor.isActive ? 'success' : 'outline'}>
                    {tutor.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    Inscrit le {new Date(tutor.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                  {!tutor.isVerified && (
                    <Badge variant="warning" className="text-xs">Non vérifié</Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(tutor); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(tutor); }}>
                    <Trash2 className="w-4 h-4 text-error" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && tutors.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {pagination.page} sur {pagination.totalPages || 1} • {pagination.total} tuteur(s) au total
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

      {/* Modal Ajout/Modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTutor ? 'Modifier le tuteur' : 'Ajouter un tuteur'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Jean"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Dupont"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jean.dupont@example.com"
              required
              disabled={!!selectedTutor}
            />
          </div>

          {!selectedTutor && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required={!selectedTutor}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+237 6XX XXX XXX"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 text-primary rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Compte actif
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVerified"
                checked={formData.isVerified}
                onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                className="w-5 h-5 text-primary rounded"
              />
              <label htmlFor="isVerified" className="text-sm font-medium text-gray-700">
                Email vérifié
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer le tuteur"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedTutor?.firstName} ${selectedTutor?.lastName}" ? Cette action désactivera le compte.`}
        confirmText="Supprimer"
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

'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, UserCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { useStudents } from '@/hooks/useStudents';
import { api } from '@/lib/api';

interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const { students, loading, error, pagination, refetch } = useStudents({ 
    search: searchQuery || undefined,
    page, 
    limit: itemsPerPage 
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
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
    setSelectedStudent(null);
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

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      email: student.email,
      password: '',
      firstName: student.firstName,
      lastName: student.lastName,
      phone: student.phone || '',
      countryCode: 'CM',
      isActive: student.isActive,
      isVerified: student.isVerified,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedStudent) {
        await api.put(`/users/${selectedStudent.id}`, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: 'STUDENT',
          isActive: formData.isActive,
          isVerified: formData.isVerified,
          countryCode: formData.countryCode,
        });
        setToast({ message: 'Étudiant modifié avec succès', type: 'success' });
      } else {
        await api.post('/users', {
          ...formData,
          role: 'STUDENT',
        });
        setToast({ message: 'Étudiant créé avec succès', type: 'success' });
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
    if (!selectedStudent) return;
    setIsSubmitting(true);

    try {
      await api.delete(`/users/${selectedStudent.id}`);
      await refetch();
      setIsDeleteDialogOpen(false);
      setToast({ message: 'Étudiant supprimé avec succès', type: 'success' });
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
          title="Gestion des étudiants"
          description="Gérer les étudiants de la plateforme"
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
        title="Gestion des étudiants"
        description="Gérer les étudiants de la plateforme"
        action={
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            Ajouter un étudiant
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchBar 
            placeholder="Rechercher un étudiant..." 
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

      {/* Students Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date d'inscription
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
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Aucun étudiant trouvé
                  </td>
                </tr>
              ) : (
                students.map((student: any) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div 
                            className="font-semibold hover:text-primary cursor-pointer transition-colors"
                            onClick={() => router.push(`/admin/students/${student.id}`)}
                          >
                            {student.firstName} {student.lastName}
                          </div>
                          {!student.isVerified && (
                            <span className="text-xs text-warning">Non vérifié</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{student.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={student.isActive ? 'success' : 'outline'}>
                        {student.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(student.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(student)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(student)}>
                          <Trash2 className="w-4 h-4 text-error" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && students.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {pagination.page} sur {pagination.totalPages || 1} • {pagination.total} étudiant(s) au total
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

      {/* Modal Ajout/Modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedStudent ? 'Modifier l\'étudiant' : 'Ajouter un étudiant'}
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
              disabled={!!selectedStudent}
            />
          </div>

          {!selectedStudent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required={!selectedStudent}
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
        title="Supprimer l'étudiant"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedStudent?.firstName} ${selectedStudent?.lastName}" ? Cette action désactivera le compte.`}
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

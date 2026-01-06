'use client';

import { Plus, Edit, Trash2, BookMarked } from 'lucide-react';
import { SearchBar } from '@/components/layout/search-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { useSubjects, Subject } from '@/hooks/useEducation';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function SubjectsTab() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { subjects, loading, error, refetch } = useSubjects(selectedCategory || undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameEn: '',
    category: 'CORE',
    color: '#0d7377',
  });

  const categories = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'CORE', label: 'Matières principales' },
    { value: 'SCIENCE', label: 'Sciences' },
    { value: 'LANGUAGE', label: 'Langues' },
    { value: 'ARTS', label: 'Arts' },
    { value: 'TECHNICAL', label: 'Techniques' },
  ];

  const handleAdd = () => {
    setSelectedSubject(null);
    setFormData({ code: '', name: '', nameEn: '', category: selectedCategory || 'CORE', color: '#0d7377' });
    setIsModalOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormData({
      code: subject.code,
      name: subject.name,
      nameEn: subject.nameEn || '',
      category: subject.category,
      color: subject.color || '#0d7377',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedSubject) {
        await api.put(`/education/subjects/${selectedSubject.id}`, formData);
        setToast({ message: 'Matière modifiée avec succès', type: 'success' });
      } else {
        await api.post('/education/subjects', formData);
        setToast({ message: 'Matière créée avec succès', type: 'success' });
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
    if (!selectedSubject) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/education/subjects/${selectedSubject.id}`);
      await refetch();
      setIsDeleteDialogOpen(false);
      setToast({ message: 'Matière supprimée avec succès', type: 'success' });
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Une erreur est survenue');
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <Alert variant="error" title="Erreur de chargement">
        {error.message}
        {error.status && <span className="block mt-1 text-xs">Code: {error.status}</span>}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Gérer les matières disponibles pour les sessions de tutorat
        </p>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          Ajouter une matière
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <SearchBar placeholder="Rechercher une matière..." />
        </div>
        <select 
          className="h-11 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucune matière trouvée</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <Card key={subject.id} className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: subject.color || '#0d7377' }}
                    >
                      <BookMarked className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{subject.name}</h4>
                      {subject.nameEn && (
                        <p className="text-xs text-gray-500 truncate">{subject.nameEn}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs ml-2">
                    {subject.category}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleEdit(subject)}>
                    <Edit className="w-4 h-4" />
                    Modifier
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedSubject(subject); setIsDeleteDialogOpen(true); }}>
                    <Trash2 className="w-4 h-4 text-error" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedSubject ? 'Modifier la matière' : 'Ajouter une matière'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="MATH"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom (FR) *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Mathématiques"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom (EN)</label>
            <Input
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              placeholder="Mathematics"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
            <select
              className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              {categories.filter(c => c.value).map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-20 h-11"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#0d7377"
                className="flex-1"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Supprimer la matière"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedSubject?.name}" ? Cette action est irréversible.`}
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

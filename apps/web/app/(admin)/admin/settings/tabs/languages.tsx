'use client';

import { Plus, Edit, Trash2, Languages as LanguagesIcon } from 'lucide-react';
import { SearchBar } from '@/components/layout/search-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { useLanguages, TeachingLanguage } from '@/hooks/useEducation';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function LanguagesTab() {
  const { languages, loading, error, refetch } = useLanguages();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<TeachingLanguage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nativeName: '',
  });

  const handleAdd = () => {
    setSelectedLanguage(null);
    setFormData({ code: '', name: '', nativeName: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (language: TeachingLanguage) => {
    setSelectedLanguage(language);
    setFormData({
      code: language.code,
      name: language.name,
      nativeName: language.nativeName || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedLanguage) {
        await api.put(`/education/languages/${selectedLanguage.id}`, formData);
        setToast({ message: 'Langue modifiée avec succès', type: 'success' });
      } else {
        await api.post('/education/languages', formData);
        setToast({ message: 'Langue créée avec succès', type: 'success' });
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
    if (!selectedLanguage) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/education/languages/${selectedLanguage.id}`);
      await refetch();
      setIsDeleteDialogOpen(false);
      setToast({ message: 'Langue supprimée avec succès', type: 'success' });
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
          Gérer les langues d'enseignement disponibles sur la plateforme
        </p>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          Ajouter une langue
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <SearchBar placeholder="Rechercher une langue..." />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : languages.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucune langue trouvée</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {languages.map((language) => (
            <Card key={language.id} className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <LanguagesIcon className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{language.name}</h4>
                      {language.nativeName && (
                        <p className="text-xs text-gray-500 truncate">{language.nativeName}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-xs text-gray-500 ml-2">{language.code}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleEdit(language)}>
                    <Edit className="w-4 h-4" />
                    Modifier
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedLanguage(language); setIsDeleteDialogOpen(true); }}>
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
        title={selectedLanguage ? 'Modifier la langue' : 'Ajouter une langue'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code (ISO 639-1) *</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
              placeholder="fr"
              maxLength={2}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Français"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom natif</label>
            <Input
              value={formData.nativeName}
              onChange={(e) => setFormData({ ...formData, nativeName: e.target.value })}
              placeholder="Français"
            />
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
        title="Supprimer la langue"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedLanguage?.name}" ? Cette action est irréversible.`}
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

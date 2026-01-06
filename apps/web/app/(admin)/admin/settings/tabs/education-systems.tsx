'use client';

import { Plus, Edit, Trash2, GraduationCap, Layers, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { useEducationSystems, useEducationLevels, useStreams, EducationSystem, EducationLevel, EducationStream } from '@/hooks/useEducation';
import { useCountries } from '@/hooks/useCountries';
import { useState } from 'react';
import { api } from '@/lib/api';

type ModalType = 'system' | 'level' | 'stream' | null;

export default function EducationSystemsTab() {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedSystem, setSelectedSystem] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  
  const { countries } = useCountries();
  const { systems, loading: loadingSystems, error: errorSystems, refetch: refetchSystems } = useEducationSystems(selectedCountry || undefined);
  const { levels, loading: loadingLevels, fetchLevels } = useEducationLevels(selectedSystem);
  const { streams, loading: loadingStreams, fetchStreams } = useStreams(selectedLevel);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [deleteType, setDeleteType] = useState<ModalType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // États pour les formulaires
  const [systemForm, setSystemForm] = useState({ code: '', name: '', countryId: '', sortOrder: 1, isActive: true });
  const [levelForm, setLevelForm] = useState({ code: '', name: '', category: 'PRIMARY', order: 1, hasStreams: false });
  const [streamForm, setStreamForm] = useState({ code: '', name: '', description: '' });

  const [editingItem, setEditingItem] = useState<any>(null);

  // Handlers pour Systèmes
  const handleAddSystem = () => {
    setEditingItem(null);
    setSystemForm({ code: '', name: '', countryId: '', sortOrder: 1, isActive: true });
    setModalType('system');
  };

  const handleEditSystem = (system: EducationSystem) => {
    setEditingItem(system);
    setSystemForm({
      code: system.code,
      name: system.name,
      countryId: system.countryId,
      sortOrder: system.sortOrder,
      isActive: system.isActive,
    });
    setModalType('system');
  };

  const handleSubmitSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/education/systems/${editingItem.id}`, systemForm);
        setToast({ message: 'Système éducatif modifié avec succès', type: 'success' });
      } else {
        await api.post('/education/systems', systemForm);
        setToast({ message: 'Système éducatif créé avec succès', type: 'success' });
      }
      await refetchSystems();
      setModalType(null);
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Une erreur est survenue');
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSystem = async () => {
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/education/systems/${editingItem.id}`);
      await refetchSystems();
      setDeleteType(null);
      setToast({ message: 'Système éducatif supprimé avec succès', type: 'success' });
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Une erreur est survenue');
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers pour Niveaux
  const handleAddLevel = () => {
    if (!selectedSystem) {
      setToast({ message: 'Veuillez sélectionner un système éducatif', type: 'info' });
      return;
    }
    setEditingItem(null);
    setLevelForm({ code: '', name: '', category: 'PRIMARY', order: 1, hasStreams: false });
    setModalType('level');
  };

  const handleEditLevel = (level: EducationLevel) => {
    setEditingItem(level);
    setLevelForm({
      code: level.code,
      name: level.name,
      category: level.category,
      order: level.order,
      hasStreams: level.hasStreams,
    });
    setModalType('level');
  };

  const handleSubmitLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/education/levels/${editingItem.id}`, levelForm);
        setToast({ message: 'Niveau modifié avec succès', type: 'success' });
      } else {
        await api.post(`/education/systems/${selectedSystem}/levels`, levelForm);
        setToast({ message: 'Niveau créé avec succès', type: 'success' });
      }
      await fetchLevels(selectedSystem);
      setModalType(null);
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Une erreur est survenue');
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLevel = async () => {
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/education/levels/${editingItem.id}`);
      await fetchLevels(selectedSystem);
      setDeleteType(null);
      setToast({ message: 'Niveau supprimé avec succès', type: 'success' });
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Une erreur est survenue');
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handlers pour Filières
  const handleAddStream = () => {
    if (!selectedLevel) {
      setToast({ message: 'Veuillez sélectionner un niveau', type: 'info' });
      return;
    }
    setEditingItem(null);
    setStreamForm({ code: '', name: '', description: '' });
    setModalType('stream');
  };

  const handleEditStream = (stream: EducationStream) => {
    setEditingItem(stream);
    setStreamForm({
      code: stream.code,
      name: stream.name,
      description: stream.description || '',
    });
    setModalType('stream');
  };

  const handleSubmitStream = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/education/streams/${editingItem.id}`, streamForm);
        setToast({ message: 'Filière modifiée avec succès', type: 'success' });
      } else {
        await api.post(`/education/levels/${selectedLevel}/streams`, streamForm);
        setToast({ message: 'Filière créée avec succès', type: 'success' });
      }
      await fetchStreams(selectedLevel);
      setModalType(null);
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Une erreur est survenue');
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStream = async () => {
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/education/streams/${editingItem.id}`);
      await fetchStreams(selectedLevel);
      setDeleteType(null);
      setToast({ message: 'Filière supprimée avec succès', type: 'success' });
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Une erreur est survenue');
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (errorSystems) {
    return (
      <Alert variant="error" title="Erreur de chargement">
        {errorSystems.message}
        {errorSystems.status && <span className="block mt-1 text-xs">Code: {errorSystems.status}</span>}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Gérer les systèmes éducatifs, niveaux et filières pour l'onboarding
        </p>
        <div className="flex gap-2">
          <select 
            className="h-11 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            <option value="">Tous les pays</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>{country.name}</option>
            ))}
          </select>
          <Button onClick={handleAddSystem}>
            <Plus className="w-4 h-4" />
            Ajouter un système
          </Button>
        </div>
      </div>

      {/* Systèmes éducatifs */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Systèmes éducatifs</h3>
        {loadingSystems ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : systems.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Aucun système trouvé</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systems.map((system) => (
              <Card 
                key={system.id} 
                className={`hover:shadow-md transition-all cursor-pointer ${selectedSystem === system.id ? 'ring-2 ring-primary shadow-lg' : ''}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base leading-tight mb-1">{system.name}</h4>
                      <p className="text-xs text-gray-600">{system.country.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Code: {system.code}</p>
                    </div>
                    <Badge variant={system.isActive ? 'success' : 'outline'} className="text-xs flex-shrink-0">
                      {system.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSystem(system);
                      }}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(system);
                        setDeleteType('system');
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-error" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => {
                        setSelectedSystem(system.id);
                        fetchLevels(system.id);
                        setSelectedLevel('');
                      }}
                    >
                      Voir niveaux
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Niveaux */}
      {selectedSystem && (
        <div className="pt-6 border-t-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Niveaux</h3>
              <p className="text-xs text-gray-500 mt-1">
                Cliquez sur un niveau pour voir ses filières
              </p>
            </div>
            <Button size="sm" onClick={handleAddLevel}>
              <Plus className="w-4 h-4" />
              Ajouter un niveau
            </Button>
          </div>
          {loadingLevels ? (
            <div className="text-center py-8 text-gray-400">Chargement...</div>
          ) : levels.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Layers className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Aucun niveau trouvé</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={handleAddLevel}>
                Ajouter le premier niveau
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {levels.map((level) => (
                <Card 
                  key={level.id}
                  className={`hover:shadow-md transition-all cursor-pointer ${selectedLevel === level.id ? 'ring-2 ring-primary shadow-lg' : ''}`}
                >
                  <div className="p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <Layers className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm block leading-tight">{level.name}</span>
                        <div className="text-xs text-gray-500 mt-1">
                          {level.category} • Ordre: {level.order}
                        </div>
                      </div>
                    </div>
                    {level.hasStreams && (
                      <Badge variant="outline" className="text-xs mb-2">
                        Avec filières
                      </Badge>
                    )}
                    <div className="flex gap-1 pt-2 border-t border-gray-100">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditLevel(level);
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(level);
                          setDeleteType('level');
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-error" />
                      </Button>
                      {level.hasStreams && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1 text-xs h-7"
                          onClick={() => {
                            setSelectedLevel(level.id);
                            fetchStreams(level.id);
                          }}
                        >
                          Filières
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filières */}
      {selectedLevel && (
        <div className="pt-6 border-t-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filières</h3>
            <Button size="sm" onClick={handleAddStream}>
              <Plus className="w-4 h-4" />
              Ajouter une filière
            </Button>
          </div>
          {loadingStreams ? (
            <div className="text-center py-8 text-gray-400">Chargement...</div>
          ) : streams.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Aucune filière trouvée</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={handleAddStream}>
                Ajouter la première filière
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {streams.map((stream) => (
                <Card key={stream.id} className="hover:shadow-md transition-shadow">
                  <div className="p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <FileText className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm block leading-tight">{stream.name}</span>
                        <span className="text-xs text-gray-500 block mt-0.5">Code: {stream.code}</span>
                      </div>
                    </div>
                    {stream.description && (
                      <p className="text-xs text-gray-500 mt-2 mb-2 line-clamp-2">{stream.description}</p>
                    )}
                    <div className="flex gap-1 pt-2 border-t border-gray-100">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 text-xs h-7"
                        onClick={() => handleEditStream(stream)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Modifier
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => {
                          setEditingItem(stream);
                          setDeleteType('stream');
                        }}
                      >
                        <Trash2 className="w-3 h-3 text-error" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Système */}
      <Modal
        isOpen={modalType === 'system'}
        onClose={() => setModalType(null)}
        title={editingItem ? 'Modifier le système' : 'Ajouter un système'}
      >
        <form onSubmit={handleSubmitSystem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
            <Input
              value={systemForm.code}
              onChange={(e) => setSystemForm({ ...systemForm, code: e.target.value.toUpperCase() })}
              placeholder="FR_CM"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
            <Input
              value={systemForm.name}
              onChange={(e) => setSystemForm({ ...systemForm, name: e.target.value })}
              placeholder="Système Francophone"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pays *</label>
            <select
              className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm"
              value={systemForm.countryId}
              onChange={(e) => setSystemForm({ ...systemForm, countryId: e.target.value })}
              required
            >
              <option value="">Sélectionner un pays</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>{country.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ordre d'affichage *</label>
            <Input
              type="number"
              value={systemForm.sortOrder}
              onChange={(e) => setSystemForm({ ...systemForm, sortOrder: parseInt(e.target.value) })}
              min="1"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="systemActive"
              checked={systemForm.isActive}
              onChange={(e) => setSystemForm({ ...systemForm, isActive: e.target.checked })}
              className="w-5 h-5 text-primary rounded"
            />
            <label htmlFor="systemActive" className="text-sm font-medium text-gray-700">
              Système actif
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalType(null)} disabled={isSubmitting} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Niveau */}
      <Modal
        isOpen={modalType === 'level'}
        onClose={() => setModalType(null)}
        title={editingItem ? 'Modifier le niveau' : 'Ajouter un niveau'}
      >
        <form onSubmit={handleSubmitLevel} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
            <Input
              value={levelForm.code}
              onChange={(e) => setLevelForm({ ...levelForm, code: e.target.value.toUpperCase() })}
              placeholder="6EME"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
            <Input
              value={levelForm.name}
              onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
              placeholder="Sixième"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
            <select
              className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm"
              value={levelForm.category}
              onChange={(e) => setLevelForm({ ...levelForm, category: e.target.value })}
              required
            >
              <option value="PRIMARY">Primaire</option>
              <option value="SECONDARY">Secondaire</option>
              <option value="HIGH_SCHOOL">Lycée</option>
              <option value="UNIVERSITY">Université</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ordre *</label>
            <Input
              type="number"
              value={levelForm.order}
              onChange={(e) => setLevelForm({ ...levelForm, order: parseInt(e.target.value) })}
              min="1"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasStreams"
              checked={levelForm.hasStreams}
              onChange={(e) => setLevelForm({ ...levelForm, hasStreams: e.target.checked })}
              className="w-5 h-5 text-primary rounded"
            />
            <label htmlFor="hasStreams" className="text-sm font-medium text-gray-700">
              Ce niveau a des filières
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalType(null)} disabled={isSubmitting} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Filière */}
      <Modal
        isOpen={modalType === 'stream'}
        onClose={() => setModalType(null)}
        title={editingItem ? 'Modifier la filière' : 'Ajouter une filière'}
      >
        <form onSubmit={handleSubmitStream} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
            <Input
              value={streamForm.code}
              onChange={(e) => setStreamForm({ ...streamForm, code: e.target.value.toUpperCase() })}
              placeholder="SCIENTIFIQUE"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
            <Input
              value={streamForm.name}
              onChange={(e) => setStreamForm({ ...streamForm, name: e.target.value })}
              placeholder="Série Scientifique"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
              rows={3}
              value={streamForm.description}
              onChange={(e) => setStreamForm({ ...streamForm, description: e.target.value })}
              placeholder="Description de la filière..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModalType(null)} disabled={isSubmitting} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dialogs de confirmation */}
      <ConfirmDialog
        isOpen={deleteType === 'system'}
        onClose={() => setDeleteType(null)}
        onConfirm={handleDeleteSystem}
        title="Supprimer le système"
        message={`Êtes-vous sûr de vouloir supprimer "${editingItem?.name}" ? Tous les niveaux et filières associés seront également supprimés.`}
        confirmText="Supprimer"
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={deleteType === 'level'}
        onClose={() => setDeleteType(null)}
        onConfirm={handleDeleteLevel}
        title="Supprimer le niveau"
        message={`Êtes-vous sûr de vouloir supprimer "${editingItem?.name}" ? Toutes les filières associées seront également supprimées.`}
        confirmText="Supprimer"
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        isOpen={deleteType === 'stream'}
        onClose={() => setDeleteType(null)}
        onConfirm={handleDeleteStream}
        title="Supprimer la filière"
        message={`Êtes-vous sûr de vouloir supprimer "${editingItem?.name}" ? Cette action est irréversible.`}
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

'use client';

import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Country {
  id: string;
  code: string;
  name: string;
}

interface EducationSystem {
  id: string;
  code: string;
  name: string;
  countryId: string;
}

interface EducationLevel {
  id: string;
  code: string;
  name: string;
  systemId: string;
  hasStreams: boolean;
}

interface EducationStream {
  id: string;
  code: string;
  name: string;
  levelId: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
  category: string;
}

interface LevelSubject {
  id: string;
  levelId: string;
  subjectId: string;
  isCore: boolean;
  coefficient: number | null;
  hoursPerWeek: number | null;
  level: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    code: string;
    name: string;
    category: string;
  };
}

interface StreamSubject {
  id: string;
  streamId: string;
  subjectId: string;
  isCore: boolean;
  coefficient: number | null;
  hoursPerWeek: number | null;
  stream: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    code: string;
    name: string;
    category: string;
  };
}

type SubjectItem = LevelSubject | StreamSubject;

export default function LevelSubjectsTab() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [systems, setSystems] = useState<EducationSystem[]>([]);
  const [levels, setLevels] = useState<EducationLevel[]>([]);
  const [streams, setStreams] = useState<EducationStream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levelSubjects, setLevelSubjects] = useState<SubjectItem[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedSystem, setSelectedSystem] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedStream, setSelectedStream] = useState<string>('');

  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [formData, setFormData] = useState({
    subjectId: '',
    isCore: false,
    coefficient: '',
    hoursPerWeek: '',
  });

  const [editingItem, setEditingItem] = useState<SubjectItem | null>(null);

  const selectedLevelData = levels.find(l => l.id === selectedLevel);
  const hasStreams = selectedLevelData?.hasStreams || false;

  // Fetch countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get('/education/countries');
        setCountries(response.data);
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      }
    };
    fetchCountries();
  }, []);

  // Fetch systems when country changes
  useEffect(() => {
    if (!selectedCountry) {
      setSystems([]);
      setSelectedSystem('');
      return;
    }

    const fetchSystems = async () => {
      try {
        const response = await api.get(`/education/systems?countryCode=${selectedCountry}`);
        setSystems(response.data);
      } catch (error) {
        console.error('Failed to fetch systems:', error);
      }
    };
    fetchSystems();
  }, [selectedCountry]);

  // Fetch levels when system changes
  useEffect(() => {
    if (!selectedSystem) {
      setLevels([]);
      setSelectedLevel('');
      return;
    }

    const fetchLevels = async () => {
      try {
        const response = await api.get(`/education/systems/${selectedSystem}/levels`);
        setLevels(response.data);
      } catch (error) {
        console.error('Failed to fetch levels:', error);
      }
    };
    fetchLevels();
  }, [selectedSystem]);

  // Fetch streams when level changes and has streams
  useEffect(() => {
    if (!selectedLevel || !hasStreams) {
      setStreams([]);
      setSelectedStream('');
      return;
    }

    const fetchStreams = async () => {
      try {
        const response = await api.get(`/education/levels/${selectedLevel}/streams`);
        setStreams(response.data);
      } catch (error) {
        console.error('Failed to fetch streams:', error);
      }
    };
    fetchStreams();
  }, [selectedLevel, hasStreams]);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await api.get('/education/subjects');
        setSubjects(response.data);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch level subjects when level or stream changes
  useEffect(() => {
    if (!selectedLevel) {
      setLevelSubjects([]);
      return;
    }

    // Si le niveau a des filières, on attend qu'une filière soit sélectionnée
    if (hasStreams && !selectedStream) {
      setLevelSubjects([]);
      return;
    }

    const fetchLevelSubjects = async () => {
      try {
        if (hasStreams && selectedStream) {
          // TODO: Fetch stream subjects when backend is ready
          const response = await api.get(`/education/streams/${selectedStream}/subjects`);
          setLevelSubjects(response.data);
        } else {
          const response = await api.get(`/education/levels/${selectedLevel}/subjects`);
          setLevelSubjects(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch level subjects:', error);
      }
    };
    fetchLevelSubjects();
  }, [selectedLevel, selectedStream, hasStreams]);

  const handleAdd = () => {
    if (!selectedLevel) {
      setToast({ message: 'Veuillez sélectionner un niveau', type: 'info' });
      return;
    }
    if (hasStreams && !selectedStream) {
      setToast({ message: 'Veuillez sélectionner une filière', type: 'info' });
      return;
    }
    setEditingItem(null);
    setFormData({
      subjectId: '',
      isCore: false,
      coefficient: '',
      hoursPerWeek: '',
    });
    setShowModal(true);
  };

  const handleEdit = (item: SubjectItem) => {
    setEditingItem(item);
    setFormData({
      subjectId: item.subjectId,
      isCore: item.isCore,
      coefficient: item.coefficient?.toString() || '',
      hoursPerWeek: item.hoursPerWeek?.toString() || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLevel) return;

    setIsSubmitting(true);
    try {
      const payload = {
        subjectId: formData.subjectId,
        isCore: formData.isCore,
        coefficient: formData.coefficient ? parseInt(formData.coefficient) : null,
        hoursPerWeek: formData.hoursPerWeek ? parseInt(formData.hoursPerWeek) : null,
      };

      if (hasStreams && selectedStream) {
        // Stream subjects
        if (editingItem) {
          await api.put(`/education/stream-subjects/${editingItem.id}`, payload);
          setToast({ message: 'Matière modifiée avec succès', type: 'success' });
        } else {
          await api.post(`/education/streams/${selectedStream}/subjects`, payload);
          setToast({ message: 'Matière ajoutée avec succès', type: 'success' });
        }
        // Refresh list
        const response = await api.get(`/education/streams/${selectedStream}/subjects`);
        setLevelSubjects(response.data);
      } else {
        // Level subjects
        if (editingItem) {
          await api.put(`/education/level-subjects/${editingItem.id}`, payload);
          setToast({ message: 'Matière modifiée avec succès', type: 'success' });
        } else {
          await api.post(`/education/levels/${selectedLevel}/subjects`, payload);
          setToast({ message: 'Matière ajoutée avec succès', type: 'success' });
        }
        // Refresh list
        const response = await api.get(`/education/levels/${selectedLevel}/subjects`);
        setLevelSubjects(response.data);
      }

      setShowModal(false);
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Une erreur est survenue');
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;

    setIsSubmitting(true);
    try {
      if (hasStreams && selectedStream) {
        // Delete stream subject
        await api.delete(`/education/stream-subjects/${editingItem.id}`);
        // Refresh list
        const response = await api.get(`/education/streams/${selectedStream}/subjects`);
        setLevelSubjects(response.data);
      } else {
        // Delete level subject
        await api.delete(`/education/level-subjects/${editingItem.id}`);
        // Refresh list
        const response = await api.get(`/education/levels/${selectedLevel}/subjects`);
        setLevelSubjects(response.data);
      }
      
      setShowDeleteDialog(false);
      setToast({ message: 'Matière supprimée avec succès', type: 'success' });
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Une erreur est survenue');
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLevelName = levels.find(l => l.id === selectedLevel)?.name || '';
  const selectedStreamName = streams.find(s => s.id === selectedStream)?.name || '';

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pays
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedSystem('');
                setSelectedLevel('');
                setSelectedStream('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            >
              <option value="">Sélectionner un pays</option>
              {countries.map((country) => (
                <option key={country.id} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Système éducatif
            </label>
            <select
              value={selectedSystem}
              onChange={(e) => {
                setSelectedSystem(e.target.value);
                setSelectedLevel('');
                setSelectedStream('');
              }}
              disabled={!selectedCountry}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 text-sm"
            >
              <option value="">Sélectionner un système</option>
              {systems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Niveau
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setSelectedStream('');
              }}
              disabled={!selectedSystem}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 text-sm"
            >
              <option value="">Sélectionner un niveau</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>

          {hasStreams && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filière
              </label>
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                disabled={!selectedLevel}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 text-sm"
              >
                <option value="">Sélectionner une filière</option>
                {streams.map((stream) => (
                  <option key={stream.id} value={stream.id}>
                    {stream.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Level Subjects List */}
      {selectedLevel && (!hasStreams || selectedStream) && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">
                Matières: {selectedLevelName}
                {hasStreams && selectedStreamName && ` - ${selectedStreamName}`}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {levelSubjects.length} matière(s)
              </p>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une matière
            </Button>
          </div>

          {levelSubjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune matière configurée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Matière</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Catégorie</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Coefficient</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Heures/semaine</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {levelSubjects.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{item.subject.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{item.subject.category}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={item.isCore ? 'default' : 'outline'}>
                          {item.isCore ? 'Obligatoire' : 'Optionnelle'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.coefficient || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.hoursPerWeek || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? 'Modifier la matière' : 'Ajouter une matière'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matière *
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
              required
              disabled={!!editingItem}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Sélectionner une matière</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isCore}
                onChange={(e) => setFormData({ ...formData, isCore: e.target.checked })}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">
                Matière obligatoire
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coefficient
            </label>
            <Input
              type="number"
              value={formData.coefficient}
              onChange={(e) => setFormData({ ...formData, coefficient: e.target.value })}
              placeholder="Ex: 2"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heures par semaine
            </label>
            <Input
              type="number"
              value={formData.hoursPerWeek}
              onChange={(e) => setFormData({ ...formData, hoursPerWeek: e.target.value })}
              placeholder="Ex: 4"
              min="1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : editingItem ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Supprimer la matière"
        message={`Êtes-vous sûr de vouloir supprimer "${editingItem?.subject.name}" ?`}
        confirmText="Supprimer"
        isLoading={isSubmitting}
      />

      {/* Toast */}
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

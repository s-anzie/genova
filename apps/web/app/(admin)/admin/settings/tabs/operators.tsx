'use client';

import { Plus, Edit, Trash2, Smartphone } from 'lucide-react';
import { SearchBar } from '@/components/layout/search-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { useOperators, MobileOperator } from '@/hooks/useOperators';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function OperatorsTab() {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const { operators, loading, error, refetch } = useOperators(selectedCountry || undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<MobileOperator | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    displayName: '',
    provider: '',
    country: '',
    phonePrefix: '',
    phoneFormat: '',
    phoneLength: 9,
    color: '#0d7377',
    isActive: true,
  });

  const handleAdd = () => {
    setSelectedOperator(null);
    setFormData({
      code: '',
      name: '',
      displayName: '',
      provider: '',
      country: selectedCountry || '',
      phonePrefix: '',
      phoneFormat: '',
      phoneLength: 9,
      color: '#0d7377',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (operator: MobileOperator) => {
    setSelectedOperator(operator);
    setFormData({
      code: operator.code,
      name: operator.name,
      displayName: operator.displayName,
      provider: operator.provider,
      country: operator.country,
      phonePrefix: operator.phonePrefix,
      phoneFormat: operator.phoneFormat,
      phoneLength: operator.phoneLength,
      color: operator.color || '#0d7377',
      isActive: operator.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (operator: MobileOperator) => {
    setSelectedOperator(operator);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedOperator) {
        await api.put(`/operators/${selectedOperator.id}`, formData);
        setToast({ message: 'Opérateur modifié avec succès', type: 'success' });
      } else {
        await api.post('/operators', formData);
        setToast({ message: 'Opérateur créé avec succès', type: 'success' });
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
    if (!selectedOperator) return;
    setIsSubmitting(true);

    try {
      await api.delete(`/operators/${selectedOperator.id}`);
      await refetch();
      setIsDeleteDialogOpen(false);
      setToast({ message: 'Opérateur supprimé avec succès', type: 'success' });
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
          Gérer les opérateurs de paiement mobile money pour les transactions
        </p>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          Ajouter un opérateur
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <SearchBar placeholder="Rechercher un opérateur..." />
        </div>
        <select 
          className="h-11 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium"
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
        >
          <option value="">Tous les pays</option>
          <option value="CM">Cameroun</option>
          <option value="CI">Côte d'Ivoire</option>
          <option value="SN">Sénégal</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Opérateur</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Pays</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Préfixe</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Chargement...
                  </td>
                </tr>
              ) : operators.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Aucun opérateur trouvé
                  </td>
                </tr>
              ) : (
                operators.map((operator) => (
                  <tr key={operator.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center" 
                          style={{ backgroundColor: operator.color || '#666' }}
                        >
                          <Smartphone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold">{operator.name}</div>
                          <div className="text-xs text-gray-500">{operator.displayName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="font-mono text-sm">{operator.code}</span></td>
                    <td className="px-6 py-4 text-sm">{operator.countryName} ({operator.country})</td>
                    <td className="px-6 py-4 text-sm">{operator.phonePrefix}</td>
                    <td className="px-6 py-4">
                      <Badge variant={operator.isActive ? 'success' : 'outline'}>
                        {operator.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(operator)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(operator)}>
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
      </Card>

      {/* Modal Ajout/Modification */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedOperator ? 'Modifier l\'opérateur' : 'Ajouter un opérateur'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="MTN_CM"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pays *</label>
              <select
                className="w-full h-11 px-4 rounded-lg border border-gray-200 text-sm"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              >
                <option value="">Sélectionner</option>
                <option value="CM">Cameroun</option>
                <option value="CI">Côte d'Ivoire</option>
                <option value="SN">Sénégal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="MTN Mobile Money"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom d'affichage *</label>
            <Input
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="MTN MoMo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fournisseur *</label>
            <Input
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              placeholder="MTN"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Préfixe *</label>
              <Input
                value={formData.phonePrefix}
                onChange={(e) => setFormData({ ...formData, phonePrefix: e.target.value })}
                placeholder="67"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <Input
                value={formData.phoneFormat}
                onChange={(e) => setFormData({ ...formData, phoneFormat: e.target.value })}
                placeholder="6XXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Longueur *</label>
              <Input
                type="number"
                value={formData.phoneLength}
                onChange={(e) => setFormData({ ...formData, phoneLength: parseInt(e.target.value) })}
                min="8"
                max="15"
                required
              />
            </div>
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 text-primary rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Opérateur actif
            </label>
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
        title="Supprimer l'opérateur"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedOperator?.name}" ? Cette action est irréversible.`}
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

'use client';

import { Plus, Edit, Trash2, Globe } from 'lucide-react';
import { SearchBar } from '@/components/layout/search-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import { useCountries, Country } from '@/hooks/useCountries';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function CountriesTab() {
  const { countries, loading, error, refetch } = useCountries();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phoneCode: '',
    currencyCode: '',
    currencyName: '',
    currencySymbol: '',
  });

  const handleAdd = () => {
    setSelectedCountry(null);
    setFormData({
      code: '',
      name: '',
      phoneCode: '',
      currencyCode: '',
      currencyName: '',
      currencySymbol: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (country: Country) => {
    setSelectedCountry(country);
    setFormData({
      code: country.code,
      name: country.name,
      phoneCode: country.phoneCode,
      currencyCode: country.currencyCode,
      currencyName: country.currencyName,
      currencySymbol: country.currencySymbol,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (country: Country) => {
    setSelectedCountry(country);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedCountry) {
        await api.put(`/education/countries/${selectedCountry.id}`, formData);
        setToast({ message: 'Pays modifié avec succès', type: 'success' });
      } else {
        await api.post('/education/countries', formData);
        setToast({ message: 'Pays créé avec succès', type: 'success' });
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
    if (!selectedCountry) return;
    setIsSubmitting(true);

    try {
      await api.delete(`/education/countries/${selectedCountry.id}`);
      await refetch();
      setIsDeleteDialogOpen(false);
      setToast({ message: 'Pays supprimé avec succès', type: 'success' });
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
          Gérer les pays disponibles pour l'onboarding des utilisateurs
        </p>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          Ajouter un pays
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <SearchBar placeholder="Rechercher un pays..." />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Nom</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Indicatif</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Devise</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    Chargement...
                  </td>
                </tr>
              ) : countries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    Aucun pays trouvé
                  </td>
                </tr>
              ) : (
                countries.map((country) => (
                  <tr key={country.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-sm font-semibold">{country.code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="font-medium">{country.name}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{country.phoneCode}</td>
                    <td className="px-6 py-4 text-sm">
                      {country.currencyCode} ({country.currencySymbol})
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(country)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(country)}>
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
        title={selectedCountry ? 'Modifier le pays' : 'Ajouter un pays'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code pays (ISO) *
            </label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="CM"
              maxLength={2}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du pays *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Cameroun"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Indicatif téléphonique *
            </label>
            <Input
              value={formData.phoneCode}
              onChange={(e) => setFormData({ ...formData, phoneCode: e.target.value })}
              placeholder="+237"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code devise *
            </label>
            <Input
              value={formData.currencyCode}
              onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value.toUpperCase() })}
              placeholder="XAF"
              maxLength={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la devise *
            </label>
            <Input
              value={formData.currencyName}
              onChange={(e) => setFormData({ ...formData, currencyName: e.target.value })}
              placeholder="Franc CFA"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symbole devise *
            </label>
            <Input
              value={formData.currencySymbol}
              onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
              placeholder="FCFA"
              required
            />
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
        title="Supprimer le pays"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedCountry?.name}" ? Cette action est irréversible.`}
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

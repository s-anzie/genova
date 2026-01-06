'use client';

import { Plus, Edit, Trash2, Layers } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { SearchBar } from '@/components/layout/search-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LevelsPage() {
  return (
    <div>
      <PageHeader
        title="Niveaux scolaires"
        description="Gérer les niveaux d'études par système éducatif"
        action={
          <Button>
            <Plus className="w-4 h-4" />
            Ajouter un niveau
          </Button>
        }
      />

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchBar placeholder="Rechercher un niveau..." />
        </div>
        <select className="h-11 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium">
          <option value="">Tous les systèmes</option>
          <option value="CM_FR">Système Francophone</option>
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Ordre</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Nom</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Système</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Catégorie</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4"><span className="font-semibold">1</span></td>
                <td className="px-6 py-4"><span className="font-mono text-sm">SIL</span></td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="font-medium">SIL (Maternelle)</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">Système Francophone</td>
                <td className="px-6 py-4"><Badge variant="default">Primaire</Badge></td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-error" /></Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

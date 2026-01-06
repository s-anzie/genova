'use client';

import { Plus, Edit } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { SearchBar } from '@/components/layout/search-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SubjectsPage() {
  return (
    <div>
      <PageHeader
        title="Matières"
        description="Gérer les matières enseignées"
        action={
          <Button>
            <Plus className="w-4 h-4" />
            Ajouter une matière
          </Button>
        }
      />

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchBar placeholder="Rechercher une matière..." />
        </div>
        <select className="h-11 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium">
          <option value="">Toutes les catégories</option>
          <option value="SCIENCE">Sciences</option>
          <option value="LANGUAGE">Langues</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                  🔬
                </div>
                <div>
                  <h3 className="font-bold text-lg">Mathématiques</h3>
                  <p className="text-sm text-gray-600">Mathematics</p>
                </div>
              </div>
              <Badge variant="success">Actif</Badge>
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="w-4 h-4" />
                Modifier
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

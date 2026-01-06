'use client';

import { Plus, Edit, Languages } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { SearchBar } from '@/components/layout/search-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LanguagesPage() {
  return (
    <div>
      <PageHeader
        title="Langues d'enseignement"
        description="Gérer les langues disponibles"
        action={
          <Button>
            <Plus className="w-4 h-4" />
            Ajouter une langue
          </Button>
        }
      />

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchBar placeholder="Rechercher une langue..." />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Languages className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Français</h3>
                  <p className="text-sm text-gray-600">French</p>
                </div>
              </div>
              <Badge variant="success">Actif</Badge>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Code</span>
                <span className="font-mono font-semibold">FR</span>
              </div>
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

'use client';

import { Plus, Edit, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { SearchBar } from '@/components/layout/search-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function StreamsPage() {
  return (
    <div>
      <PageHeader
        title="Filières"
        description="Gérer les filières et spécialisations"
        action={
          <Button>
            <Plus className="w-4 h-4" />
            Ajouter une filière
          </Button>
        }
      />

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <SearchBar placeholder="Rechercher une filière..." />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Série C</h3>
                  <p className="text-sm text-gray-600">Sciences Maths</p>
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

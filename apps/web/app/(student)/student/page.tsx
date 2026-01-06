import { Calendar, Clock, BookOpen, Search, Bell } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatsCard } from '@/components/layout/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/layout/search-bar';

export default function StudentDashboard() {
  return (
    <div>
      <PageHeader
        title="Bienvenue, Étudiant!"
        description="Votre espace d'apprentissage personnalisé"
        action={
          <Button variant="outline">
            <Bell className="w-4 h-4" />
            Notifications
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar placeholder="Rechercher un tuteur, une matière..." />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Sessions à venir"
          value="0"
          icon={Calendar}
          iconColor="text-primary"
        />
        <StatsCard
          title="Heures cette semaine"
          value="0h"
          icon={Clock}
          iconColor="text-warning"
        />
        <StatsCard
          title="Sessions totales"
          value="0"
          icon={BookOpen}
          iconColor="text-success"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Trouver un tuteur</h3>
                <p className="text-sm text-gray-600">Recherchez parmi nos tuteurs qualifiés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Réserver une session</h3>
                <p className="text-sm text-gray-600">Planifiez votre prochaine session</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Prochaines sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-400">
            Aucune session planifiée
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

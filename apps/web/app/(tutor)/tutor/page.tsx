import { Calendar, Users, Clock, Star } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatsCard } from '@/components/layout/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TutorDashboard() {
  return (
    <div>
      <PageHeader
        title="Bienvenue, Tuteur!"
        description="Gérez vos sessions et suivez vos performances"
        action={
          <Button>
            Créer une session
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Sessions cette semaine"
          value="0"
          icon={Calendar}
          iconColor="text-primary"
        />
        <StatsCard
          title="Étudiants actifs"
          value="0"
          icon={Users}
          iconColor="text-success"
        />
        <StatsCard
          title="Heures enseignées"
          value="0h"
          icon={Clock}
          iconColor="text-warning"
        />
        <StatsCard
          title="Note moyenne"
          value="-"
          icon={Star}
          iconColor="text-warning"
        />
      </div>

      {/* Upcoming Sessions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Prochaines sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-400">
            Aucune session planifiée
          </div>
        </CardContent>
      </Card>

      {/* Recent Students */}
      <Card>
        <CardHeader>
          <CardTitle>Étudiants récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-400">
            Aucun étudiant pour le moment
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

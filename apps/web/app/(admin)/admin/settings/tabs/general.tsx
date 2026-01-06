'use client';

import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function GeneralSettings() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la plateforme
            </label>
            <Input defaultValue="Genova" placeholder="Nom de la plateforme" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de support
            </label>
            <Input type="email" placeholder="support@genova.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Téléphone de support
            </label>
            <Input type="tel" placeholder="+237 6XX XX XX XX" />
          </div>
        </CardContent>
      </Card>

      {/* Configuration des sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration des sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée par défaut (minutes)
            </label>
            <Input type="number" defaultValue="60" min="15" step="15" />
            <p className="text-xs text-gray-500 mt-1">
              Durée par défaut d'une session de tutorat
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Délai d'annulation (heures)
            </label>
            <Input type="number" defaultValue="24" min="1" />
            <p className="text-xs text-gray-500 mt-1">
              Délai minimum avant le début de la session pour pouvoir annuler
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durée de réservation maximale (jours)
            </label>
            <Input type="number" defaultValue="30" min="1" />
            <p className="text-xs text-gray-500 mt-1">
              Nombre de jours maximum à l'avance pour réserver une session
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Emails de confirmation
              </label>
              <p className="text-xs text-gray-500">
                Envoyer un email lors de la création d'une session
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-primary rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Rappels de session
              </label>
              <p className="text-xs text-gray-500">
                Envoyer un rappel 24h avant la session
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-primary rounded" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Notifications push
              </label>
              <p className="text-xs text-gray-500">
                Activer les notifications push sur mobile
              </p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-primary rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Paiements */}
      <Card>
        <CardHeader>
          <CardTitle>Paiements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission plateforme (%)
            </label>
            <Input type="number" defaultValue="15" min="0" max="100" step="0.1" />
            <p className="text-xs text-gray-500 mt-1">
              Pourcentage prélevé sur chaque transaction
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant minimum de retrait (FCFA)
            </label>
            <Input type="number" defaultValue="5000" min="0" step="1000" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Paiement automatique
              </label>
              <p className="text-xs text-gray-500">
                Transférer automatiquement les fonds aux tuteurs
              </p>
            </div>
            <input type="checkbox" className="w-5 h-5 text-primary rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Mode maintenance
              </label>
              <p className="text-xs text-gray-500">
                Désactiver temporairement l'accès à la plateforme
              </p>
            </div>
            <input type="checkbox" className="w-5 h-5 text-primary rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message de maintenance
            </label>
            <textarea 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm"
              rows={3}
              placeholder="La plateforme est en maintenance. Nous serons de retour bientôt."
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button>
          <Save className="w-4 h-4" />
          Enregistrer
        </Button>
        <Button variant="outline">
          Annuler
        </Button>
      </div>
    </div>
  );
}

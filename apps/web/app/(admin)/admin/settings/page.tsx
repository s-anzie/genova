'use client';

import { Settings, Globe, Smartphone, GraduationCap, BookOpen, Languages as LanguagesIcon, BookMarked } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs } from '@/components/ui/tabs';
import GeneralSettings from './tabs/general';
import CountriesTab from './tabs/countries';
import OperatorsTab from './tabs/operators';
import EducationSystemsTab from './tabs/education-systems';
import SubjectsTab from './tabs/subjects';
import LanguagesTab from './tabs/languages';
import LevelSubjectsTab from './tabs/level-subjects';

export default function SettingsPage() {
  const tabs = [
    { id: 'general', label: 'Général', icon: <Settings className="w-4 h-4" /> },
    { id: 'countries', label: 'Pays', icon: <Globe className="w-4 h-4" /> },
    { id: 'operators', label: 'Opérateurs', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'education', label: 'Systèmes éducatifs', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'subjects', label: 'Matières', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'level-subjects', label: 'Matières par niveau', icon: <BookMarked className="w-4 h-4" /> },
    { id: 'languages', label: 'Langues', icon: <LanguagesIcon className="w-4 h-4" /> },
  ];

  return (
    <div>
      <PageHeader
        title="Configuration de la plateforme"
        description="Gérer les paramètres globaux et les données de référence pour l'onboarding"
      />

      <Tabs tabs={tabs} defaultTab="general">
        {(activeTab) => {
          switch (activeTab) {
            case 'general':
              return <GeneralSettings />;
            case 'countries':
              return <CountriesTab />;
            case 'operators':
              return <OperatorsTab />;
            case 'education':
              return <EducationSystemsTab />;
            case 'subjects':
              return <SubjectsTab />;
            case 'level-subjects':
              return <LevelSubjectsTab />;
            case 'languages':
              return <LanguagesTab />;
            default:
              return null;
          }
        }}
      </Tabs>
    </div>
  );
}

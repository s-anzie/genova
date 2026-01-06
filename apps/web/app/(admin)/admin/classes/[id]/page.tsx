'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Calendar, BookOpen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { api } from '@/lib/api';

interface ClassDetails {
  id: string;
  name: string;
  description?: string;
  meetingLocation?: string;
  isActive: boolean;
  createdAt: string;
  members?: Array<{
    student: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  timeSlots?: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  classSubjects?: Array<{
    levelSubject: {
      subject: {
        name: string;
        code: string;
      };
      level: {
        name: string;
        code: string;
      };
    };
  }>;
}

const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function ClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassDetails();
  }, [classId]);

  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/classes/${classId}`);
      setClassData(res.data);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement de la classe');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="p-8">
        <Alert variant="error" title="Erreur">
          {error || 'Classe non trouvée'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {classData.name}
            </h1>
            <div className="flex items-center gap-3">
              <Badge variant={classData.isActive ? 'success' : 'outline'}>
                {classData.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-sm text-gray-600">
                Créée le {new Date(classData.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Class Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subjects */}
          {classData.classSubjects && classData.classSubjects.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Matières</h2>
                <div className="flex flex-wrap gap-2">
                  {classData.classSubjects.map((cs, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-semibold text-sm">{cs.levelSubject.subject.name}</p>
                        <p className="text-xs text-gray-600">{cs.levelSubject.level.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Description */}
          {classData.description && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Description</h2>
                <p className="text-gray-700">{classData.description}</p>
              </div>
            </Card>
          )}

          {/* Location */}
          {classData.meetingLocation && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Lieu de rencontre</h2>
                <p className="text-gray-700">{classData.meetingLocation}</p>
              </div>
            </Card>
          )}

          {/* Time Slots - Emploi du temps graphique */}
          {classData.timeSlots && classData.timeSlots.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Emploi du temps</h2>
                
                {/* Grille de l'emploi du temps */}
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    {/* En-tête avec les jours */}
                    <div className="grid grid-cols-8 gap-2 mb-2">
                      <div className="text-xs font-semibold text-gray-500 p-2"></div>
                      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, index) => (
                        <div key={index} className="text-center text-xs font-semibold text-gray-700 p-2 bg-gray-100 rounded">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Grille horaire - seulement les heures avec des cours */}
                    <div className="space-y-1">
                      {(() => {
                        // Trouver toutes les heures qui ont au moins un cours
                        const hoursWithClasses = new Set<number>();
                        classData.timeSlots?.forEach((slot) => {
                          const startHour = parseInt(slot.startTime?.split(':')[0] || '0');
                          const endHour = parseInt(slot.endTime?.split(':')[0] || '0');
                          for (let h = startHour; h < endHour; h++) {
                            hoursWithClasses.add(h);
                          }
                        });

                        // Trier les heures
                        const sortedHours = Array.from(hoursWithClasses).sort((a, b) => a - b);

                        return sortedHours.map((hour) => {
                          const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
                          
                          return (
                            <div key={hour} className="grid grid-cols-8 gap-2">
                              {/* Colonne des heures */}
                              <div className="text-xs text-gray-500 p-2 text-right">
                                {timeLabel}
                              </div>
                              
                              {/* Colonnes des jours (Lun=1 à Dim=0) */}
                              {[1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => {
                                // Trouver les créneaux pour ce jour et cette heure
                                const slotsForThisCell = classData.timeSlots?.filter((slot) => {
                                  if (slot.dayOfWeek !== dayOfWeek) return false;
                                  
                                  const startHour = parseInt(slot.startTime?.split(':')[0] || '0');
                                  const endHour = parseInt(slot.endTime?.split(':')[0] || '0');
                                  
                                  return hour >= startHour && hour < endHour;
                                }) || [];

                                const hasSlot = slotsForThisCell.length > 0;
                                const slot = slotsForThisCell[0];
                                
                                // Calculer si c'est le début du créneau
                                const isStart = slot && parseInt(slot.startTime?.split(':')[0] || '0') === hour;
                                
                                return (
                                  <div
                                    key={dayOfWeek}
                                    className={`
                                      relative min-h-[40px] rounded transition-colors
                                      ${hasSlot 
                                        ? 'bg-primary/20 border-l-4 border-primary' 
                                        : 'bg-gray-50 border border-gray-200'
                                      }
                                    `}
                                  >
                                    {isStart && slot && (
                                      <div className="absolute inset-0 p-1 flex flex-col justify-center">
                                        <p className="text-xs font-semibold text-primary truncate">
                                          {slot.startTime} - {slot.endTime}
                                        </p>
                                        {classData.classSubjects && classData.classSubjects[0] && (
                                          <p className="text-[10px] text-gray-600 truncate">
                                            {classData.classSubjects[0].levelSubject.subject.name}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

                {/* Légende */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Créneaux horaires :</p>
                  <div className="flex flex-wrap gap-3">
                    {classData.timeSlots.map((slot) => (
                      <div key={slot.id} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 bg-primary/20 border-l-2 border-primary rounded"></div>
                        <span className="font-medium">{daysOfWeek[slot.dayOfWeek]}</span>
                        <span className="text-gray-600">{slot.startTime} - {slot.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Members */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Étudiants</h2>
                <Badge variant="outline">
                  {classData.members?.length || 0}
                </Badge>
              </div>
              
              {classData.members && classData.members.length > 0 ? (
                <div className="space-y-3">
                  {classData.members.map((member) => (
                    <div 
                      key={member.student.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                      onClick={() => router.push(`/admin/students/${member.student.id}`)}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {member.student.firstName} {member.student.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{member.student.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Aucun étudiant inscrit</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

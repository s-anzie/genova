import Link from 'next/link';
import { Shield, GraduationCap, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-cream-dark flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-4 tracking-tight">
            Genova
          </h1>
          <p className="text-xl text-gray-600">
            Plateforme de tutorat nouvelle génération
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Admin Card */}
          <Link href="/admin" className="group">
            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-gray-900 h-full">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-gray-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Administration
                  </h2>
                  <p className="text-gray-600">
                    Gérer la plateforme et les utilisateurs
                  </p>
                </div>
                <Button variant="outline" className="w-full group-hover:bg-gray-900 group-hover:text-white">
                  Accéder
                </Button>
              </div>
            </Card>
          </Link>

          {/* Tutor Card */}
          <Link href="/tutor" className="group">
            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary h-full">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Espace Tuteur
                  </h2>
                  <p className="text-gray-600">
                    Gérer vos cours et vos étudiants
                  </p>
                </div>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white">
                  Accéder
                </Button>
              </div>
            </Card>
          </Link>

          {/* Student Card */}
          <Link href="/student" className="group">
            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-success h-full">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-success flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Espace Étudiant
                  </h2>
                  <p className="text-gray-600">
                    Trouver des tuteurs et réserver des sessions
                  </p>
                </div>
                <Button variant="outline" className="w-full group-hover:bg-success group-hover:text-white">
                  Accéder
                </Button>
              </div>
            </Card>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 text-sm">
          <p>© 2026 Genova. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  );
}

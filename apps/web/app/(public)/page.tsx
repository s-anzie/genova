import Link from 'next/link';
import { 
  Users, 
  Calendar, 
  Award,
  CheckCircle,
  Star,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Globe,
  Heart,
  Target,
  Zap,
  Shield,
  MessageCircle,
  BookOpen,
  GraduationCap,
  Lightbulb,
  TrendingDown,
  Smile,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Genova</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#mission" className="text-gray-600 hover:text-primary transition font-medium">Notre Mission</a>
              <a href="#benefits" className="text-gray-600 hover:text-primary transition font-medium">Avantages</a>
              <a href="#stories" className="text-gray-600 hover:text-primary transition font-medium">Histoires</a>
              <a href="#community" className="text-gray-600 hover:text-primary transition font-medium">Communauté</a>
              <Link href="/login">
                <Button variant="outline" className="border-2">Connexion</Button>
              </Link>
              <Link href="/register">
                <Button className="shadow-lg shadow-primary/30">Rejoindre Genova</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-cream/30 via-white to-primary/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-8 border border-primary/20">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-semibold">Rejoignez 10 000+ étudiants et tuteurs</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
                L'éducation qui <span className="bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">change des vies</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed">
                Genova connecte les étudiants ambitieux d'Afrique francophone avec des tuteurs passionnés. 
                Parce que chaque rêve mérite d'être accompagné.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/register?role=student">
                  <Button size="lg" className="text-lg px-10 py-7 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all">
                    Commencer mon parcours
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/register?role=tutor">
                  <Button size="lg" variant="outline" className="text-lg px-10 py-7 border-2 hover:bg-gray-50">
                    Devenir tuteur
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center space-x-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-medium">1000€ offerts aux étudiants</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-medium">Sans engagement</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-medium">Paiement sécurisé</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative z-10">
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Session en cours</div>
                      <div className="text-lg font-bold text-gray-900">Mathématiques Avancées</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-cream/50 rounded-xl">
                      <span className="text-gray-700">Progression</span>
                      <span className="font-bold text-primary">87%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-success/10 rounded-xl">
                      <span className="text-gray-700">Note moyenne</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-5 h-5 text-accent-gold fill-accent-gold" />
                        <span className="font-bold text-gray-900">4.9</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl">
                      <span className="text-gray-700">Sessions complétées</span>
                      <span className="font-bold text-primary">24</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-secondary/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <Target className="w-4 h-4" />
                <span className="text-sm font-semibold">Notre Mission</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Démocratiser l'accès à une éducation de qualité
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                En Afrique francophone, trop d'étudiants brillants abandonnent leurs rêves par manque d'accompagnement. 
                Nous croyons que chaque jeune mérite d'avoir accès aux meilleurs tuteurs, peu importe où il se trouve.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Genova n'est pas qu'une plateforme. C'est un mouvement qui transforme des vies, une session à la fois. 
                Nous construisons des ponts entre les rêves et la réalité.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-2xl border border-primary/20">
                  <div className="text-3xl font-bold text-primary mb-2">10k+</div>
                  <div className="text-gray-700">Vies transformées</div>
                </div>
                <div className="bg-gradient-to-br from-success/10 to-success/5 p-6 rounded-2xl border border-success/20">
                  <div className="text-3xl font-bold text-success mb-2">8 pays</div>
                  <div className="text-gray-700">En Afrique francophone</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20">
                    <Lightbulb className="w-10 h-10 text-accent-gold mb-4" />
                    <h3 className="font-bold text-gray-900 mb-2">Innovation</h3>
                    <p className="text-sm text-gray-600">Technologie au service de l'éducation</p>
                  </Card>
                  <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20">
                    <Heart className="w-10 h-10 text-error mb-4" />
                    <h3 className="font-bold text-gray-900 mb-2">Passion</h3>
                    <p className="text-sm text-gray-600">Chaque étudiant compte pour nous</p>
                  </Card>
                </div>
                <div className="space-y-4 pt-8">
                  <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20">
                    <Shield className="w-10 h-10 text-primary mb-4" />
                    <h3 className="font-bold text-gray-900 mb-2">Confiance</h3>
                    <p className="text-sm text-gray-600">Tuteurs vérifiés et qualifiés</p>
                  </Card>
                  <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20">
                    <Globe className="w-10 h-10 text-success mb-4" />
                    <h3 className="font-bold text-gray-900 mb-2">Accessibilité</h3>
                    <p className="text-sm text-gray-600">Partout, pour tous</p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Des chiffres qui parlent d'eux-mêmes
            </h2>
            <p className="text-xl text-white/90">
              L'impact de notre communauté grandit chaque jour
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-3">500+</div>
              <div className="text-white/90 text-lg">Tuteurs passionnés</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-3">10k+</div>
              <div className="text-white/90 text-lg">Étudiants actifs</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-3">50k+</div>
              <div className="text-white/90 text-lg">Sessions réalisées</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-3">4.9/5</div>
              <div className="text-white/90 text-lg">Satisfaction moyenne</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-cream/30 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">Pourquoi Genova</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Plus qu'une plateforme, un écosystème complet
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Nous avons pensé à chaque détail pour rendre votre expérience d'apprentissage fluide, 
              motivante et efficace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/30 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg shadow-primary/30">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tuteurs d'exception</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Chaque tuteur est soigneusement sélectionné et vérifié. Diplômes, expérience, pédagogie : 
                nous ne faisons aucun compromis sur la qualité.
              </p>
              <div className="flex items-center space-x-2 text-sm text-primary font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Vérification complète</span>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-success/30 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-success/70 flex items-center justify-center mb-6 shadow-lg shadow-success/30">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Flexibilité totale</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Votre emploi du temps est unique. Réservez vos sessions quand vous voulez, 
                où vous voulez. Annulation gratuite jusqu'à 24h avant.
              </p>
              <div className="flex items-center space-x-2 text-sm text-success font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Disponible 24/7</span>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-accent-gold/30 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-gold to-accent-gold/70 flex items-center justify-center mb-6 shadow-lg shadow-accent-gold/30">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Progression visible</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Suivez votre évolution en temps réel avec des rapports détaillés, des statistiques 
                et des recommandations personnalisées.
              </p>
              <div className="flex items-center space-x-2 text-sm text-accent-gold font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Tableaux de bord complets</span>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-error/30 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-error to-error/70 flex items-center justify-center mb-6 shadow-lg shadow-error/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Paiements sécurisés</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Vos transactions sont protégées par les meilleurs standards de sécurité. 
                Payez en toute confiance avec plusieurs moyens de paiement.
              </p>
              <div className="flex items-center space-x-2 text-sm text-error font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Cryptage bancaire</span>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-secondary/30 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center mb-6 shadow-lg shadow-secondary/30">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Gamification motivante</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Gagnez des badges, débloquez des récompenses et célébrez chaque victoire. 
                L'apprentissage devient un jeu passionnant.
              </p>
              <div className="flex items-center space-x-2 text-sm text-secondary font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Système de récompenses</span>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/30 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center mb-6 shadow-lg shadow-gray-900/30">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Support humain</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Une question ? Un problème ? Notre équipe est là pour vous, en français, 
                avec une vraie compréhension de votre contexte.
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-900 font-medium">
                <CheckCircle className="w-4 h-4" />
                <span>Réponse en moins de 2h</span>
              </div>
            </Card>
          </div>

          {/* Special Student Offer */}
          <div className="bg-gradient-to-r from-primary via-primary/90 to-secondary p-12 rounded-3xl shadow-2xl text-center">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center space-x-2 bg-white/20 text-white px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">Offre de lancement</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                1000€ de crédit offert à chaque nouvel étudiant
              </h3>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Nous croyons en vous. C'est pourquoi nous offrons 1000€ de crédit à chaque étudiant 
                qui rejoint Genova. Commencez votre parcours sans aucun risque financier.
              </p>
              <Link href="/register?role=student">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-lg px-10 py-7 shadow-xl">
                  Réclamer mon crédit gratuit
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-cream/30 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-semibold">Simple et efficace</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Votre parcours en 3 étapes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Nous avons simplifié le processus pour que vous puissiez vous concentrer sur l'essentiel : apprendre et progresser.
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-success to-secondary transform -translate-y-1/2 z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              <div className="text-center">
                <div className="relative inline-block mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white flex items-center justify-center text-4xl font-bold mx-auto shadow-2xl shadow-primary/40">
                    1
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Créez votre profil</h3>
                <p className="text-gray-600 leading-relaxed text-lg mb-6">
                  Inscrivez-vous en 2 minutes. Parlez-nous de vos objectifs, de vos matières préférées, 
                  et de votre niveau actuel. Plus nous vous connaissons, mieux nous pouvons vous aider.
                </p>
                <div className="inline-flex items-center space-x-2 bg-success/10 text-success px-4 py-2 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  <span>1000€ de crédit offert</span>
                </div>
              </div>

              <div className="text-center">
                <div className="relative inline-block mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success to-success/70 text-white flex items-center justify-center text-4xl font-bold mx-auto shadow-2xl shadow-success/40">
                    2
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent-gold rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Trouvez votre match parfait</h3>
                <p className="text-gray-600 leading-relaxed text-lg mb-6">
                  Parcourez les profils de nos tuteurs. Consultez leurs spécialités, leurs avis, 
                  leurs disponibilités. Choisissez celui qui vous inspire confiance et correspond à vos besoins.
                </p>
                <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                  <Users className="w-4 h-4" />
                  <span>500+ tuteurs qualifiés</span>
                </div>
              </div>

              <div className="text-center">
                <div className="relative inline-block mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-secondary to-secondary/70 text-white flex items-center justify-center text-4xl font-bold mx-auto shadow-2xl shadow-secondary/40">
                    3
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-error rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Apprenez et progressez</h3>
                <p className="text-gray-600 leading-relaxed text-lg mb-6">
                  Réservez votre première session et commencez votre transformation. Suivez votre progression, 
                  gagnez des badges, et célébrez chaque victoire avec votre tuteur.
                </p>
                <div className="inline-flex items-center space-x-2 bg-accent-gold/10 text-accent-gold px-4 py-2 rounded-full text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>Résultats visibles rapidement</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-10 py-7 shadow-xl shadow-primary/30">
                Commencer maintenant
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-semibold">Notre Communauté</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Rejoignez un mouvement qui transforme l'Afrique
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Genova, c'est bien plus qu'une plateforme. C'est une communauté de rêveurs, de travailleurs acharnés, 
                de tuteurs passionnés et d'étudiants déterminés qui croient que l'éducation peut changer le monde.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Ensemble, nous construisons l'avenir de l'éducation en Afrique francophone. 
                Chaque session, chaque progrès, chaque réussite contribue à cette vision.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Présence dans 8 pays</h4>
                    <p className="text-gray-600">Sénégal, Côte d'Ivoire, Cameroun, Mali, Burkina Faso, Bénin, Togo, Niger</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Communauté active</h4>
                    <p className="text-gray-600">Forums, groupes d'étude, événements mensuels et webinaires gratuits</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-gold/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-accent-gold" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Impact social</h4>
                    <p className="text-gray-600">10% de nos bénéfices financent des bourses pour étudiants défavorisés</p>
                  </div>
                </div>
              </div>

              <Link href="/register">
                <Button size="lg" className="text-lg px-10 py-7 shadow-xl shadow-primary/30">
                  Faire partie de la communauté
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
                  <div className="text-4xl font-bold text-primary mb-2">92%</div>
                  <div className="text-gray-700 font-medium">Taux de réussite aux examens</div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/20">
                  <div className="text-4xl font-bold text-success mb-2">4.9/5</div>
                  <div className="text-gray-700 font-medium">Satisfaction moyenne</div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-accent-gold/10 to-accent-gold/5 border-2 border-accent-gold/20">
                  <div className="text-4xl font-bold text-accent-gold mb-2">24/7</div>
                  <div className="text-gray-700 font-medium">Support disponible</div>
                </Card>
              </div>
              <div className="space-y-6 pt-12">
                <Card className="p-6 bg-gradient-to-br from-secondary/10 to-secondary/5 border-2 border-secondary/20">
                  <div className="text-4xl font-bold text-secondary mb-2">50k+</div>
                  <div className="text-gray-700 font-medium">Sessions réalisées</div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-error/10 to-error/5 border-2 border-error/20">
                  <div className="text-4xl font-bold text-error mb-2">98%</div>
                  <div className="text-gray-700 font-medium">Recommandent Genova</div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-gray-900/10 to-gray-900/5 border-2 border-gray-900/20">
                  <div className="text-4xl font-bold text-gray-900 mb-2">2h</div>
                  <div className="text-gray-700 font-medium">Temps de réponse moyen</div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Stories Section */}
      <section id="stories" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Smile className="w-4 h-4" />
              <span className="text-sm font-semibold">Histoires vraies</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ils ont transformé leur vie avec Genova
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Derrière chaque statistique, il y a une personne, un rêve, une histoire. 
              Voici quelques-unes de ces histoires qui nous inspirent chaque jour.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/20">
              <div className="flex items-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-accent-gold fill-accent-gold" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed text-lg italic">
                "J'étais sur le point d'abandonner mes études en médecine. Les cours étaient trop difficiles 
                et je n'avais personne pour m'aider. Grâce à Genova, j'ai trouvé Docteur Kofi qui m'a non 
                seulement aidé à comprendre, mais aussi à retrouver ma passion. Aujourd'hui, je suis en 3ème année 
                et dans le top 10 de ma promotion."
              </p>
              <div className="flex items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">AM</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Aminata M.</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    Étudiante en médecine, Dakar
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-success/20">
              <div className="flex items-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-accent-gold fill-accent-gold" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed text-lg italic">
                "En tant que tuteur, Genova a changé ma vie. Je peux maintenant enseigner à des étudiants 
                de toute l'Afrique francophone depuis mon salon. J'ai aidé plus de 150 étudiants à réussir 
                leurs examens, et je gagne un revenu stable qui me permet de subvenir aux besoins de ma famille. 
                C'est plus qu'un travail, c'est une mission."
              </p>
              <div className="flex items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-success to-success/70 flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">KD</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Kofi D.</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    Tuteur en mathématiques, Abidjan
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-accent-gold/20">
              <div className="flex items-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-accent-gold fill-accent-gold" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed text-lg italic">
                "Mon fils avait des difficultés en français et en mathématiques. Avec Genova, nous avons trouvé 
                des tuteurs patients et compétents qui ont su s'adapter à son rythme. En 6 mois, ses notes sont 
                passées de 8/20 à 16/20. Mais surtout, il a retrouvé confiance en lui. Merci Genova !"
              </p>
              <div className="flex items-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-gold to-accent-gold/70 flex items-center justify-center mr-4">
                  <span className="text-white font-bold text-lg">FN</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">Fatou N.</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    Mère d'élève, Yaoundé
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Video Testimonial Placeholder */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center shadow-2xl">
            <div className="max-w-3xl mx-auto">
              <h3 className="text-3xl font-bold text-white mb-4">
                Découvrez plus d'histoires inspirantes
              </h3>
              <p className="text-xl text-white/80 mb-8">
                Chaque semaine, nous partageons de nouvelles histoires de réussite de notre communauté
              </p>
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                Voir toutes les histoires
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary via-primary/90 to-secondary relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-white/20 text-white px-4 py-2 rounded-full mb-8">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Votre avenir commence ici</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
            Prêt à écrire votre histoire de réussite ?
          </h2>
          <p className="text-xl md:text-2xl text-white/95 mb-12 leading-relaxed max-w-3xl mx-auto">
            Rejoignez des milliers d'étudiants et de tuteurs qui transforment leurs rêves en réalité. 
            Votre parcours commence maintenant, et nous serons là à chaque étape.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <Link href="/register?role=student">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-lg px-12 py-8 shadow-2xl hover:shadow-3xl transition-all">
                <div className="flex flex-col items-start">
                  <span className="font-bold">Commencer gratuitement</span>
                  <span className="text-sm opacity-80">1000€ de crédit offert</span>
                </div>
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </Link>
            <Link href="/register?role=tutor">
              <Button size="lg" className="bg-white/10 text-white hover:bg-white/20 border-2 border-white/30 text-lg px-12 py-8 backdrop-blur-sm">
                <div className="flex flex-col items-start">
                  <span className="font-bold">Devenir tuteur</span>
                  <span className="text-sm opacity-80">Partagez votre savoir</span>
                </div>
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/90">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Sans engagement</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Annulation gratuite</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Support 24/7</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Paiement sécurisé</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold">Genova</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
                La plateforme qui démocratise l'accès à une éducation de qualité en Afrique francophone. 
                Ensemble, transformons des vies, une session à la fois.
              </p>
              <div className="flex items-center space-x-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                  <span className="sr-only">Facebook</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                  <span className="sr-only">Instagram</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Plateforme</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#mission" className="hover:text-white transition">Notre Mission</a></li>
                <li><a href="#benefits" className="hover:text-white transition">Avantages</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">Comment ça marche</a></li>
                <li><a href="#stories" className="hover:text-white transition">Histoires</a></li>
                <li><Link href="/register" className="hover:text-white transition">Tarifs</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Ressources</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Guides</a></li>
                <li><a href="#" className="hover:text-white transition">Webinaires</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Entreprise</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition">À propos</a></li>
                <li><a href="#" className="hover:text-white transition">Carrières</a></li>
                <li><a href="#" className="hover:text-white transition">Presse</a></li>
                <li><a href="#" className="hover:text-white transition">Partenaires</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-gray-400 text-sm">
                © 2026 Genova. Tous droits réservés. Fait avec <Heart className="w-4 h-4 inline text-error" /> en Afrique.
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition">Confidentialité</a>
                <a href="#" className="hover:text-white transition">Conditions</a>
                <a href="#" className="hover:text-white transition">Cookies</a>
                <a href="#" className="hover:text-white transition">Mentions légales</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

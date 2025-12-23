# Genova - Application Mobile de Recherche de Tuteurs
## Spécifications Techniques Complètes

---

## 1. Vue d'ensemble du projet

### 1.1 Objectif
Genova est une plateforme mobile de mise en relation entre tuteurs et étudiants, facilitant l'organisation de sessions de tutorat, la gestion financière, le suivi pédagogique et la création de consortiums de tuteurs.

### 1.2 Proposition de valeur
- **Pour les étudiants** : Trouver des tuteurs qualifiés, gérer des sessions en groupe, suivre leurs progrès
- **Pour les tuteurs** : Monétiser leurs compétences, collaborer en consortium, gérer leur planning
- **Pour la plateforme** : Modèle économique basé sur commissions et abonnements

---

## 2. Acteurs du système

### 2.1 Types d'utilisateurs
1. **Étudiant** : Recherche et réserve des sessions de tutorat
2. **Tuteur** : Propose ses services et gère ses sessions
3. **Administrateur de Classe** : Gère un groupe d'étudiants
4. **Consortium** : Groupe de tuteurs travaillant ensemble
5. **Administrateur Plateforme** : Supervise l'ensemble du système

---

## 3. Fonctionnalités principales

### 3.1 Gestion des comptes

#### 3.1.1 Inscription Étudiant
- Informations personnelles (nom, prénom, email, téléphone)
- Niveau scolaire (primaire, collège, lycée, université)
- Matières d'intérêt
- Langue de préférence
- Zone géographique
- Budget disponible

#### 3.1.2 Inscription Tuteur
- Informations personnelles
- Qualifications et diplômes
- Matières enseignées
- Niveaux acceptés (min-max)
- Langues d'enseignement
- Tarifs horaires
- Zones d'intervention
- Disponibilités hebdomadaires
- Portfolio et références
- Validation de documents (diplômes, casier judiciaire si nécessaire)

### 3.2 Système de Classes

#### 3.2.1 Caractéristiques
- **Homogénéité** : Même niveau, même besoin, même période
- **Flexibilité** : Un étudiant peut appartenir à plusieurs classes
- **Capacité** : 1 à N étudiants par classe
- **Administration** : Un créateur/administrateur par classe

#### 3.2.2 Gestion
- Créer une classe (définir niveau, matière, objectif)
- Inviter des étudiants (via email, code de classe)
- Définir l'emploi du temps collectif
- Gérer les membres
- Statistiques de groupe

### 3.3 Matching Tuteur-Classe

#### 3.3.1 Critères de correspondance
```
Matching Score = Σ (Poids × Note)

Critères pondérés :
- Disponibilité horaire (30%)
- Zone géographique (15%)
- Prix (20%)
- Langue (15%)
- Niveau/Programme (10%)
- Évaluations antérieures (10%)
```

#### 3.3.2 Filtres de recherche
- Prix min/max par heure
- Jours et horaires disponibles
- Distance maximale (ou mode en ligne)
- Langue(s) d'enseignement
- Matière spécifique
- Niveau d'études
- Note minimale (étoiles)
- Expérience (années)

#### 3.3.3 Résultats
- Liste triée par score de matching
- Profil détaillé du tuteur
- Calendrier de disponibilité
- Évaluations et commentaires
- Badge et certifications

### 3.4 Consortiums de Tuteurs

#### 3.4.1 Création et gestion
- Nom et description du consortium
- Invitation de tuteurs membres
- Définition des rôles (coordinateur, membre)
- Charte de fonctionnement

#### 3.4.2 Politique de rémunération
- Distribution des revenus entre membres
- Options :
  - Parts égales
  - Proportionnel aux heures effectuées
  - Grille personnalisée (par matière, expérience)
- Gestion du compte collectif

#### 3.4.3 Packages de services
- Forfaits multi-matières
- Tarifs de groupe négociés
- Sessions combinées (plusieurs tuteurs)
- Offres promotionnelles

### 3.5 Planification et réservation

#### 3.5.1 Création d'emploi du temps
- Interface calendrier
- Définir sessions récurrentes ou ponctuelles
- Durée par session (30min, 1h, 1h30, 2h)
- Lieu (adresse physique ou lien visio)
- Notes/préparation requise

#### 3.5.2 Réservation
- Sélection tuteur/consortium
- Confirmation automatique ou validation manuelle
- Notification push/email/SMS
- Ajout au calendrier natif du téléphone

#### 3.5.3 Modification et annulation
- Politique d'annulation (délais, remboursements)
- Reprogrammation facilitée
- Notification à toutes les parties

### 3.6 Système de paiement

#### 3.6.1 Moyens de paiement
- Carte bancaire (Visa, Mastercard)
- Mobile Money (selon région)
- Portefeuille électronique intégré
- Abonnements automatiques

#### 3.6.2 Modèle économique
```
Prix session = Tarif tuteur × Durée

Commission plateforme = 15% du prix session

Abonnement étudiant = 5€/mois
- Accès illimité à la plateforme
- Banque d'épreuves basique
- 1 classe active

Abonnement Premium étudiant = 15€/mois
- Tout de Basic +
- Banque d'épreuves complète
- Classes illimitées
- Support pédagogique prioritaire
- Accès aux ressources premium

Abonnement tuteur = 10€/mois
- Visibilité sur la plateforme
- Gestion de planning
- Statistiques de performance

Abonnement tuteur Pro = 30€/mois
- Tout de Basic +
- Commission réduite à 10%
- Outils marketing (profil vérifié, badge)
- Accès consortium
- Gestion multi-calendrier
```

#### 3.6.3 Traçabilité
- Historique complet des transactions
- Factures automatiques
- Relevés mensuels pour tuteurs
- Gestion de contentieux (remboursements, litiges)

### 3.7 Suivi des sessions

#### 3.7.1 Émargement
- Check-in/Check-out par QR code ou PIN
- Géolocalisation (optionnel, vérification lieu)
- Signature électronique
- Durée effective vs prévue

#### 3.7.2 Présences/Absences
- Tableau de bord pour chaque classe
- Taux de présence par étudiant
- Pénalités pour absences répétées
- Alertes automatiques aux parents (si mineur)

#### 3.7.3 Compte-rendu de session
- Formulaire post-session pour tuteur :
  - Sujets traités
  - Points à améliorer
  - Devoirs donnés
  - Évaluation de l'élève (participation, compréhension)
- Consultation par l'étudiant

### 3.8 Suivi pédagogique

#### 3.8.1 Évaluations
- Tests intégrés dans l'app
- Import de notes externes
- Évolution graphique des résultats
- Comparaison avant/après tutorat

#### 3.8.2 Objectifs et progression
- Définition d'objectifs SMART
- Suivi hebdomadaire/mensuel
- Alertes si baisse de performance
- Rapports pour parents

#### 3.8.3 Tableau de bord analytique
- Pour l'étudiant :
  - Heures de tutorat effectuées
  - Progression par matière
  - Prochaines sessions
  - Badges obtenus
- Pour le tuteur :
  - Nombre d'élèves actifs
  - Revenus mensuels
  - Note moyenne
  - Taux de fidélisation

### 3.9 Gamification

#### 3.9.1 Badges pour étudiants
- **Assidu** : 95%+ de présence sur 1 mois
- **Progressiste** : +10 points en moyenne
- **Élite** : Top 10% de la classe
- **Marathon** : 50 heures de tutorat
- **Multi-matières** : 3+ matières suivies

#### 3.9.2 Badges pour tuteurs
- **Expert Vérifié** : Diplômes validés
- **Pédagogue** : Note 4.5/5+ sur 20 sessions
- **Populaire** : 10+ élèves actifs
- **Mentor** : 100+ heures dispensées
- **Polyglotte** : Enseigne en 3+ langues

#### 3.9.3 Récompenses
- Points de fidélité
- Réductions sur abonnements
- Accès prioritaire à nouveaux tuteurs
- Objets virtuels (avatars, thèmes)

### 3.10 Marketplace & Ressources

#### 3.10.1 Shop de supports
- Annales d'examens
- Livres de cours (PDF)
- Fiches de révision
- Vidéos explicatives
- Prix : 2€ à 20€ par article
- Commission plateforme : 30%

#### 3.10.2 Banque d'épreuves
- Examens blancs par matière/niveau
- Correction automatisée (QCM)
- Correction manuelle (dissertations) - tuteurs rémunérés
- Abonnement : inclus dans Premium ou 5€/mois séparément

#### 3.10.3 Système d'affiliation
- Tuteurs peuvent créer du contenu
- Rémunération à la vente (70/30)
- Validation qualité par la plateforme

---

## 4. Architecture technique

### 4.1 Stack technologique recommandée

#### 4.1.1 Frontend Mobile
```
Framework : React Native / Flutter
- Support iOS et Android depuis une seule codebase
- Performance native
- Librairies :
  - Navigation : React Navigation
  - État global : Redux Toolkit / MobX
  - UI Components : React Native Paper / NativeBase
  - Cartes : react-native-maps
  - Paiements : Stripe SDK
  - Calendrier : react-native-calendars
  - Notifications : Firebase Cloud Messaging
```

#### 4.1.2 Backend
```
Framework : Node.js (Express/NestJS) ou Django/FastAPI
Base de données :
  - PostgreSQL (données relationnelles)
  - Redis (cache, sessions)
  - MongoDB (optionnel pour logs, analytics)

Services :
  - API RESTful ou GraphQL
  - WebSockets (chat temps réel)
  - Queue system (Bull/RabbitMQ) pour tâches asynchrones
```

#### 4.1.3 Infrastructure
```
Hébergement : AWS / Google Cloud / Azure
- EC2/Cloud Run pour le backend
- S3/Cloud Storage pour les fichiers
- CloudFront/CDN pour les assets
- Firebase pour notifications push
- Elasticsearch pour recherche avancée

Monitoring :
- Sentry (erreurs)
- Datadog/New Relic (performance)
- Mixpanel/Amplitude (analytics)
```

### 4.2 Modèle de données

#### 4.2.1 Schéma principal

```sql
-- Utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    birth_date DATE,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(50),
    preferred_language VARCHAR(10),
    role ENUM('student', 'tutor', 'admin'),
    subscription_type ENUM('free', 'basic', 'premium'),
    subscription_expires_at TIMESTAMP,
    wallet_balance DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Profils Étudiants
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    education_level VARCHAR(50),
    school_name VARCHAR(255),
    parent_email VARCHAR(255),
    parent_phone VARCHAR(20),
    learning_goals TEXT,
    preferred_subjects TEXT[],
    budget_per_hour DECIMAL(10,2)
);

-- Profils Tuteurs
CREATE TABLE tutor_profiles (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    experience_years INTEGER,
    hourly_rate DECIMAL(10,2),
    subjects TEXT[],
    education_levels TEXT[],
    languages TEXT[],
    teaching_mode ENUM('in-person', 'online', 'both'),
    service_radius INTEGER, -- km pour in-person
    diplomas JSONB, -- {name, institution, year, verified: bool}
    availability JSONB, -- structure horaire hebdomadaire
    total_hours_taught DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_documents TEXT[]
);

-- Classes
CREATE TABLE classes (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    education_level VARCHAR(50),
    subject VARCHAR(100),
    max_students INTEGER,
    meeting_type ENUM('in-person', 'online'),
    meeting_location TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Membres de Classes
CREATE TABLE class_members (
    id UUID PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(class_id, student_id)
);

-- Consortiums
CREATE TABLE consortiums (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    revenue_distribution_policy JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Membres Consortiums
CREATE TABLE consortium_members (
    id UUID PRIMARY KEY,
    consortium_id UUID REFERENCES consortiums(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role ENUM('coordinator', 'member'),
    revenue_share DECIMAL(5,2), -- pourcentage
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(consortium_id, tutor_id)
);

-- Sessions de Tutorat
CREATE TABLE tutoring_sessions (
    id UUID PRIMARY KEY,
    class_id UUID REFERENCES classes(id),
    tutor_id UUID REFERENCES users(id),
    consortium_id UUID REFERENCES consortiums(id),
    scheduled_start TIMESTAMP NOT NULL,
    scheduled_end TIMESTAMP NOT NULL,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    location TEXT,
    online_meeting_link TEXT,
    subject VARCHAR(100),
    description TEXT,
    price DECIMAL(10,2),
    status ENUM('pending', 'confirmed', 'completed', 'cancelled'),
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Présences
CREATE TABLE attendances (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id),
    status ENUM('present', 'absent', 'late'),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    notes TEXT
);

-- Comptes-rendus de session
CREATE TABLE session_reports (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES tutoring_sessions(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES users(id),
    topics_covered TEXT,
    homework_assigned TEXT,
    student_performance JSONB, -- {student_id: {participation: 1-5, understanding: 1-5}}
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Évaluations
CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES tutoring_sessions(id),
    reviewer_id UUID REFERENCES users(id), -- étudiant ou tuteur
    reviewee_id UUID REFERENCES users(id), -- tuteur ou étudiant
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES tutoring_sessions(id),
    payer_id UUID REFERENCES users(id),
    payee_id UUID REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2),
    net_amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    payment_provider_id VARCHAR(255),
    status ENUM('pending', 'completed', 'failed', 'refunded'),
    transaction_type ENUM('session_payment', 'subscription', 'shop_purchase'),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Badges
CREATE TABLE badges (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    category ENUM('student', 'tutor', 'both'),
    criteria JSONB -- condition d'obtention
);

-- Attribution de badges
CREATE TABLE user_badges (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id),
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Résultats académiques
CREATE TABLE academic_results (
    id UUID PRIMARY KEY,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(100),
    exam_name VARCHAR(255),
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    exam_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Shop - Produits
CREATE TABLE shop_products (
    id UUID PRIMARY KEY,
    seller_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    product_type ENUM('book', 'exam', 'flashcards', 'video', 'other'),
    subject VARCHAR(100),
    education_level VARCHAR(50),
    price DECIMAL(10,2),
    file_url TEXT,
    preview_url TEXT,
    downloads_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Achats Shop
CREATE TABLE shop_purchases (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES shop_products(id),
    buyer_id UUID REFERENCES users(id),
    amount_paid DECIMAL(10,2),
    transaction_id UUID REFERENCES transactions(id),
    purchased_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.3 API Endpoints (exemples)

#### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/forgot-password` - Mot de passe oublié

#### Utilisateurs
- `GET /api/users/me` - Profil utilisateur
- `PUT /api/users/me` - Modifier profil
- `POST /api/users/me/avatar` - Upload avatar

#### Tuteurs
- `GET /api/tutors` - Liste tuteurs (avec filtres)
- `GET /api/tutors/:id` - Détails tuteur
- `POST /api/tutors` - Créer profil tuteur
- `PUT /api/tutors/:id/availability` - Modifier disponibilité

#### Classes
- `POST /api/classes` - Créer classe
- `GET /api/classes/:id` - Détails classe
- `POST /api/classes/:id/members` - Ajouter membre
- `DELETE /api/classes/:id/members/:studentId` - Retirer membre
- `GET /api/classes/:id/schedule` - Emploi du temps

#### Sessions
- `POST /api/sessions` - Créer session
- `GET /api/sessions/:id` - Détails session
- `PUT /api/sessions/:id/status` - Modifier statut
- `POST /api/sessions/:id/attendance` - Émarger
- `POST /api/sessions/:id/report` - Compte-rendu

#### Paiements
- `POST /api/payments/create-intent` - Intent de paiement
- `POST /api/payments/confirm` - Confirmer paiement
- `GET /api/payments/history` - Historique

#### Shop
- `GET /api/shop/products` - Liste produits
- `POST /api/shop/products` - Créer produit
- `POST /api/shop/purchase` - Acheter produit

---

## 5. Sécurité et conformité

### 5.1 Authentification et autorisation
- JWT tokens (access + refresh)
- OAuth2 pour connexion sociale
- 2FA optionnelle (SMS, Authenticator)
- Rôles et permissions granulaires

### 5.2 Protection des données
- Chiffrement des données sensibles (RGPD)
- Conformité PCI-DSS pour paiements
- Politique de confidentialité claire
- Droit à l'oubli (suppression compte)
- Export de données utilisateur

### 5.3 Sécurité mineurs
- Validation âge à l'inscription
- Consentement parental requis (<18 ans)
- Vérification des tuteurs (casier judiciaire)
- Modération des contenus
- Signalement d'abus

---

## 6. Roadmap de développement

### Phase 1 - MVP (3-4 mois)
- Inscription/Connexion utilisateurs
- Profils étudiants et tuteurs basiques
- Recherche et matching simple
- Réservation de sessions
- Paiement intégré
- Notifications push

### Phase 2 - Fonctionnalités avancées (2-3 mois)
- Système de classes
- Suivi présences/absences
- Évaluations et notes
- Tableau de bord analytique
- Gamification (badges)

### Phase 3 - Écosystème (2-3 mois)
- Consortiums de tuteurs
- Marketplace de ressources
- Banque d'épreuves
- Système d'abonnements multi-niveaux

### Phase 4 - Optimisation (continu)
- Machine Learning (recommandations)
- Chat intégré
- Visioconférence native
- App web (PWA)
- Localisation multi-pays

---

## 7. KPIs et métriques

### 7.1 Métriques business
- Nombre d'utilisateurs actifs (DAU, MAU)
- Taux de conversion inscription → réservation
- Revenus par utilisateur (ARPU)
- Taux de rétention (30j, 90j)
- Taux de désabonnement (churn)
- GMV (Gross Merchandise Value)

### 7.2 Métriques produit
- Temps moyen de recherche d'un tuteur
- Taux de matching réussi
- Taux de complétion des sessions
- Note moyenne tuteurs/étudiants
- Taux d'utilisation des ressources (shop, banque d'épreuves)

### 7.3 Métriques techniques
- Disponibilité de l'app (uptime)
- Temps de réponse API
- Taux d'erreur
- Crash rate

---

## 8. Différenciation et avantages compétitifs

1. **Approche collective** : Système de classes unique
2. **Consortiums** : Collaboration entre tuteurs, rare sur le marché
3. **Suivi pédagogique approfondi** : Progression mesurable
4. **Gamification** : Engagement utilisateurs
5. **Écosystème complet** : Tutorat + ressources + examens
6. **Transparence financière** : Traçabilité totale

---

## 9. Risques et mitigation

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Tuteurs non qualifiés | Élevé | Moyen | Vérification diplômes + système d'évaluation |
| Fraude paiements | Élevé | Faible | Paiement via Stripe, 2FA |
| Faible adoption | Élevé | Moyen | Marketing ciblé, onboarding simplifié |
| Abus sur mineurs | Critique | Faible | Vérification tuteurs, signalements, modération |
| Problèmes de scalabilité | Moyen | Moyen | Architecture cloud, load balancing |

---

## 10. Budget estimatif (MVP)

### Développement
- Développeurs mobile (2) : 60 000€
- Développeur backend (1) : 35 000€
- Designer UX/UI (1) : 20 000€
- Product Manager (0.5) : 15 000€
**Total dev : 130 000€**

### Infrastructure (an 1)
- Hébergement cloud : 6 000€
- Services tiers (Stripe, Firebase, etc.) : 4 000€
**Total infra : 10 000€**

### Marketing & Légal
- Marketing lancement : 20 000€
- Juridique (CGU, RGPD) : 5 000€
**Total : 25 000€**

**TOTAL MVP : 165 000€**

---

## 11. Conclusion

Genova est une solution complète et innovante répondant aux besoins du marché du tutorat. Son approche collaborative (classes, consortiums) et son écosystème intégré (ressources, suivi pédagogique) en font une plateforme différenciée avec un fort potentiel de croissance.

La réussite repose sur :
- Une expérience utilisateur fluide
- La qualité et vérification des tuteurs
- Un modèle économique équilibré
- Un déploiement progressif des fonctionnalités
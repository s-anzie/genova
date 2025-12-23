# Genova - Architecture Système
## Diagrammes et Schémas Techniques

---

## 1. Architecture Globale du Système

```mermaid
graph TB
    subgraph "Frontend Mobile"
        iOS[iOS App<br/>React Native]
        Android[Android App<br/>React Native]
    end
    
    subgraph "API Gateway"
        Gateway[API Gateway<br/>Load Balancer]
    end
    
    subgraph "Services Backend"
        Auth[Service<br/>Authentification]
        User[Service<br/>Utilisateurs]
        Tutor[Service<br/>Tuteurs]
        Class[Service<br/>Classes]
        Session[Service<br/>Sessions]
        Payment[Service<br/>Paiements]
        Shop[Service<br/>Shop]
        Notif[Service<br/>Notifications]
    end
    
    subgraph "Bases de Données"
        PG[(PostgreSQL<br/>Données principales)]
        Redis[(Redis<br/>Cache/Sessions)]
        Elastic[(Elasticsearch<br/>Recherche)]
    end
    
    subgraph "Services Externes"
        Stripe[Stripe<br/>Paiements]
        FCM[Firebase<br/>Notifications]
        S3[AWS S3<br/>Fichiers]
        Maps[Google Maps<br/>Géolocalisation]
    end
    
    iOS --> Gateway
    Android --> Gateway
    Gateway --> Auth
    Gateway --> User
    Gateway --> Tutor
    Gateway --> Class
    Gateway --> Session
    Gateway --> Payment
    Gateway --> Shop
    Gateway --> Notif
    
    Auth --> PG
    Auth --> Redis
    User --> PG
    Tutor --> PG
    Tutor --> Elastic
    Class --> PG
    Session --> PG
    Payment --> PG
    Payment --> Stripe
    Shop --> PG
    Shop --> S3
    Notif --> FCM
    Notif --> Redis
    
    Tutor --> Maps
    Class --> Maps
```

---

## 2. Flux d'Inscription et Matching

```mermaid
sequenceDiagram
    participant E as Étudiant
    participant App as Application
    participant API as API Backend
    participant DB as Base de Données
    participant ES as Elasticsearch
    
    E->>App: Inscription + Profil
    App->>API: POST /auth/register
    API->>DB: Créer user + student_profile
    DB-->>API: Confirmation
    API-->>App: Token JWT
    
    E->>App: Créer/Rejoindre Classe
    App->>API: POST /classes
    API->>DB: Créer classe + ajouter membre
    DB-->>API: Classe créée
    
    E->>App: Définir emploi du temps
    App->>API: POST /classes/:id/schedule
    API->>DB: Enregistrer planning
    
    E->>App: Rechercher tuteur
    App->>API: GET /tutors?filters
    API->>ES: Requête avec critères matching
    ES->>DB: Enrichir données
    DB-->>ES: Profils complets
    ES-->>API: Liste tuteurs triés
    API-->>App: Résultats matching
    App-->>E: Affichage tuteurs
```

---

## 3. Flux de Réservation et Paiement

```mermaid
sequenceDiagram
    participant E as Étudiant
    participant App as Application
    participant API as API Backend
    participant DB as Base de Données
    participant Stripe as Stripe
    
    E->>App: Sélectionner tuteur + horaires
    App->>API: POST /sessions
    API->>DB: Créer session (status: pending)
    DB-->>API: Session ID
    
    API->>Stripe: Créer Payment Intent
    Stripe-->>API: Client Secret
    API-->>App: Session + Client Secret
    
    App->>E: Formulaire paiement
    E->>App: Confirmer paiement
    App->>Stripe: Confirmer Payment Intent
    Stripe-->>App: Paiement réussi
    
    App->>API: PUT /sessions/:id/status (confirmed)
    API->>DB: Mettre à jour session
    API->>DB: Créer transaction
    API-->>App: Confirmation
    
    API->>Notif: Envoyer notifications
    Notif-->>E: Push notification
    Notif-->>Tuteur: Push notification
```

---

## 4. Diagramme de Classes (Modèle de Données)

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +String password_hash
        +String first_name
        +String last_name
        +String role
        +String subscription_type
        +Decimal wallet_balance
        +register()
        +login()
        +updateProfile()
    }
    
    class StudentProfile {
        +UUID id
        +UUID user_id
        +String education_level
        +String school_name
        +Array preferred_subjects
        +Decimal budget_per_hour
    }
    
    class TutorProfile {
        +UUID id
        +UUID user_id
        +String bio
        +Integer experience_years
        +Decimal hourly_rate
        +Array subjects
        +Array languages
        +JSON availability
        +Decimal average_rating
        +Boolean is_verified
    }
    
    class Class {
        +UUID id
        +String name
        +String description
        +UUID created_by
        +String education_level
        +String subject
        +addMember()
        +removeMember()
        +updateSchedule()
    }
    
    class ClassMember {
        +UUID id
        +UUID class_id
        +UUID student_id
        +DateTime joined_at
    }
    
    class Consortium {
        +UUID id
        +String name
        +UUID created_by
        +JSON revenue_distribution_policy
        +addMember()
        +updatePolicy()
    }
    
    class TutoringSession {
        +UUID id
        +UUID class_id
        +UUID tutor_id
        +DateTime scheduled_start
        +DateTime scheduled_end
        +Decimal price
        +String status
        +confirm()
        +cancel()
        +complete()
    }
    
    class Attendance {
        +UUID id
        +UUID session_id
        +UUID student_id
        +String status
        +DateTime check_in_time
        +checkIn()
        +checkOut()
    }
    
    class Transaction {
        +UUID id
        +UUID session_id
        +UUID payer_id
        +UUID payee_id
        +Decimal amount
        +Decimal platform_fee
        +String status
        +process()
        +refund()
    }
    
    class Review {
        +UUID id
        +UUID session_id
        +UUID reviewer_id
        +UUID reviewee_id
        +Integer rating
        +String comment
    }
    
    class Badge {
        +UUID id
        +String name
        +String description
        +String category
        +JSON criteria
    }
    
    User "1" --> "1" StudentProfile : has
    User "1" --> "1" TutorProfile : has
    User "1" --> "*" Class : creates
    Class "1" --> "*" ClassMember : contains
    ClassMember "*" --> "1" User : student
    User "*" --> "*" Consortium : member of
    Class "1" --> "*" TutoringSession : has
    TutoringSession "*" --> "1" User : tutor
    TutoringSession "1" --> "*" Attendance : tracks
    TutoringSession "1" --> "*" Transaction : generates
    TutoringSession "1" --> "*" Review : receives
    User "*" --> "*" Badge : earns
```

---

## 5. Architecture des Services (Microservices)

```mermaid
graph LR
    subgraph "Service Authentification"
        A1[Register]
        A2[Login]
        A3[JWT Validation]
        A4[Password Reset]
    end
    
    subgraph "Service Utilisateurs"
        U1[Profils]
        U2[Avatar Upload]
        U3[Préférences]
    end
    
    subgraph "Service Tuteurs"
        T1[Recherche/Matching]
        T2[Disponibilités]
        T3[Vérification]
        T4[Statistiques]
    end
    
    subgraph "Service Classes"
        C1[CRUD Classes]
        C2[Gestion Membres]
        C3[Emploi du temps]
    end
    
    subgraph "Service Sessions"
        S1[Réservation]
        S2[Émargement]
        S3[Comptes-rendus]
        S4[Annulation]
    end
    
    subgraph "Service Paiements"
        P1[Intent Paiement]
        P2[Confirmation]
        P3[Remboursement]
        P4[Historique]
    end
    
    subgraph "Service Gamification"
        G1[Attribution Badges]
        G2[Points Fidélité]
        G3[Classements]
    end
    
    subgraph "Service Notifications"
        N1[Push Notifications]
        N2[Email]
        N3[SMS]
    end
```

---

## 6. Flux de Matching Tuteur (Algorithme)

```mermaid
flowchart TD
    Start[Requête de recherche] --> GetCriteria[Récupérer critères:<br/>- Horaires<br/>- Prix<br/>- Zone<br/>- Matière<br/>- Niveau]
    GetCriteria --> QueryES[Requête Elasticsearch]
    
    QueryES --> Filter1{Filtres durs}
    Filter1 --> |Zone| FilterZone[Distance < X km<br/>OU Mode online]
    Filter1 --> |Langue| FilterLang[Langue compatible]
    Filter1 --> |Dispo| FilterDispo[Horaires disponibles]
    
    FilterZone --> FilterLang
    FilterLang --> FilterDispo
    FilterDispo --> Candidates[Liste candidats]
    
    Candidates --> Score[Calcul score matching]
    Score --> ScorePrice[Score prix:<br/>Plus proche budget = +20]
    Score --> ScoreRating[Score notation:<br/>4.5+ étoiles = +10]
    Score --> ScoreExp[Score expérience:<br/>+2 par année]
    Score --> ScoreAvail[Score disponibilité:<br/>100% match = +30]
    
    ScorePrice --> Aggregate
    ScoreRating --> Aggregate
    ScoreExp --> Aggregate
    ScoreAvail --> Aggregate
    
    Aggregate[Score total] --> Sort[Trier par score DESC]
    Sort --> Limit[Top 20 résultats]
    Limit --> Return[Retourner liste]
    Return --> End[Affichage à l'utilisateur]
```

---

## 7. Flux de Gamification

```mermaid
stateDiagram-v2
    [*] --> EventDetection: Action utilisateur
    
    EventDetection --> CheckCriteria: Session complétée
    EventDetection --> CheckCriteria: Note ajoutée
    EventDetection --> CheckCriteria: X heures atteintes
    EventDetection --> CheckCriteria: Présence continue
    
    CheckCriteria --> EvaluateBadge: Récupérer critères badges
    
    EvaluateBadge --> Badge1: Assidu (95% présence)
    EvaluateBadge --> Badge2: Marathon (50h)
    EvaluateBadge --> Badge3: Top Student (Top 10%)
    EvaluateBadge --> Badge4: Expert (Note 4.5+)
    
    Badge1 --> Award: Critère rempli
    Badge2 --> Award
    Badge3 --> Award
    Badge4 --> Award
    
    Award --> UpdateUser: Ajouter badge
    UpdateUser --> SendNotif: Notification "Badge obtenu"
    SendNotif --> UpdatePoints: +100 points fidélité
    UpdatePoints --> [*]
    
    EvaluateBadge --> NoMatch: Critère non rempli
    NoMatch --> [*]
```

---

## 8. Architecture de Sécurité

```mermaid
graph TB
    subgraph "Couche Utilisateur"
        Mobile[Application Mobile]
    end
    
    subgraph "Sécurité Réseau"
        WAF[Web Application Firewall]
        DDoS[Protection DDoS]
        SSL[SSL/TLS Encryption]
    end
    
    subgraph "Authentification"
        JWT[JWT Tokens]
        OAuth[OAuth2 / SSO]
        MFA[2FA Authentication]
    end
    
    subgraph "Authorization"
        RBAC[Role-Based Access Control]
        Policies[Permission Policies]
    end
    
    subgraph "Données"
        Encrypt[Encryption at Rest]
        Mask[Data Masking]
        Audit[Audit Logs]
    end
    
    subgraph "Paiements"
        PCI[PCI-DSS Compliance]
        Tokenization[Card Tokenization]
    end
    
    Mobile --> SSL
    SSL --> WAF
    WAF --> DDoS
    DDoS --> JWT
    JWT --> OAuth
    OAuth --> MFA
    MFA --> RBAC
    RBAC --> Policies
    Policies --> Encrypt
    Encrypt --> Mask
    Mask --> Audit
    
    Policies --> PCI
    PCI --> Tokenization
```

---

## 9. Infrastructure Cloud (AWS)

```mermaid
graph TB
    subgraph "Zone de Disponibilité 1"
        ALB1[Application<br/>Load Balancer]
        EC2_1A[EC2 Instance<br/>API Server]
        EC2_1B[EC2 Instance<br/>API Server]
        RDS_1[RDS Primary<br/>PostgreSQL]
    end
    
    subgraph "Zone de Disponibilité 2"
        EC2_2A[EC2 Instance<br/>API Server]
        EC2_2B[EC2 Instance<br/>API Server]
        RDS_2[RDS Replica<br/>PostgreSQL]
    end
    
    subgraph "Services Partagés"
        S3[S3 Bucket<br/>Fichiers statiques]
        CloudFront[CloudFront CDN]
        ElastiCache[ElastiCache<br/>Redis]
        ES[Amazon<br/>Elasticsearch]
        SQS[SQS Queue<br/>Jobs async]
    end
    
    Internet[Internet] --> Route53[Route 53 DNS]
    Route53 --> CloudFront
    CloudFront --> ALB1
    
    ALB1 --> EC2_1A
    ALB1 --> EC2_1B
    ALB1 --> EC2_2A
    ALB1 --> EC2_2B
    
    EC2_1A --> RDS_1
    EC2_1B --> RDS_1
    EC2_2A --> RDS_2
    EC2_2B --> RDS_2
    
    RDS_1 -.Replication.-> RDS_2
    
    EC2_1A --> ElastiCache
    EC2_1B --> ElastiCache
    EC2_2A --> ElastiCache
    EC2_2B --> ElastiCache
    
    EC2_1A --> ES
    EC2_2A --> ES
    
    EC2_1A --> S3
    EC2_1B --> S3
    CloudFront --> S3
    
    EC2_1A --> SQS
    EC2_2A --> SQS
```

---

## 10. Pipeline CI/CD

```mermaid
flowchart LR
    Dev[Developer] --> Git[Git Push]
    Git --> GitHub[GitHub Repository]
    
    GitHub --> Trigger[GitHub Actions<br/>Trigger]
    
    Trigger --> Lint[Linting]
    Trigger --> Test[Unit Tests]
    Trigger --> Security[Security Scan]
    
    Lint --> Build{Build Success?}
    Test --> Build
    Security --> Build
    
    Build --> |No| Fail[Build Failed<br/>Notify Dev]
    Fail --> Dev
    
    Build --> |Yes| Docker[Build Docker Image]
    Docker --> ECR[Push to AWS ECR]
    
    ECR --> Deploy{Environment}
    
    Deploy --> |Dev| DeployDev[Deploy to Dev<br/>Auto]
    Deploy --> |Staging| DeployStaging[Deploy to Staging<br/>Manual Approval]
    Deploy --> |Prod| DeployProd[Deploy to Prod<br/>Manual Approval]
    
    DeployDev --> Verify[Health Check]
    DeployStaging --> Verify
    DeployProd --> Verify
    
    Verify --> |Success| Notify[Notify Slack]
    Verify --> |Failure| Rollback[Auto Rollback]
    Rollback --> Notify
```

---

## 11. Stratégie de Monitoring

```mermaid
graph TB
    subgraph "Logs"
        AppLogs[Application Logs]
        AccessLogs[Access Logs]
        ErrorLogs[Error Logs]
    end
    
    subgraph "Métriques"
        APIMetrics[API Response Time]
        DBMetrics[DB Performance]
        CacheMetrics[Cache Hit Rate]
        BusinessMetrics[Business KPIs]
    end
    
    subgraph "Alertes"
        ErrorRate[Error Rate > 5%]
        Latency[Latency > 500ms]
        Downtime[Service Down]
        Payment[Payment Failures]
    end
    
    subgraph "Outils"
        CloudWatch[AWS CloudWatch]
        Datadog[Datadog]
        Sentry[Sentry]
        Grafana[Grafana]
    end
    
    subgraph "Notifications"
        Slack[Slack]
        PagerDuty[PagerDuty]
        Email[Email]
    end
    
    AppLogs --> CloudWatch
    AccessLogs --> CloudWatch
    ErrorLogs --> Sentry
    
    APIMetrics --> Datadog
    DBMetrics --> Datadog
    CacheMetrics --> Datadog
    BusinessMetrics --> Grafana
    
    CloudWatch --> ErrorRate
    Datadog --> Latency
    Datadog --> Downtime
    Sentry --> Payment
    
    ErrorRate --> Slack
    Latency --> Slack
    Downtime --> PagerDuty
    Payment --> Email
```

---

## 12. Stratégie de Scalabilité

```mermaid
graph LR
    subgraph "Horizontal Scaling"
        LB[Load Balancer]
        API1[API Server 1]
        API2[API Server 2]
        API3[API Server N]
        
        LB --> API1
        LB --> API2
        LB --> API3
    end
    
    subgraph "Database Scaling"
        Primary[(Primary DB<br/>Write)]
        Replica1[(Replica 1<br/>Read)]
        Replica2[(Replica 2<br/>Read)]
        
        Primary -.Replication.-> Replica1
        Primary -.Replication.-> Replica2
    end
    
    subgraph "Caching Strategy"
        Redis1[(Redis Master)]
        Redis2[(Redis Replica)]
        
        Redis1 -.-> Redis2
    end
    
    subgraph "CDN"
        CloudFront[CloudFront<br/>Static Assets]
    end
    
    API1 --> Primary
    API2 --> Replica1
    API3 --> Replica2
    
    API1 --> Redis1
    API2 --> Redis1
    API3 --> Redis2
    
    API1 --> CloudFront
```

---

Ce document présente l'architecture technique complète de Genova avec tous les diagrammes nécessaires pour comprendre le système, ses flux de données, sa sécurité et sa scalabilité.
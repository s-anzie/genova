# Requirements Document

## Introduction

L'application mobile Genova doit afficher tous les montants en FCFA (Franc CFA) pour les utilisateurs, alors que l'API backend renvoie les montants en euros. Cette fonctionnalité nécessite une conversion systématique et cohérente de tous les montants affichés dans l'application mobile.

## Glossary

- **API**: Le backend qui renvoie les données en euros
- **Mobile_App**: L'application mobile React Native/Expo qui affiche les données
- **FCFA**: Franc CFA, la devise d'affichage souhaitée (1 EUR = 655.957 FCFA, taux fixe)
- **EUR**: Euro, la devise utilisée par l'API
- **Currency_Converter**: Utilitaire de conversion entre EUR et FCFA
- **Display_Amount**: Montant formaté pour l'affichage à l'utilisateur
- **API_Amount**: Montant brut reçu de l'API en euros

## Requirements

### Requirement 1: Conversion des montants de l'API

**User Story:** En tant qu'utilisateur de l'application mobile, je veux voir tous les montants en FCFA, afin que les prix soient dans ma devise locale.

#### Acceptance Criteria

1. WHEN THE Mobile_App reçoit un montant de l'API, THE Currency_Converter SHALL convertir le montant de EUR vers FCFA en utilisant le taux de change fixe
2. THE Currency_Converter SHALL utiliser le taux de conversion 1 EUR = 655.957 FCFA
3. WHEN un montant est converti, THE Currency_Converter SHALL arrondir le résultat à l'entier le plus proche
4. THE Mobile_App SHALL afficher tous les montants avec le symbole "FCFA" après le montant

### Requirement 2: Affichage cohérent dans le Wallet

**User Story:** En tant qu'utilisateur (étudiant ou tuteur), je veux voir mon solde et mes transactions en FCFA, afin de comprendre mes finances dans ma devise locale.

#### Acceptance Criteria

1. WHEN THE Mobile_App affiche le solde du wallet, THE Display_Amount SHALL être en FCFA
2. WHEN THE Mobile_App affiche l'historique des transactions, THE Display_Amount SHALL être en FCFA pour chaque transaction
3. WHEN un étudiant ajoute des fonds, THE Mobile_App SHALL afficher les montants minimum et maximum en FCFA
4. WHEN un tuteur effectue un retrait, THE Mobile_App SHALL afficher le montant minimum et le solde disponible en FCFA

### Requirement 3: Affichage des tarifs et prix de sessions

**User Story:** En tant qu'étudiant, je veux voir les tarifs des tuteurs et le prix des sessions en FCFA, afin de comprendre combien je vais payer dans ma devise locale.

#### Acceptance Criteria

1. WHEN THE Mobile_App affiche le profil d'un tuteur, THE Display_Amount SHALL afficher le tarif horaire en FCFA/h
2. WHEN THE Mobile_App affiche les détails d'une session, THE Display_Amount SHALL afficher le prix total en FCFA
3. WHEN un étudiant recherche des tuteurs, THE Display_Amount SHALL afficher tous les tarifs en FCFA/h
4. WHEN THE Mobile_App affiche une demande d'assignation, THE Display_Amount SHALL afficher le prix en FCFA

### Requirement 4: Conversion inverse pour les requêtes API

**User Story:** En tant que développeur, je veux que les montants saisis par l'utilisateur soient convertis en euros avant d'être envoyés à l'API, afin que le backend reçoive toujours des montants en euros.

#### Acceptance Criteria

1. WHEN un utilisateur saisit un montant en FCFA, THE Currency_Converter SHALL convertir le montant de FCFA vers EUR avant l'envoi à l'API
2. WHEN un étudiant ajoute des fonds, THE Mobile_App SHALL envoyer le montant en EUR à l'API
3. WHEN un tuteur effectue un retrait, THE Mobile_App SHALL envoyer le montant en EUR à l'API
4. THE Currency_Converter SHALL arrondir les montants EUR à 2 décimales avant l'envoi à l'API

### Requirement 5: Validation des montants minimum

**User Story:** En tant qu'utilisateur, je veux que les montants minimum soient validés en FCFA, afin de comprendre les limites dans ma devise locale.

#### Acceptance Criteria

1. WHEN un étudiant ajoute des fonds, THE Mobile_App SHALL valider que le montant est au minimum 500 FCFA (équivalent à ~0.76 EUR)
2. WHEN un tuteur effectue un retrait, THE Mobile_App SHALL valider que le montant est au minimum 1000 FCFA (équivalent à ~1.52 EUR)
3. IF un montant saisi est inférieur au minimum, THEN THE Mobile_App SHALL afficher un message d'erreur avec le montant minimum en FCFA
4. THE Mobile_App SHALL effectuer la validation côté client avant d'envoyer la requête à l'API

### Requirement 6: Affichage des gains et revenus (Tuteurs)

**User Story:** En tant que tuteur, je veux voir mes gains et revenus en FCFA, afin de suivre mes finances dans ma devise locale.

#### Acceptance Criteria

1. WHEN THE Mobile_App affiche le tableau de bord du tuteur, THE Display_Amount SHALL afficher les gains totaux en FCFA
2. WHEN THE Mobile_App affiche les détails des gains, THE Display_Amount SHALL afficher chaque montant en FCFA
3. WHEN THE Mobile_App affiche l'historique des paiements, THE Display_Amount SHALL afficher les montants en FCFA

### Requirement 7: Utilitaire de conversion centralisé

**User Story:** En tant que développeur, je veux un utilitaire centralisé pour la conversion de devises, afin de garantir la cohérence à travers toute l'application.

#### Acceptance Criteria

1. THE Currency_Converter SHALL fournir une fonction pour convertir EUR vers FCFA
2. THE Currency_Converter SHALL fournir une fonction pour convertir FCFA vers EUR
3. THE Currency_Converter SHALL fournir une fonction pour formater un montant en FCFA avec le symbole
4. THE Currency_Converter SHALL être utilisé dans tous les composants qui affichent des montants
5. THE Currency_Converter SHALL utiliser un taux de change constant défini dans un fichier de configuration

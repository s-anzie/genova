# Système de Rafraîchissement Automatique des Tokens

## Vue d'ensemble

Le système implémente un mécanisme de rafraîchissement automatique des tokens d'authentification avec déconnexion automatique en cas d'échec.

## Fonctionnement

### 1. Stockage des Tokens

Lors de la connexion, deux tokens sont stockés dans le localStorage :
- `token` : Access token (courte durée de vie)
- `refreshToken` : Refresh token (longue durée de vie)

### 2. Intercepteur de Requêtes

Toutes les requêtes API incluent automatiquement l'access token dans le header `Authorization`.

### 3. Intercepteur de Réponses (Gestion 401)

Lorsqu'une requête reçoit une erreur 401 (Unauthorized) :

1. **Vérification** : Le système vérifie si un refresh est déjà en cours
2. **File d'attente** : Si oui, la requête est mise en file d'attente
3. **Tentative de refresh** : Si non, le système tente de rafraîchir le token :
   - Appel à `/api/auth/refresh` avec le refresh token
   - Si succès : 
     - Sauvegarde des nouveaux tokens
     - Mise à jour du header Authorization
     - Traitement de toutes les requêtes en file d'attente
     - Réessai de la requête originale
   - Si échec :
     - Nettoyage du localStorage
     - Redirection automatique vers `/login`

### 4. Déconnexion Automatique

En cas d'échec du rafraîchissement :
- Suppression de tous les tokens du localStorage
- Redirection immédiate vers la page de login
- Aucune intervention utilisateur requise

## Avantages

✅ **Expérience utilisateur fluide** : Pas d'interruption visible lors du refresh
✅ **Sécurité renforcée** : Tokens à courte durée de vie
✅ **Gestion automatique** : Aucune action manuelle requise
✅ **File d'attente intelligente** : Évite les appels multiples au endpoint de refresh
✅ **Déconnexion propre** : Nettoyage complet en cas d'échec

## Flux de Données

```
Requête API → 401 Unauthorized
    ↓
Refresh token existe ?
    ↓ Oui
Appel /api/auth/refresh
    ↓
Succès ?
    ↓ Oui                    ↓ Non
Nouveaux tokens          Logout automatique
    ↓                         ↓
Réessai requête          Redirection /login
    ↓
Succès ✓
```

## Implémentation

### Frontend (apps/web/lib/api.ts)

- Intercepteur Axios pour gérer les erreurs 401
- File d'attente pour les requêtes pendant le refresh
- Méthodes privées pour gérer les tokens
- Redirection automatique en cas d'échec

### Backend (apps/api/src/routes/auth.routes.ts)

- Endpoint `/api/auth/refresh` pour rafraîchir les tokens
- Endpoint `/api/auth/logout` pour révoquer les tokens
- Validation des refresh tokens

## Configuration

Aucune configuration supplémentaire requise. Le système fonctionne automatiquement dès que :
1. L'utilisateur se connecte
2. Les tokens sont stockés dans le localStorage
3. Les requêtes API utilisent le client Axios configuré

## Sécurité

- Les tokens ne sont jamais exposés dans l'URL
- Le refresh token est stocké de manière sécurisée
- Déconnexion automatique en cas de token invalide
- Nettoyage complet du localStorage lors de la déconnexion

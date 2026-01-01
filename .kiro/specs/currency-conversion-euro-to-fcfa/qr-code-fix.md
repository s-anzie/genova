# Fix du Scan QR Code - Système de Présence

## Date: 27 Décembre 2025

## Problème Identifié

Le scan du QR code ne fonctionnait pas correctement pour l'enregistrement des présences des étudiants.

## Causes Possibles

1. **Gestion des scans multiples**: Le scanner pouvait déclencher plusieurs fois le même scan
2. **Format de la méthode**: La méthode envoyée à l'API n'était pas cohérente (majuscules vs minuscules)
3. **État du scanner**: Le scanner n'était pas correctement désactivé après un scan réussi

## Solutions Implémentées

### 1. Ajout d'un État `scanned`

```typescript
const [scanned, setScanned] = useState(false);
```

Cet état empêche les scans multiples du même QR code.

### 2. Protection Contre les Scans Multiples

```typescript
const handleBarCodeScanned = async ({ data }: { data: string }) => {
  if (scanned || !scanning) {
    return; // Prevent multiple scans
  }
  
  setScanned(true);
  // ... reste du code
}
```

### 3. Désactivation du Scanner Après Scan

```typescript
<CameraView
  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
  // ... autres props
/>
```

Quand `scanned` est `true`, le scanner est désactivé.

### 4. Normalisation du Format de la Méthode

Changé de:
```typescript
method: 'QR'  // Majuscules
method: 'PIN' // Majuscules
```

À:
```typescript
method: 'qr'  // Minuscules
method: 'pin' // Minuscules
```

Pour correspondre au format attendu par l'API backend.

### 5. Réinitialisation de l'État

```typescript
const handleQRScan = async () => {
  // ... vérification des permissions
  
  setScanned(false); // Réinitialiser avant d'ouvrir le scanner
  setScanning(true);
};
```

## Flux de Fonctionnement Corrigé

### Côté Tuteur (Génération du QR Code)

1. Le tuteur ouvre la page de gestion des présences
2. Il choisit la méthode "QR Code"
3. L'API génère un hash unique (16 caractères) valide 5 minutes
4. Ce hash est affiché sous forme de QR code avec `react-native-qrcode-svg`
5. Le QR code se régénère automatiquement après expiration

### Côté Étudiant (Scan du QR Code)

1. L'étudiant ouvre la page de check-in
2. Il choisit la méthode "Scanner QR"
3. Il clique sur "Ouvrir le scanner"
4. Les permissions de caméra sont vérifiées/demandées
5. La caméra s'ouvre avec un cadre de scan
6. L'étudiant positionne le QR code dans le cadre
7. **Le scanner lit le hash du QR code**
8. **Le scan est immédiatement désactivé** (évite les scans multiples)
9. Le hash est envoyé à l'API avec `method: 'qr'`
10. L'API vérifie:
    - Le code existe dans le cache
    - Le code n'a pas expiré
    - Le code correspond à la session
11. Si valide: Présence enregistrée ✅
12. Si invalide: Message d'erreur ❌

## Vérifications Backend

Le backend vérifie dans `attendance.service.ts`:

```typescript
async function verifyCheckInCode(
  sessionId: string,
  code: string,
  method: 'qr' | 'pin'
): Promise<boolean> {
  const key = `${sessionId}:${method}`;
  const storedCode = checkInCodes.get(key);
  
  if (!storedCode) {
    return false; // Code n'existe pas
  }
  
  // Vérifier l'expiration
  const now = new Date();
  if (storedCode.expiresAt < now) {
    checkInCodes.delete(key);
    return false; // Code expiré
  }
  
  // Vérifier la correspondance
  if (storedCode.code !== code) {
    return false; // Code incorrect
  }
  
  return true; // Code valide ✅
}
```

## Tests Recommandés

### Test 1: Scan QR Code Valide
1. Tuteur génère un QR code
2. Étudiant scanne le QR code dans les 5 minutes
3. ✅ Présence enregistrée

### Test 2: Scan QR Code Expiré
1. Tuteur génère un QR code
2. Attendre 6 minutes
3. Étudiant scanne le QR code
4. ❌ Erreur: "Invalid QR code or PIN"

### Test 3: Scan Multiple
1. Étudiant scanne un QR code
2. Essayer de scanner à nouveau immédiatement
3. ✅ Le deuxième scan est ignoré (pas de doublon)

### Test 4: Permissions Caméra
1. Étudiant clique sur "Ouvrir le scanner"
2. Si permissions non accordées: Popup de demande
3. Si permissions refusées: Message d'erreur
4. Si permissions accordées: Caméra s'ouvre

## Fichiers Modifiés

- `apps/mobile/app/(student)/(tabs)/sessions/check-in.tsx`
  - Ajout de l'état `scanned`
  - Protection contre les scans multiples
  - Normalisation du format de la méthode ('qr' au lieu de 'QR')
  - Amélioration de la gestion du scanner

## Notes Importantes

1. **Le QR code est un vrai QR code scannable** - Il contient le hash généré par le backend
2. **Le système fonctionne avec expo-camera** - Version 17.0.10 installée
3. **Les codes expirent après 5 minutes** - Pour des raisons de sécurité
4. **Le cache est en mémoire** - En production, utiliser Redis pour la persistance

## Dépendances

- `expo-camera`: ^17.0.10 ✅
- `react-native-qrcode-svg`: ^6.3.21 ✅
- `react-native-svg`: ^15.15.1 ✅

Toutes les dépendances sont correctement installées.

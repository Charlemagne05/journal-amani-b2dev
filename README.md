# Journal AMANI B2DEV

Ce projet est mon application (TP) **Journal AMANI B2DEV** réalisée avec **Expo Router** + **React Native Paper**.
L’objectif: enregistrer mes rêves, les retrouver facilement, et afficher quelques stats / bonus.

## Lancer l’application

Depuis la racine du dépôt:

```bash
cd my-app
npm install
npx expo start
```

### Ouvrir sur Web

```bash
npx expo start --web
```

### Ouvrir sur Android / iOS

```bash
npx expo start --android
npx expo start --ios
```

> Malheureusement, dans mon environnement, je n’ai pas réussi à faire fonctionner l’app sur **Android** ni sur **iPhone**.  
> Du coup, j’ai surtout testé et fait les captures sur la version **web**.

### Expo Go vs Dev Build

- Si Expo Go affiche **“Project is incompatible…”**: il faut **mettre Expo Go à jour** (SDK 55).
- Alternative à Expo Go (recommandée si tu ne peux pas mettre à jour): **Dev Build** avec `expo-dev-client`.

```bash
npx expo install expo-dev-client
npx expo run:ios --device
npx expo start --dev-client
```

## Meaning Cloud (analyse automatique)

L’analyse automatique utilise Meaning Cloud (sujets/personnes).  
Créer un fichier `my-app/.env` (vous pouvez copier `my-app/.env.example`) :

```bash
EXPO_PUBLIC_MEANINGCLOUD_API_KEY=...
```

Sans clé, l’app fonctionne, mais l’analyse Meaning Cloud est simplement désactivée.

## Fonctionnalités (cahier des charges)

- **Formulaire enrichi**: date/heure, type, tonalité, émotions avant/après, personnages, lieu, intensité, clarté, tags, qualité du sommeil, signification personnelle.  
  → `components/DreamForm.tsx`
- **Historique local** (offline) via `AsyncStorage`.  
  → `utils/dreamStorage.ts`
- **Modifier / supprimer** un rêve (dans l’onglet **Historique**).  
  → `components/DreamList.tsx`
- **Recherche & filtrage** (dans l’onglet **Historique**): mots‑clés, émotions, type de rêve, personnages.  
  → `components/DreamList.tsx`
- **Amélioration graphique / ergonomie**: UI `react-native-paper` (Cards, Dialogs), thème/couleurs plus “vives”, et navigation par onglets.
- **Bonus** (onglet **Bonus**):
  - stats (types, tonalité, moyennes, tags/émotions/personnages)
  - rappels (notifications quotidiennes)
  - export (texte / PDF)

> Note web: les notifications sont limitées sur le web. Pour l’export “PDF”, l’app télécharge un HTML à imprimer en PDF depuis le navigateur.

## Structure du projet

- `app/` : routes Expo Router
  - `app/(tabs)/index.tsx` : onglet **Journal** (formulaire + historique)
  - `app/(tabs)/three.tsx` : onglet **Historique**
  - `app/(tabs)/bonus.tsx` : onglet **Bonus**
- `components/` : UI
  - `DreamForm.tsx` : formulaire
  - `DreamList.tsx` : liste + edit/suppression + filtres
  - `DreamHistory.tsx` : affichage des rêves
  - `DreamStats.tsx` : stats/graphes (ProgressBar)
- `services/meaningCloud.ts` : appel API Meaning Cloud
- `utils/` : stockage / export
  - `dreamStorage.ts` : CRUD AsyncStorage + migration simple
  - `dreamExport.ts` : export texte + PDF
- `types/dream.ts` : types TypeScript

## Choix de conception (rapidement)

- J’ai choisi **AsyncStorage** pour garder un fonctionnement **offline** et simple.
- Pour l’UI, j’ai utilisé **react-native-paper** (Cards, Dialogs…) pour une interface plus moderne.
- La **recherche** est faite côté client (sur les rêves déjà stockés) pour éviter une BDD et rester léger.
- Pour les bonus: **expo-notifications** (rappels) et **expo-print/expo-sharing** (export).
- Le code est en **TypeScript** (mode strict) avec des fichiers séparés par responsabilité (`types/`, `utils/`, `components/`, `services/`).

## Captures d’écran

J’ai prévu une page ici: [`docs/SCREENSHOTS.md`](./docs/SCREENSHOTS.md).  

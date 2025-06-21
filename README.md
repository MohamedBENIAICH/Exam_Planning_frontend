# FST Digital Frontend

## Une interface utilisateur intuitive pour la gestion des examens et concours universitaires.

Ce projet est l'interface utilisateur (frontend) de l'application FST Digital, développée avec React et Vite. Il permet aux utilisateurs d'interagir avec l'API backend pour la planification, l'organisation et le suivi des examens. Il inclut aussi la gestion des concours.

## Technologies Utilisées

- **Frontend :** React (JavaScript)
- **Build Tool :** Vite
- **Bibliothèque UI :** Material-UI (MUI)
- **Routage :** React Router DOM

## Environnements de Développement Recommandés

- **Frontend :** Visual Studio Code

## Prérequis

Assurez-vous de disposer d'une connexion Internet et d'avoir installé les éléments suivants sur votre système :

- **Node.js :** Version LTS (Long Term Support) recommandée. Inclut npm (Node Package Manager).
- **Git :** Pour cloner le dépôt.

## Instructions d'Installation

### 1. Cloner le Dépôt

Ouvrez un terminal ou une invite de commande, naviguez jusqu'au répertoire où vous souhaitez cloner le projet, et exécutez la commande suivante :

```bash
git clone https://github.com/MohamedBENIAICH/Exam_Planning_frontend.git
cd Exam_Planning_frontend
```

### 2. Configuration du Frontend (React + Vite)

1.  **Installer les Dépendances :**
    Dans le répertoire `Exam_Planning_frontend`, ouvrez un terminal intégré et exécutez la commande suivante pour installer toutes les dépendances du projet frontend :

    ```bash
    npm install
    # ou si vous utilisez Yarn
    # yarn install
    ```

2.  **Configurer l'API Backend :**
    Le frontend doit savoir où se trouve l'API backend. Par défaut, il est configuré pour se connecter à `http://localhost:8000`. Si votre backend s'exécute sur une adresse ou un port différent, vous devrez ajuster la configuration dans le code source. Recherchez les appels `fetch` ou `axios` et ajustez l'URL de base de l'API en conséquence.

## Démarrage de l'Application

Pour démarrer l'application en mode développement :

```bash
npm run dev
# ou si vous utilisez Yarn
# yarn dev
```

L'application sera généralement accessible à l'adresse : `http://localhost:5173` (le port peut varier, vérifiez la sortie du terminal).

## Construction pour la Production

Pour construire l'application pour un déploiement en production :

```bash
npm run build
# ou si vous utilisez Yarn
# yarn build
```

Ceci créera un dossier `dist/` contenant les fichiers statiques optimisés pour la production. Vous pouvez ensuite déployer le contenu de ce dossier sur un serveur web statique.

## Structure du Projet

```
Exam_Planning_frontend/
├── public/                       # Fichiers statiques (images, etc.)
├── src/                          # Code source React
│   ├── components/               # Composants React réutilisables
│   │   ├── Exams/                # Composants spécifiques aux examens
│   │   └── Layout/               # Composants de mise en page
|   |    └── Concours/             # Composants spécifiques aux examens
|    |    └── etc..../              # Composants spécifiques aux autres pages (professeurs, salles, superviseur,modules....)
│   ├── hooks/                    # Hooks React personnalisés
│   ├── lib/                      # Bibliothèques ou modules spécifiques
│   ├── pages/                    # Composants représentant les pages de l'application (Examens,Classrooms,superviseurs,professeurs,concours etc....)
│   └── utils/                    # Fonctions utilitaires et helpers
├── index.html                    # Point d'entrée HTML
├── package.json                  # Dépendances et scripts npm
├── vite.config.js                # Configuration de Vite
└── README.md                     # Ce fichier
```

## Nouvelles Fonctionnalités - Annulation et Notifications Automatiques

### Interface Utilisateur Améliorée

L'interface a été mise à jour pour offrir une meilleure expérience utilisateur avec les nouvelles fonctionnalités d'annulation :

#### Boutons d'Action Modifiés

- **Remplacement** : Les boutons "Supprimer" ont été remplacés par des boutons "Annuler"
- **Couleur** : Boutons rouges pour indiquer l'action d'annulation
- **Icônes** : Icônes appropriées pour l'annulation

#### Dialogues de Confirmation

- **Messages explicites** : "Êtes-vous sûr de vouloir annuler cet examen/concours ?"
- **Informations détaillées** : Affichage des conséquences de l'annulation
- **Notifications automatiques** : Information sur l'envoi automatique des notifications

### Composants Modifiés

#### ExamScheduling.tsx

- **Bouton d'annulation** : Remplacement du bouton de suppression
- **Dialogue de confirmation** : Nouveau dialogue spécifique à l'annulation
- **Gestion des erreurs** : Messages d'erreur adaptés aux annulations

#### ConcourScheduling.tsx

- **Bouton d'annulation** : Remplacement du bouton de suppression
- **Dialogue de confirmation** : Nouveau dialogue spécifique à l'annulation
- **Gestion des erreurs** : Messages d'erreur adaptés aux annulations

#### ExamsList.jsx

- **Bouton d'annulation** : Remplacement du bouton de suppression
- **Style visuel** : Couleur rouge pour indiquer l'action d'annulation

#### UpcomingExams.tsx

- **Bouton d'annulation** : Remplacement du bouton de suppression
- **Style visuel** : Couleur rouge pour indiquer l'action d'annulation

### Appels API Modifiés

#### Nouvelles Routes Utilisées

```javascript
// Annulation d'examen
POST / api / exams / { id } / cancel;

// Annulation de concours
POST / api / concours / { id } / cancel;

// Envoi de convocations mises à jour
POST / api / exams / { id } / send - updated - convocations;
POST / api / concours / { id } / send - updated - convocations;
```

#### Gestion des Réponses

- **Succès** : Messages de confirmation d'annulation
- **Erreurs** : Gestion des erreurs avec messages explicites
- **Feedback** : Notifications utilisateur appropriées

### Expérience Utilisateur

#### Messages Utilisateur

- **Confirmation** : "Êtes-vous sûr de vouloir annuler cet examen/concours ?"
- **Succès** : "L'examen/concours a été annulé avec succès"
- **Information** : "Cette action enverra automatiquement des notifications à tous les acteurs concernés"

#### Indicateurs Visuels

- **Couleurs** : Rouge pour les actions d'annulation
- **Icônes** : Icônes appropriées pour l'annulation
- **États** : Indicateurs visuels pour les événements annulés

### Fonctionnalités de Notification

#### Notifications Automatiques

- **Annulation** : Envoi automatique lors de l'annulation
- **Mise à jour** : Notifications lors des modifications
- **Convocations** : Envoi de nouvelles convocations PDF

#### Feedback Utilisateur

- **Confirmation** : Messages de succès après envoi
- **Erreurs** : Messages d'erreur détaillés
- **Progression** : Indicateurs de progression si nécessaire

## Gestion des Présences et Absences

L'application frontend permet de visualiser et de gérer les présences et absences des étudiants lors des examens :

### Fonctionnalités principales

- **Affichage des présences/absences** :
  - Pour chaque examen, la liste des étudiants affectés à chaque salle est affichée, avec leur nom, prénom, place et statut de présence (présent/absent).
  - Le statut est synchronisé avec le backend et affiché dans les rapports PDF.
- **Mise à jour des présences** :
  - L'interface permet de marquer un étudiant comme présent ou absent (selon les droits et le contexte, par exemple via l'app mobile ou une interface de gestion).
- **Visualisation dans les rapports** :
  - Les rapports PDF générés affichent le statut de chaque étudiant (présent/absent).

### Exemple d'affichage dans l'interface

- Dans la page de gestion des examens, un bouton permet d'afficher la liste des étudiants par salle.
- Pour chaque étudiant, le statut de présence est indiqué (ex : badge "Présent" ou "Absent").
- Les absences sont visibles en temps réel pour les administrateurs et surveillants.

### Synchronisation avec le backend

- Les modifications de statut sont envoyées via l'API (`POST /api/attendances`).
- La liste des présences/absences est récupérée via l'API (`GET /api/attendances?exam_id={id}`).

Cette gestion permet un suivi précis et centralisé des absences lors des examens, avec une interface claire pour les utilisateurs.

## Dépannage

- **Le Frontend ne démarre pas ?**
  - Assurez-vous d'avoir exécuté `npm install` (ou `yarn install`) dans le dossier `Exam_Planning_frontend` pour installer toutes les dépendances.
  - Vérifiez qu'aucune erreur ne s'affiche dans la console du terminal où `npm run dev` est exécuté.
  - Ouvrez les outils de développement de votre navigateur (généralement F12) et vérifiez la console pour des erreurs JavaScript ou des problèmes de connexion réseau (par exemple, échec de la connexion à l'API backend).
  - Assurez-vous que le backend est bien démarré et accessible depuis le frontend (généralement sur `http://localhost:8000`).

## Contributeurs et Contribution

- [MohamedBENIAICH](https://github.com/MohamedBENIAICH)
- [DiarraIbra](https://github.com/DiarraIbra)

N'hésitez pas à contribuer à ce projet en ouvrant des issues ou des pull requests. Veuillez suivre les conventions de codage React.

---

# Annexe : Cohérence des Pages de Concours

(Le contenu suivant provient de COHERENCE_CONCOURS_IMPLEMENTATION.md)

# Cohérence des Pages de Concours

## Vue d'ensemble

Cette implémentation assure la cohérence entre les différentes pages de concours en utilisant la logique appropriée pour chaque type de page.

## Logique implémentée

### 1. Page principale (`/concours`)

- **Endpoint :** `/api/concours/latest`
- **Affichage :** Les 5 derniers concours
- **Fonctionnalités :** Création, modification, suppression complètes
- **Titre :** "Les 5 derniers concours"

### 2. Page "Concours à venir" (`/upcoming-concours`)

- **Endpoint :** `/api/concours/upcoming`
- **Affichage :** TOUS les concours à venir
- **Fonctionnalités :** Création, modification, suppression complètes
- **Titre :** "Concours à venir"

### 3. Page "Concours passés" (`/past-concours`)

- **Endpoint :** `/api/concours/passed`
- **Affichage :** TOUS les concours passés
- **Fonctionnalités :** Consultation uniquement (pas de modification)
- **Titre :** "Concours passés"

## Modifications apportées

### 1. Page "Concours à venir" (`src/pages/UpcomingConcours.tsx`)

**Configuration :**

```javascript
// Endpoint pour tous les concours à venir
const response = await fetch("http://127.0.0.1:8000/api/concours/upcoming");
// Affichage de tous les concours
setConcours(data);
// Titre approprié
title = "Concours à venir";
subtitle = "Planification et suivi des concours futurs";
```

### 2. Page "Concours passés" (`src/pages/PastConcours.tsx`)

**Configuration :**

```javascript
// Endpoint pour tous les concours passés
const response = await fetch("http://127.0.0.1:8000/api/concours/passed");
// Affichage de tous les concours
setConcours(data);
// Titre approprié
title="Concours passés"
subtitle="Historique des concours terminés"
// Pas de bouton modifier
showEditButton={false}
```

### 3. Composant ConcoursSection (`src/components/Dashboard/UpcomingConcours.tsx`)

**Nouvelle fonctionnalité :**

```javascript
interface ConcoursSectionProps {
  // ... autres props
  showEditButton?: boolean; // Nouvelle prop pour contrôler l'affichage du bouton Modifier
}

// Utilisation conditionnelle du bouton Modifier
{
  showEditButton && (
    <Button variant="outline" onClick={() => handleEditConcour(concours)}>
      Modifier
    </Button>
  );
}
```

### 4. Page principale (`src/pages/ConcourScheduling.tsx`)

**Aucune modification nécessaire** - Cette page était déjà correcte :

- Utilise `/api/concours/latest`
- Limite à 5 concours
- Affiche le titre "Les 5 derniers concours"
- Toutes les fonctionnalités disponibles

## Avantages de cette approche

### 1. Logique métier appropriée

- **Page principale :** Aperçu rapide des 5 derniers concours
- **Concours à venir :** Vue complète pour la planification
- **Concours passés :** Consultation historique sans modification

### 2. Sécurité et logique

- Impossible de modifier un concours passé
- Interface adaptée au contexte d'utilisation

### 3. Performance optimisée

- Page principale : Chargement rapide avec 5 concours
- Pages spécialisées : Données complètes selon le besoin

### 4. Expérience utilisateur

- Navigation claire entre les différents types de concours
- Fonctionnalités appropriées selon le contexte

## Résultat final

### Page principale (`/concours`)

- ✅ Affiche les 5 derniers concours
- ✅ Toutes les fonctionnalités (créer, modifier, supprimer)
- ✅ Titre : "Les 5 derniers concours"

### Page "Concours à venir" (`/upcoming-concours`)

- ✅ Affiche TOUS les concours à venir
- ✅ Toutes les fonctionnalités (créer, modifier, supprimer)
- ✅ Titre : "Concours à venir"

### Page "Concours passés" (`/past-concours`)

- ✅ Affiche TOUS les concours passés
- ✅ Consultation uniquement (pas de bouton "Modifier")
- ✅ Titre : "Concours passés"

## URLs des pages

- **Page principale :** `http://localhost:8081/concours`
- **Page "Concours à venir" :** `http://localhost:8081/upcoming-concours`
- **Page "Concours passés" :** `http://localhost:8081/past-concours`

Chaque page a maintenant sa logique appropriée et ses fonctionnalités adaptées au contexte d'utilisation.

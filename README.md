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

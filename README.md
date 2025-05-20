# Exam Scheduler

Un système de gestion des examens développé avec React, TypeScript et shadcn-ui.

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- Node.js (version 18 ou supérieure)
- npm (généralement installé avec Node.js)
- Git

## Installation

1. Clonez le dépôt :

```bash
git clone https://github.com/MohamedBENIAICH/Exam_Planning_frontend.git
```

2. Installez les dépendances :

```bash
npm install
```

## Développement

Pour lancer le serveur de développement :

```bash
npm run dev
```

L'application sera accessible à l'adresse : `http://localhost:5173`

## Technologies utilisées

- [React](https://reactjs.org/) - Bibliothèque JavaScript pour construire des interfaces utilisateur
- [TypeScript](https://www.typescriptlang.org/) - Superset JavaScript typé
- [Vite](https://vitejs.dev/) - Outil de build moderne
- [shadcn-ui](https://ui.shadcn.com/) - Composants UI réutilisables
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitaire

## Structure du projet

```
src/
  ├── components/     # Composants React réutilisables
  ├── pages/         # Pages de l'application
  ├── hooks/         # Custom React hooks
  ├── utils/         # Fonctions utilitaires
  ├── types/         # Types TypeScript
  └── styles/        # Fichiers de style
```

## Scripts disponibles

- `npm run dev` - Lance le serveur de développement
- `npm run build` - Crée une version de production
- `npm run preview` - Prévisualise la version de production localement
- `npm run lint` - Vérifie le code avec ESLint
- `npm run type-check` - Vérifie les types TypeScript

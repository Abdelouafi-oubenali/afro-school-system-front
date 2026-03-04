# Afro School System - Frontend

Application React TypeScript pour la gestion scolaire.

## 📋 Table des matières
- [Installation](#installation)
- [Configuration des API](#configuration-des-api)
- [Architecture](#architecture)
- [Commandes disponibles](#commandes-disponibles)

---

## 🚀 Installation

### Prérequis
- Node.js >= 18
- npm ou yarn

### Étapes

```bash
# Cloner le projet
git clone <url-du-repo>
cd afro-school-system-front

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

---

## 🔌 Configuration des API

### URL de base

L'application communique avec un backend à l'adresse :
```
http://localhost:8081/api
```

### Modification de l'URL de base

Pour changer l'URL du serveur API, modifiez la constante `API_URL` dans :

- **[src/services/authService.ts](src/services/authService.ts)** (pour les appels Fetch)
- **[src/hooks/useAuth.ts](src/hooks/useAuth.ts)** (pour les appels Axios)

```typescript
// Exemple
const API_URL = "http://votre-domaine.com/api";
```

### Endpoints utilisés

#### 1. Authentification - Login
**Endpoint** : `POST /auth/login`

**Fichier** : [src/services/authService.ts](src/services/authService.ts)

**Requête** :
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse attendue** :
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "Nom Utilisateur",
    "email": "user@example.com"
  }
}
```

**Utilisation dans le composant** :
```tsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { login, loading, error } = useAuth();
  
  const handleLogin = async () => {
    await login('user@example.com', 'password123');
  };
  
  return (
    <>
      {error && <p>{error}</p>}
      <button onClick={handleLogin} disabled={loading}>
        {loading ? 'Connexion...' : 'Login'}
      </button>
    </>
  );
}
```

### Ajouter de nouveaux endpoints

#### Méthode 1 : Utiliser le service auth existant

Modifiez [src/services/authService.ts](src/services/authService.ts) :

```typescript
export const authService = {
  login: async (email: string, password: string) => {
    // ... code existant
  },
  
  // Nouvel endpoint
  register: async (email: string, password: string, name: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return response.json();
  },
};
```

#### Méthode 2 : Créer un nouveau service

Créez [src/services/userService.ts](src/services/userService.ts) :

```typescript
const API_URL = "http://localhost:8081/api";

export const userService = {
  getProfile: async (token: string) => {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return response.json();
  },

  updateProfile: async (token: string, data: any) => {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erreur: ${response.status}`);
    }

    return response.json();
  },
};
```

### Gestion des tokens JWT

Le token est automatiquement sauvegardé dans `localStorage` après la connexion :

```typescript
// Token est accessible
const token = localStorage.getItem("token");

// À ajouter dans les headers des requêtes protégées
headers: {
  "Authorization": `Bearer ${token}`
}
```

Pour récupérer le token dans un composant :

```tsx
function MyComponent() {
  const token = localStorage.getItem("token");
  // Utiliser le token
}
```

### Gestion des erreurs API

Les erreurs sont gérées et affichées dans le contexte Auth :

```tsx
const { error } = useAuth();

if (error) {
  return <div className="error">{error}</div>;
}
```

Pour ajouter une meilleure gestion d'erreur, créez un intercepteur :

```typescript
// src/services/api.ts
export const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    // Token expiré
    localStorage.removeItem("token");
    window.location.href = "/login";
  } else if (error.response?.status === 403) {
    // Accès refusé
    return "Accès refusé";
  } else if (error.response?.status === 404) {
    // Ressource non trouvée
    return "Ressource non trouvée";
  } else if (error.response?.status === 500) {
    // Erreur serveur
    return "Erreur serveur. Veuillez réessayer.";
  }
  return error.message || "Erreur inconnue";
};
```

---

## 🏗️ Architecture

### Structure des dossiers

```
src/
├── components/       # Composants réutilisables
│   └── layout/      # Composants de mise en page
├── context/         # Contextes React (Auth, etc.)
├── hooks/           # Hooks personnalisés
├── pages/           # Pages principales
├── services/        # Appels API
├── utils/           # Fonctions utilitaires
├── assets/          # Images, styles
├── App.tsx          # Composant principal
├── main.tsx         # Point d'entrée
└── index.css        # Styles globaux
```

### Flux de données

1. **UI (Login.tsx)** → Saisie utilisateur
2. **Context (AuthContext.tsx)** → Gestion d'état globale
3. **Service (authService.ts)** → Appel API
4. **Backend** → Traitement et réponse
5. **Context** → Mise à jour de l'état
6. **UI** → Affichage mis à jour

---

## 📦 Commandes disponibles

```bash
# Développement
npm run dev          # Démarrer le serveur Vite

# Build
npm run build        # Compiler pour la production

# Vérification du code
npm run lint         # Vérifier les erreurs ESLint

# Aperçu de production
npm run preview      # Aperçu de la build production
```

---

## 🛠️ Dépendances principales

- **React 19** : Framework UI
- **React DOM 19** : Rendu React
- **TypeScript 5.9** : Typage statique
- **Vite 7** : Bundler ultra-rapide
- **ESLint 9** : Linting du code

---

## 🔐 Variables d'environnement (optionnel)

Pour utiliser des variables d'environnement, créez un fichier `.env` :

```env
VITE_API_URL=http://localhost:8081/api
```

Et utilisez-les dans votre code :

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/api";
```

---

## 📝 Notes importantes

- Le token JWT est stocké dans `localStorage`
- Les requêtes API nécessitent une connexion au backend
- Assurez-vous que le backend s'exécute sur `http://localhost:8081`
- Tous les endpoints doivent respecter le format JSON

---

## 👨‍💻 Auteur

Projet de gestion scolaire Afro School System


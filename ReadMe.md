# Smart Queue & Appointment System — PFE

Application web + mobile de gestion de rendez-vous et de file d'attente avec tickets QR, rôles métier, affectation des agents aux guichets et suivi de file en direct.

## Architecture

```text
PFE/
├── backend/   NestJS + MongoDB + JWT + Swagger
├── frontend/  React + Vite + Tailwind (portail staff)
├── mobile/    Expo / React Native (application usager)
└── docs/      documentation et captures du PFE
```

L'application mobile utilise **Expo SDK 54**. Utilisez les versions verrouillées par `mobile/package-lock.json` avec `npm ci`.

## Fonctionnalités principales

### Backend

- Authentification JWT et RBAC : `ADMIN`, `SUPERVISOR`, `AGENT`, `USER`
- Comptes désactivés refusés à la connexion et invalidés lors des requêtes JWT
- CRUD services avec horaires, jours ouvrables, capacité par créneau et documents requis
- Disponibilités calculées via `GET /availability`
- Rendez-vous avec contrôle de capacité par date/créneau et ticket QR unique
- Annulation protégée par propriétaire/rôle
- Guichets et affectations agent → guichet
- Check-in QR, appel du prochain ticket, début/fin de service et absence
- Horodatages `checkInTime`, `calledTime`, `serviceStartTime`, `finishTime`
- Statistiques réelles du dashboard et temps d'attente moyen
- Suivi personnel de file avec position et ETA via `GET /queue/my-status`
- Écran public de file via `GET /queue/display`
- Swagger sur `/api/docs`

### Portail web

- Connexion réservée au staff
- Navigation et autorisations selon le rôle
- Dashboard avec données réelles
- Gestion complète des services
- Gestion des guichets
- Gestion agents/superviseurs et affectations aux guichets
- Gestion opérationnelle de la file
- Écran public « Now Serving »
- Export PDF/Excel des rendez-vous

### Application mobile

- Inscription et connexion usager
- Liste des services actifs
- Sélection de date et créneaux réellement disponibles
- Affichage des documents requis
- Réservation et ticket QR
- Historique des rendez-vous
- Réouverture du QR depuis l'historique
- Annulation d'un rendez-vous confirmé
- Suivi live de la file : position, personnes devant, guichet et estimation d'attente

## Installation

### Prérequis

- Node.js compatible avec les versions du projet
- npm
- MongoDB local ou MongoDB Atlas
- Expo Go ou un émulateur pour l'application mobile

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run start:dev
```

API : `http://localhost:3000`  
Swagger : `http://localhost:3000/api/docs`

> `npm run seed` réinitialise les données de démonstration avant de les recréer. Ne pas l'utiliser sur une base contenant des données à conserver.

### Frontend web

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Portail web : `http://localhost:5173`

### Mobile

```bash
cd mobile
cp .env.example .env
npm install
npx expo start
```

Pour un téléphone physique, renseigner dans `mobile/.env` l'adresse LAN de la machine qui exécute le backend, par exemple :

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000
```

`localhost` sur un téléphone désigne le téléphone lui-même, pas le PC de développement.

## Variables d'environnement

### `backend/.env`

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/pfe_queue_db
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1h
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:3000
```

### `mobile/.env`

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000
```

## Comptes de démonstration

Après `npm run seed`, tous les comptes utilisent le mot de passe `password123` :

| Rôle | Email | Utilisation |
|---|---|---|
| Admin | `admin@pfe.com` | Administration complète |
| Supervisor | `supervisor@pfe.com` | Dashboard et rendez-vous |
| Agent | `agent@pfe.com` | File d'attente, affecté au guichet 1 |
| User | `user@pfe.com` | Application mobile |

## Commandes utiles

```bash
# backend
npm run start:dev
npm run seed
npm run build
npm run test
npm run test:e2e

# frontend
npm run dev
npm run build
npm run lint

# mobile
npx expo start
npm run lint
```

## PFE

Projet réalisé dans le cadre du Projet de Fin d'Études — Smart Queue & Appointment System.

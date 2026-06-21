# Smart Queue & Appointment System - PFE

Application intelligente de gestion de rendez-vous et de file d'attente avec génération de tickets QR Code.

## 🎯 Objectif

Permettre aux usagers de prendre rendez-vous en ligne, de recevoir un ticket QR, et aux agents de gérer la file d'attente de manière efficace via un dashboard web et une application mobile.

## 🏗️ Architecture

Projet-PFE/
├── backend/ → API NestJS (TypeScript, MongoDB, JWT)
├── frontend/ → Dashboard Web (React, Vite, Tailwind)
├── mobile/ → App Mobile Usager (Expo, React Native)
└── docs/ → Documentation, captures, rapport

## 🛠️ Technologies

### Backend

- **NestJS** (TypeScript)
- **MongoDB** + Mongoose
- **JWT** (authentification)
- **bcrypt** (hachage des mots de passe)
- **Swagger** (documentation API)
- **class-validator** (validation DTO)

### Frontend Web

- **React 18** + TypeScript
- **Vite**
- **Tailwind CSS**
- **Axios** + **Zustand** (state management)
- **React Router**

### Mobile

- **Expo** (React Native)
- **Expo Router**
- **react-native-qrcode-svg**
- **AsyncStorage**

## 🚀 Installation

### Prérequis

- Node.js 18+
- MongoDB (local ou Atlas)
- npm ou yarn

### 1. Backend

```bash
cd backend
cp .env.example .env

npm install
npm run seed
npm run start:dev

Le serveur tourne sur http://localhost:3000
Swagger disponible sur http://localhost:3000/api/docs

2. Frontend Web
cd frontend
npm install
npm run dev

Le dashboard tourne sur http://localhost:5173

3. Mobile
cd mobile
npm install
npx expo start

🔑 Comptes de démonstration
Après avoir lancé npm run seed, ces comptes sont disponibles :
Rôle,Email,Mot de passe
Admin,admin@pfe.com,password123
Agent,agent@pfe.com,password123
Usager,user@pfe.com,password123

🔐 Variables d'environnement
Créer un fichier .env dans le dossier backend/ :
PORT=3000
MONGODB_URI=mongodb+srv://votre_user:votre_password@cluster.mongodb.net/pfe_queue_db
JWT_SECRET=votre_secret_jwt_tres_long_et_securise

📝 Commandes utiles
# Backend
npm run start:dev      # Lancer en développement
npm run seed           # Générer les données de démo
npm run build          # Build de production

# Frontend
npm run dev            # Lancer le serveur de développement

# Mobile
npx expo start         # Lancer Expo


👤 Auteur
Projet réalisé dans le cadre du PFE - Rihem Labbaoui
```

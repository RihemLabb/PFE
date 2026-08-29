# Smart Queue — PFE Project 3

Solution web et mobile de gestion des rendez-vous et des files d’attente avec tickets QR.

## Applications

- `backend/` : API NestJS, MongoDB, JWT, Swagger.
- `frontend/` : portail React pour administration, agents et supervision.
- `mobile/` : application usager Expo **SDK 51**.
- `docs/` : architecture et matrice de conformité au brief.

## Démarrage local

Prérequis : Node.js 18+, npm et MongoDB. MongoDB peut être lancé avec `docker compose up -d`.

```bash
cd backend
cp .env.example .env
npm ci
npm run seed
npm run start:dev
```

L’API est disponible sur `http://localhost:3000` et Swagger sur `http://localhost:3000/api/docs`.

```bash
cd frontend
npm ci
npm run dev
```

```bash
cd mobile
cp .env.example .env
# Remplacer l’IP par l’adresse LAN du poste, accessible depuis l’iPhone.
npm ci
npx expo start --lan
```

L’application mobile reste volontairement sur Expo `~51.0.14` et React Native `0.74.2` pour la compatibilité iPhone demandée. Ne pas lancer de mise à niveau Expo automatique.

## Comptes de démonstration

Après `npm run seed` :

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | `admin@pfe.com` | `password123` |
| Agent | `agent@pfe.com` | `password123` |
| Usager | `user@pfe.com` | `password123` |

## Vérification

```bash
cd backend && npm run build && npm test -- --runInBand
cd frontend && npm run build
cd mobile && npx tsc --noEmit && npx expo export --platform web
```

## Règles métier importantes

- La capacité est contrôlée par service, date et créneau.
- Un QR ne fonctionne que le jour du rendez-vous et pour son propriétaire.
- Une réservation ne produit qu’une entrée de file.
- Un guichet ne peut appeler que la file du service auquel il est affecté.
- L’absence ne peut être déclarée qu’après le délai configuré.
- Les numéros de ticket sont générés par journée.

Voir [l’architecture](docs/architecture.md) et la [conformité au brief](docs/conformite-brief.md).

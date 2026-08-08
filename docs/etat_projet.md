# État du projet — Stabilisation P0

> Branche de travail : `fix/p0-stabilization`  
> La branche `main` reste inchangée jusqu'à validation.

## ✅ Fonctionnalités actuellement implémentées

### Backend

- API NestJS + MongoDB structurée par modules
- Authentification JWT et RBAC : `ADMIN`, `SUPERVISOR`, `AGENT`, `USER`
- Comptes désactivés bloqués à la connexion et lors de la validation JWT
- Services avec durée, capacité, documents requis, horaires et jours ouvrables
- Endpoint public de disponibilités calculées : `GET /availability`
- Rendez-vous avec contrôle de capacité par **date + service + créneau**
- Protection de l'annulation par propriétaire/rôle
- Tickets QR avec token UUID
- Guichets reliés aux services
- Gestion des comptes agents/superviseurs
- Affectation active agent → guichet
- File d'attente filtrée par jour
- Check-in QR avec protection contre les scans répétés incohérents
- Appel atomique du prochain ticket
- Workflow `WAITING → CALLED → IN_PROGRESS → FINISHED/ABSENT`
- Synchronisation des statuts Appointment/Queue
- Horodatages `checkInTime`, `calledTime`, `serviceStartTime`, `finishTime`
- Statistiques dashboard calculées depuis la base
- Endpoint public de salle d'attente : `GET /queue/display`
- Suivi usager : `GET /queue/my-status` avec position, personnes devant et ETA
- Swagger sur `/api/docs`
- Seed reproductible avec les 4 rôles et une affectation agent/guichet
- Premiers tests unitaires ajoutés pour annulation/disponibilités et protection du check-in QR

### Frontend Web

- Portail staff avec JWT
- Routes et navigation filtrées selon le rôle
- Dashboard alimenté par de vraies données backend
- Gestion CRUD des services et de leurs horaires
- Gestion des guichets
- Gestion agents/superviseurs
- Affectation des agents aux guichets
- Console Queue sans identifiants MongoDB codés en dur
- Un agent utilise automatiquement son guichet affecté
- Écran public « Now Serving / Up Next »
- Tableau des rendez-vous
- Exports PDF et Excel des rendez-vous
- Thème clair/sombre et palette de commandes

### Mobile

- Inscription et connexion usager
- Persistance de session et gestion de l'expiration JWT
- Protection des routes après hydratation de la session
- Liste des services actifs
- Sélection de date
- Chargement des créneaux réellement disponibles
- Affichage des places restantes
- Affichage des documents requis
- Réservation d'un rendez-vous
- Ticket QR avec date/service/heure
- Historique des rendez-vous
- Réouverture du QR depuis l'historique
- Annulation d'un rendez-vous confirmé
- Suivi live de la file avec position, personnes devant, guichet et estimation d'attente

## 🚧 Priorités restantes

### P0 — Validation technique

- Exécuter et corriger `npm run build`, `npm run lint` et `npm run test` sur une machine avec les dépendances installées
- Ajouter davantage de tests sur le workflow complet et les permissions
- Vérifier tous les scénarios avec une base fraîche via `npm run seed`
- Tester le parcours réel web + mobile sur réseau LAN

### P1 — Fonctionnalités PFE à compléter

- Jours fériés et horaires exceptionnels
- Évaluation / feedback d'un service
- Profil utilisateur mobile
- Scan QR réel par caméra
- Gestion configurable du délai d'absence
- Rapports/statistiques avancés

### P2 — Bonus

- Notifications push
- Synchronisation hors-ligne limitée
- WebSockets si nécessaire après stabilisation du polling
- Internationalisation FR/EN

## ⚠️ Points à vérifier avant fusion

La branche contient une refonte importante des règles métier. Les fichiers ont été relus statiquement, mais la compilation et les tests doivent encore être exécutés dans l'environnement local du projet avant fusion dans `main`.

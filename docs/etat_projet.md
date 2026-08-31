# État final du projet

La stabilisation décrite dans le rapport final est intégrée sur la branche `feature/report-alignment`. L'application mobile cible **Expo SDK 54**.

## Fonctionnalités livrées

### Backend

- API NestJS, MongoDB/Mongoose et Swagger configurable.
- Authentification JWT, rotation des refresh tokens, déconnexion et RBAC à quatre rôles.
- Protection des comptes désactivés et limitation de requêtes sensibles.
- Services, horaires, capacité, documents requis et délai d'absence.
- Jours fermés et horaires exceptionnels globaux ou propres à un service.
- Rendez-vous avec validation de disponibilité, anti-doublon et ticket quotidien.
- Check-in réservé au personnel par caméra QR ou numéro de ticket, avec confirmation manuelle, contrôle d'affectation et file horodatée.
- Affectations agent-guichet et contrôle du périmètre opérationnel.
- Indicateurs réels, rapports et feedback après traitement terminé.

### Portail web

- Routage différencié pour administrateur, superviseur et agent.
- Dashboard alimenté par l'API, gestion services/guichets/personnel/affectations/calendrier.
- Consultation des rendez-vous et exports PDF/Excel.
- Console de file, affichage public et rapports de satisfaction avec export CSV.

### Application mobile — Expo SDK 54

- Inscription, connexion, refresh de session et protection des routes.
- Services, documents requis, disponibilités et réservation.
- Ticket QR/numéro de passage présenté à l'agent, historique, annulation et suivi live après check-in.
- Suivi live de la file avec position, personnes devant, guichet et ETA.
- Profil utilisateur et évaluation d'un rendez-vous terminé.
- Replanification avec revalidation des disponibilités et renouvellement du ticket QR.
- Centre de notifications et rappels des rendez-vous à venir.

## Validation

- Backend : compilation réussie et 6 suites totalisant 30 tests unitaires réussis.
- Frontend : compilation de production réussie ; lint sans erreur bloquante.
- Mobile : contrôle TypeScript et export Expo web de 12 routes réussis sous SDK 54.
- CI : jobs backend, frontend et mobile définis dans `.github/workflows/ci.yml`.
- Tests UI web : scénarios automatisés des routes protégées.
- Production : images Docker multi-étapes, proxy Nginx et composition MongoDB/API/web.

## Limites dépendantes de l'environnement

- Un déploiement public nécessite un domaine, HTTPS et des secrets fournis par l'hébergeur.
- Les notifications push natives nécessitent des identifiants APNs/FCM ; les rappels internes sont opérationnels sans ces services externes.

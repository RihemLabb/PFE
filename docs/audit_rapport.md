# Audit de concordance — rapport final et dépôt

Audit réalisé à partir de `versionfinale.docx` et de la branche de stabilisation complète.

| Élément annoncé dans le rapport | Preuve dans le dépôt | État |
|---|---|---|
| JWT, quatre rôles et guards | `backend/src/modules/auth`, `roles.guard.ts` | Conforme |
| Rotation et révocation du refresh token | `refresh-session.schema.ts`, `auth.service.ts` | Conforme |
| Limitation de requêtes | `rate-limit.guard.ts` et son test | Conforme |
| Services, horaires et capacité | modules Services et Appointments | Conforme |
| Jours fermés et horaires exceptionnels | module Holidays et page `Holidays.tsx` | Conforme |
| Affectation agent-guichet | module AgentAssignments et page `Staff.tsx` | Conforme |
| Réservation et ticket QR | module Appointments et écrans Booking/Ticket | Conforme |
| Scan QR par caméra | `mobile/src/app/scanner.tsx`, `expo-camera` | Conforme |
| File et transitions horodatées | module Queue et tests unitaires | Conforme |
| Suivi position/personnes devant/ETA | `/queue/my-status`, `queue-status.tsx` | Conforme |
| Tableau de bord réel | statistiques Appointments et `Dashboard.tsx` | Conforme |
| Exports PDF et Excel | `frontend/src/utils/exportUtils.ts` | Conforme |
| Feedback et satisfaction | module Feedback, écrans Feedback/Reports | Conforme |
| Export CSV des rapports | `frontend/src/pages/Reports.tsx` | Conforme |
| Profil mobile | `mobile/src/app/profile.tsx` et module Users | Conforme |
| 6 suites / 28 tests unitaires | tests Auth, Appointments, Queue, Feedback, RateLimit et App | Conforme |
| CI backend/web/mobile | `.github/workflows/ci.yml` | Conforme |
| Expo SDK 54 | `mobile/package.json` et lockfile | Conforme |
| Replanification | endpoint sécurisé et action mobile avec nouvelle disponibilité/QR/ticket | Complété |
| Rappels | module Notifications et écran mobile | Complété |
| Refresh token web HttpOnly | cookie sécurisé, rotation et révocation côté API | Complété |
| Tests UI web | Vitest + Testing Library sur les protections de route | Complété |
| Configuration production | Dockerfiles, Nginx et Compose de production | Complété |
| Lint bloquant | backend, frontend et mobile sans erreur ni avertissement projet | Complété |

## Limites externes

- Le dépôt fournit une configuration de production reproductible ; le choix d'un hébergeur, du domaine et des secrets reste une opération d'infrastructure.
- Les rappels livrés sont des notifications internes à l'application. L'envoi push hors application nécessite les identifiants APNs/FCM de l'environnement cible.

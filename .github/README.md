# SafeBase

Application web pour gérer et automatiser les sauvegardes de bases de données MySQL et PostgreSQL.

Stack : Go (backend) + React (frontend) + Docker

## Démarrage rapide

```bash
docker compose up -d
```

Accès : http://localhost:3000

## Architecture

```
SafeBase/
├── backend/          # API Go (port 8081)
│   ├── cmd/         # Point d'entrée
│   ├── internal/    # Code métier
│   │   ├── api/     # Routes et handlers
│   │   ├── backup/  # Logique de sauvegarde
│   │   ├── database/# Gestion DB
│   │   ├── models/  # Modèles de données
│   │   └── scheduler/# Planificateur cron
│   └── Dockerfile
├── src/             # Frontend React (port 3000)
│   ├── components/
│   ├── pages/
│   └── services/
└── docker-compose.yml
```

## Services Docker

- **frontend** : React + Nginx (port 3000)
- **backend** : API Go (port 8081)
- **mysql** : Base de test MySQL (port 3306)
- **postgresql** : Base de test PostgreSQL (port 5433)

## Commandes Docker

```bash
# Démarrer
docker compose up -d

# Arrêter
docker compose down

# Logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild après modif code
docker compose up -d --build

# Voir l'état
docker compose ps

# Supprimer tout (y compris données)
docker compose down -v
```

## Bases de données de test

Les credentials sont dans docker-compose.yml.

**MySQL :**

- Host: `mysql` (dans Docker) ou `localhost` (depuis la machine)
- Port: 3306
- User: testuser
- Password: testpass
- Database: testdb

**PostgreSQL :**

- Host: `postgresql` (dans Docker) ou `localhost` (depuis la machine)
- Port: 5432 (interne) / 5433 (externe)
- User: testuser
- Password: testpass
- Database: testdb

## Développement local (sans Docker)

### Backend

```bash
cd backend
go run cmd/server/main.go
```

Le backend démarre sur http://localhost:8081

### Frontend

```bash
npm install
npm run dev
```

Le frontend démarre sur http://localhost:5173

## Fonctionnalités

- Connexion à des bases MySQL/PostgreSQL (locales ou distantes)
- Sauvegardes manuelles à la demande
- Planification automatique avec expressions cron
- Historique des sauvegardes
- Restauration de sauvegardes
- Dashboard avec statistiques
- Système d'alertes
- Authentification JWT

## CI/CD Pipeline

La pipeline GitHub Actions se déclenche automatiquement à chaque push sur main ou création de tag.

### Configuration initiale

1. **Créer un webhook Google Chat**

   - Ouvrir Google Chat → Espace → "Gérer les webhooks"
   - "Ajouter un webhook" → Nom: "SafeBase CI/CD"
   - Copier l'URL

2. **Ajouter le secret dans GitHub**

   - Repo GitHub → Settings → Secrets and variables → Actions
   - New repository secret
   - Nom: `GOOGLE_CHAT_WEBHOOK`
   - Valeur: URL du webhook

3. **Activer les permissions**
   - Settings → Actions → General → Workflow permissions
   - Cocher "Read and write permissions"
   - Save

### Tester avant de push

```bash
# Tester le webhook Google Chat
./scripts/test-google-chat-notification.sh "URL_WEBHOOK"

# Tester les tests backend
cd backend && go test ./...

# Tester le build frontend
npm run build
```

### Workflow de la pipeline

Fichier : `.github/workflows/ci-cd.yml`

**Étapes :**

1. **Tests Frontend** (~3 min)

   - Installation dépendances npm
   - ESLint (warnings autorisés)
   - Build React

2. **Tests Backend** (~1 min)

   - Installation dépendances Go
   - go vet (vérification code)
   - Tests unitaires

3. **Build & Push Docker** (~5-10 min)

   - Build image Frontend
   - Build image Backend
   - Push vers GitHub Container Registry (GHCR)
   - Tags automatiques selon branche/tag

4. **Notification** (~5s)
   - Message Google Chat avec statut
   - Infos commit (SHA, auteur, message)
   - Lien vers les logs

**Durée totale : 10-15 minutes**

Si un test échoue, la pipeline s'arrête immédiatement.

### Utilisation quotidienne

**Développement :**

```bash
git add .
git commit -m "feat: ma modification"
git push
```

Images créées avec tags : `latest`, `main`

**Production (release) :**

```bash
git tag -a v1.0.0 -m "Release 1.0.0"
git push --tags
```

Images créées avec tags : `v1.0.0`, `1.0.0`, `1.0`

### Images Docker produites

Les images sont sur GitHub Container Registry (GHCR) :

```
ghcr.io/mathiaslevrai/safebase/frontend:latest
ghcr.io/mathiaslevrai/safebase/backend:latest
```

Pour les utiliser :

```bash
# Pull des images
docker pull ghcr.io/mathiaslevrai/safebase/frontend:latest
docker pull ghcr.io/mathiaslevrai/safebase/backend:latest

# Ou utiliser docker-compose.prod.yml
cp env.prod.example .env.prod
# Éditer .env.prod avec tes valeurs
docker-compose -f docker-compose.prod.yml up -d
```

### Vérifier que ça marche

Après un push :

1. GitHub → Actions → Voir le workflow en cours
2. Attendre la notification Google Chat
3. GitHub → Packages → Vérifier que les images sont là

### Problèmes courants

**La pipeline échoue :**

- Aller dans GitHub → Actions → Cliquer sur le workflow
- Regarder les logs de l'étape qui a échoué
- Corriger le problème localement et re-push

**Pas de notification Google Chat :**

- Vérifier que le secret `GOOGLE_CHAT_WEBHOOK` est bien configuré
- Tester le webhook avec le script : `./scripts/test-google-chat-notification.sh`

**Permission denied lors du push Docker :**

- Settings → Actions → General → Workflow permissions
- Activer "Read and write permissions"

**Les images ne sont pas visibles :**

- GitHub → Packages → Sélectionner le package
- Package settings → Change visibility → Public

## Variables d'environnement

Le backend utilise ces variables (définies dans docker-compose.yml) :

- `PORT` : Port du serveur (8081)
- `DB_PATH` : Chemin de la base SQLite interne
- `BACKUP_DIR` : Dossier des sauvegardes
- `JWT_SECRET` : Secret pour les tokens JWT (à changer en prod !)

## Volumes Docker

Les données persistantes sont dans des volumes :

- `backend_data` : Base SQLite interne
- `backend_backups` : Fichiers de sauvegarde
- `mysql_data` : Données MySQL de test
- `postgres_data` : Données PostgreSQL de test

Sauvegarder un volume :

```bash
docker run --rm \
  -v safebase_backend_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/backup_$(date +%Y%m%d).tar.gz -C /data .
```

## Notes

- Le frontend fait des appels API vers `/api` qui est proxyfié vers le backend par Nginx
- Les bases de test MySQL et PostgreSQL sont créées automatiquement au démarrage
- Le scheduler cron du backend vérifie les planifications toutes les minutes
- Les sauvegardes sont stockées dans le volume `backend_backups`
- L'authentification utilise JWT stocké dans localStorage

## Dépannage

**Le frontend ne charge pas :**

- Vérifier que le backend est démarré : `docker compose logs backend`
- Vérifier l'URL de l'API dans le code (devrait être `/api`)

**Impossible de se connecter à une base :**

- Depuis l'interface, utiliser `mysql` ou `postgresql` comme host (pas `localhost`)
- Depuis la machine, utiliser `localhost`

**Les sauvegardes échouent :**

- Vérifier les credentials de la base
- Vérifier que mysqldump/pg_dump sont installés dans le container backend
- Voir les logs : `docker compose logs backend`

**Le container redémarre en boucle :**

- `docker compose logs [service]` pour voir l'erreur
- Souvent un problème de port déjà utilisé ou de healthcheck qui échoue

## Commandes utiles

```bash
# Entrer dans un container
docker exec -it safebase-backend sh
docker exec -it safebase-frontend sh

# Voir les stats (CPU, RAM)
docker stats

# Nettoyer Docker
docker system prune -a
docker volume prune
```

---

**Projet créé en janvier 2026**

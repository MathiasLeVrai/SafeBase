# SafeBase

Gestionnaire de sauvegardes de bases de données MySQL et PostgreSQL.

## Démarrage

```bash
docker compose up -d
```

Ouvrir : http://localhost:3000

## Commandes

```bash
# Arrêter
docker compose down

# Voir les logs
docker compose logs -f

# Rebuild
docker compose up -d --build
```

## Bases de données de test

**MySQL:**

- Host: `mysql` | Port: 3306 | User: testuser | Password: testpass | Database: testdb

**PostgreSQL:**

- Host: `postgresql` | Port: 5432 | User: testuser | Password: testpass | Database: testdb

---

## CI/CD Pipeline

### Tester

```bash
# Tester le webhook
./scripts/test-google-chat-notification.sh "VOTRE_WEBHOOK_URL"

# Tester localement
cd backend && go test ./...
npm run build
```

### Utilisation

**Développement:**

```bash
git add .
git commit -m "feat: ma modification"
git push
```

→ Images: `latest`, `main`

**Production:**

```bash
git tag -a v1.0.0 -m "Release 1.0.0"
git push --tags
```

→ Images: `v1.0.0`, `1.0.0`, `1.0`

### Pipeline (10-15 min)

1. Tests Frontend (~3 min) - ESLint + Build React
2. Tests Backend (~1 min) - Go vet + Tests unitaires
3. Build & Push Docker (~5-10 min) - Frontend + Backend → GHCR
4. Notification (~5s) - Google Chat avec statut

### Images Docker

```bash
# Pull depuis GHCR
docker pull ghcr.io/USERNAME/REPO/frontend:latest
docker pull ghcr.io/USERNAME/REPO/backend:latest

# Déploiement production
cp env.prod.example .env.prod
docker-compose -f docker-compose.prod.yml up -d
```

### Vérification

Après le push:

1. GitHub → Actions → Voir le workflow
2. Vérifier la notification Google Chat
3. GitHub → Packages → Voir les images

### Problèmes

- **Pipeline échoue** → Logs dans GitHub Actions
- **Pas de notification** → Vérifier le secret `GOOGLE_CHAT_WEBHOOK`
- **Permission denied** → Activer "Read and write permissions"

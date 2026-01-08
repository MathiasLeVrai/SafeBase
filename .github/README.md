# CI/CD Pipeline SafeBase

## ✅ Tests Validés

- ✅ Webhook Google Chat fonctionnel
- ✅ Tests backend (Go) passent
- ✅ Build frontend (React) fonctionne
- ✅ Go vet OK

## Configuration (3 étapes)

### 1. Ajouter le secret Google Chat

```
GitHub → Settings → Secrets and variables → Actions → New repository secret
```

- **Nom:** `GOOGLE_CHAT_WEBHOOK`
- **Valeur:** URL de votre webhook Google Chat

### 2. Activer les permissions

```
Settings → Actions → General → Workflow permissions
```

Sélectionner: **Read and write permissions**

### 3. Tester

```bash
./scripts/test-google-chat-notification.sh "VOTRE_WEBHOOK_URL"
```

## Utilisation

### Développement
```bash
git push origin main
```
→ Tests + Build + Push images avec tags: `latest`, `main`

### Production
```bash
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```
→ Tests + Build + Push images avec tags: `v1.0.0`, `1.0.0`, `1.0`

## Pipeline

1. **Tests Frontend** - ESLint + Build React
2. **Tests Backend** - Go vet + Tests unitaires
3. **Build Docker** - Frontend + Backend
4. **Push GHCR** - GitHub Container Registry
5. **Notification** - Google Chat (succès/échec)

## Images Docker

```bash
# Pull des images
docker pull ghcr.io/USERNAME/REPO/frontend:latest
docker pull ghcr.io/USERNAME/REPO/backend:latest

# Déploiement
docker-compose -f docker-compose.prod.yml up -d
```


#!/bin/bash

# Script pour initialiser les bases de données de test dans SafeBase
# Ce script ajoute automatiquement les BDD MySQL et PostgreSQL de test

echo "🐳 Initialisation des bases de données de test SafeBase..."
echo ""

# Attendre que le backend soit prêt
echo "⏳ Attente du backend..."
max_attempts=30
attempt=0
until curl -s http://localhost:8081/health > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -eq $max_attempts ]; then
    echo "❌ Le backend ne répond pas. Vérifiez que Docker est démarré avec 'docker compose up -d'"
    exit 1
  fi
  sleep 2
done
echo "✅ Backend prêt!"
echo ""

# Fonction pour obtenir un token JWT
get_token() {
  # Tenter de se connecter avec un utilisateur test, sinon le créer
  TOKEN=$(curl -s -X POST http://localhost:8081/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@safebase.local","password":"admin123"}' \
    | grep -o '"token":"[^"]*' | sed 's/"token":"//')
  
  if [ -z "$TOKEN" ]; then
    echo "📝 Création du compte administrateur..."
    TOKEN=$(curl -s -X POST http://localhost:8081/api/auth/register \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@safebase.local","password":"admin123","name":"Admin"}' \
      | grep -o '"token":"[^"]*' | sed 's/"token":"//')
  fi
  
  echo $TOKEN
}

TOKEN=$(get_token)

if [ -z "$TOKEN" ]; then
  echo "❌ Impossible d'obtenir un token d'authentification"
  exit 1
fi

echo "🔐 Authentification réussie!"
echo ""

# Ajouter MySQL
echo "📊 Ajout de MySQL..."
MYSQL_RESPONSE=$(curl -s -X POST http://localhost:8081/api/databases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "MySQL Test",
    "type": "mysql",
    "host": "mysql",
    "port": 3306,
    "username": "testuser",
    "password": "testpass",
    "database": "testdb"
  }')

if echo "$MYSQL_RESPONSE" | grep -q '"id"'; then
  echo "✅ MySQL Test ajouté avec succès!"
else
  echo "⚠️  MySQL Test existe déjà ou erreur lors de l'ajout"
fi

# Ajouter PostgreSQL
echo "📊 Ajout de PostgreSQL..."
PG_RESPONSE=$(curl -s -X POST http://localhost:8081/api/databases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "PostgreSQL Test",
    "type": "postgresql",
    "host": "postgresql",
    "port": 5432,
    "username": "testuser",
    "password": "testpass",
    "database": "testdb"
  }')

if echo "$PG_RESPONSE" | grep -q '"id"'; then
  echo "✅ PostgreSQL Test ajouté avec succès!"
else
  echo "⚠️  PostgreSQL Test existe déjà ou erreur lors de l'ajout"
fi

echo ""
echo "🎉 Configuration terminée!"
echo ""
echo "📌 Compte créé:"
echo "   Email: admin@safebase.local"
echo "   Mot de passe: admin123"
echo ""
echo "🌐 Accédez à SafeBase: http://localhost:3000"
echo ""


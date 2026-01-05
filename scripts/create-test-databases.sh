#!/bin/bash

echo "Création des bases de données de test via l'API..."

echo ""
echo "Création de MySQL..."
curl -X POST http://localhost:8081/api/databases \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MySQL Test",
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "username": "testuser",
    "password": "testpass",
    "database": "testdb"
  }'

echo ""
echo ""
echo "Création de PostgreSQL..."
curl -X POST http://localhost:8081/api/databases \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PostgreSQL Test",
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "username": "testuser",
    "password": "testpass",
    "database": "testdb"
  }'

echo ""
echo ""
echo "✅ Bases de données créées !"
echo ""
echo "Vérification:"
curl http://localhost:8081/api/databases | jq .


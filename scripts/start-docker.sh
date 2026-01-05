#!/bin/bash

echo "🐳 Vérification de Docker..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    echo "👉 Installez Docker Desktop depuis: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "🔍 Vérification du daemon Docker..."

if ! docker info &> /dev/null; then
    echo "⚠️  Docker daemon n'est pas démarré"
    echo "🚀 Tentative de démarrage de Docker Desktop..."
    
    if [ -d "/Applications/Docker.app" ]; then
        open -a Docker
        echo "⏳ Attente du démarrage de Docker (30 secondes)..."
        sleep 30
        
        for i in {1..30}; do
            if docker info &> /dev/null; then
                echo "✅ Docker est maintenant démarré!"
                break
            fi
            sleep 1
            echo -n "."
        done
        echo ""
        
        if ! docker info &> /dev/null; then
            echo "❌ Docker n'a pas démarré. Veuillez le lancer manuellement depuis Applications."
            exit 1
        fi
    else
        echo "❌ Docker Desktop n'est pas trouvé dans Applications"
        echo "👉 Installez Docker Desktop depuis: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
else
    echo "✅ Docker est déjà démarré"
fi

echo ""
echo "🚀 Démarrage des bases de données..."
cd "$(dirname "$0")/.."

if docker compose version &> /dev/null; then
    docker compose up -d mysql postgresql
elif docker-compose version &> /dev/null; then
    docker-compose up -d mysql postgresql
else
    echo "❌ docker-compose n'est pas disponible"
    exit 1
fi

echo ""
echo "✅ Conteneurs démarrés!"
echo ""
echo "Pour voir les logs: docker compose logs -f mysql"
echo "Pour vérifier l'état: docker compose ps"


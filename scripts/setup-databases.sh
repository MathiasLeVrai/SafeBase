#!/bin/bash

set -e

echo "=== Configuration des bases de données SafeBase ==="
echo ""

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker n'est pas installé"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        echo "❌ Docker daemon n'est pas démarré"
        echo ""
        echo "👉 Veuillez lancer Docker Desktop depuis Applications"
        echo "   ou exécutez: open -a Docker"
        return 1
    fi
    
    echo "✅ Docker est installé et fonctionne"
    return 0
}

check_docker_compose() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
        return 0
    elif docker-compose version &> /dev/null; then
        echo "docker-compose"
        return 0
    else
        echo ""
        return 1
    fi
}

start_with_docker() {
    echo ""
    echo "🐳 Démarrage avec Docker..."
    
    COMPOSE_CMD=$(check_docker_compose)
    if [ -z "$COMPOSE_CMD" ]; then
        echo "❌ docker-compose n'est pas disponible"
        return 1
    fi
    
    echo "📦 Lancement des conteneurs MySQL et PostgreSQL..."
    $COMPOSE_CMD up -d mysql postgresql
    
    echo ""
    echo "⏳ Attente du démarrage de MySQL (cela peut prendre 30-60 secondes)..."
    for i in {1..60}; do
        if docker exec safebase-mysql mysqladmin ping -h localhost -u root -prootpassword &> /dev/null 2>&1; then
            echo "✅ MySQL est prêt!"
            break
        fi
        if [ $i -eq 60 ]; then
            echo "⏰ Timeout: MySQL prend plus de temps que prévu"
            echo "   Vérifiez avec: docker logs safebase-mysql"
            return 1
        fi
        sleep 1
        echo -n "."
    done
    echo ""
    
    echo "⏳ Attente du démarrage de PostgreSQL..."
    sleep 5
    if docker exec safebase-postgres pg_isready -U testuser &> /dev/null; then
        echo "✅ PostgreSQL est prêt!"
    else
        echo "⚠️  PostgreSQL prend encore du temps, vérifiez avec: docker logs safebase-postgres"
    fi
    
    echo ""
    echo "✅ Bases de données démarrées avec succès!"
    echo ""
    echo "📊 Connexions DBeaver:"
    echo "   MySQL:     localhost:3306 | testuser / testpass | testdb"
    echo "   PostgreSQL: localhost:5432 | testuser / testpass | testdb"
}

install_with_homebrew() {
    echo ""
    echo "🍺 Installation avec Homebrew (alternative à Docker)..."
    echo ""
    
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew n'est pas installé"
        echo "   Installez-le depuis: https://brew.sh"
        return 1
    fi
    
    echo "📦 Installation de MySQL..."
    if ! brew list mysql &> /dev/null; then
        brew install mysql
        brew services start mysql
        sleep 5
        
        mysql -uroot -e "CREATE DATABASE IF NOT EXISTS testdb;" || true
        mysql -uroot -e "CREATE USER IF NOT EXISTS 'testuser'@'localhost' IDENTIFIED BY 'testpass';" || true
        mysql -uroot -e "GRANT ALL PRIVILEGES ON testdb.* TO 'testuser'@'localhost';" || true
        mysql -uroot -e "FLUSH PRIVILEGES;"
        echo "✅ MySQL configuré"
    else
        echo "✅ MySQL déjà installé"
    fi
    
    echo ""
    echo "📦 Installation de PostgreSQL..."
    if ! brew list postgresql@15 &> /dev/null && ! brew list postgresql &> /dev/null; then
        brew install postgresql@15
        brew services start postgresql@15
        sleep 5
        
        createuser -s testuser 2>/dev/null || true
        createdb -O testuser testdb 2>/dev/null || true
        psql -U testuser -d testdb -c "ALTER USER testuser WITH PASSWORD 'testpass';" 2>/dev/null || true
        echo "✅ PostgreSQL configuré"
    else
        echo "✅ PostgreSQL déjà installé"
    fi
    
    echo ""
    echo "✅ Bases de données installées localement!"
    echo ""
    echo "📊 Connexions DBeaver:"
    echo "   MySQL:     localhost:3306 | testuser / testpass | testdb"
    echo "   PostgreSQL: localhost:5432 | testuser / testpass | testdb"
    echo ""
    echo "⚠️  Note: Les mots de passe peuvent être différents si les services étaient déjà installés"
}

main() {
    if check_docker; then
        start_with_docker
    else
        echo ""
        echo "❌ Docker n'est pas disponible"
        echo ""
        read -p "Voulez-vous installer MySQL et PostgreSQL localement avec Homebrew? (o/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Oo]$ ]]; then
            install_with_homebrew
        else
            echo ""
            echo "Pour démarrer Docker:"
            echo "  1. Ouvrez Docker Desktop depuis Applications"
            echo "  2. Ou exécutez: open -a Docker"
            echo "  3. Relancez ce script"
            exit 1
        fi
    fi
}

main


#!/bin/bash

echo "🔧 Installation des outils de sauvegarde..."

# Check for mysqldump
if ! command -v mysqldump &> /dev/null; then
    echo "📦 Installation de mysql-client (contient mysqldump)..."
    if command -v brew &> /dev/null; then
        brew install mysql-client
        echo "✅ mysql-client installé"
        echo "⚠️  Ajoutez mysql-client au PATH si nécessaire:"
        echo "   export PATH=\"/opt/homebrew/opt/mysql-client/bin:\$PATH\""
    else
        echo "❌ Homebrew n'est pas installé"
        echo "👉 Installez mysql-client manuellement"
    fi
else
    echo "✅ mysqldump est déjà installé"
fi

# Check for pg_dump
if ! command -v pg_dump &> /dev/null; then
    echo "📦 Installation de postgresql (contient pg_dump)..."
    if command -v brew &> /dev/null; then
        brew install postgresql@15
        echo "✅ postgresql installé"
    else
        echo "❌ Homebrew n'est pas installé"
        echo "👉 Installez postgresql manuellement"
    fi
else
    echo "✅ pg_dump est déjà installé"
fi

echo ""
echo "📍 Pour utiliser mysqldump, vous devrez peut-être ajouter au PATH:"
echo "   export PATH=\"/opt/homebrew/opt/mysql-client/bin:\$PATH\""
echo "   export PATH=\"/opt/homebrew/opt/postgresql@15/bin:\$PATH\""


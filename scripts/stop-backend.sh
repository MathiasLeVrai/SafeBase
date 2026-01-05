#!/bin/bash

echo "Arrêt du backend SafeBase..."

PID=$(lsof -ti:8081 2>/dev/null | head -1)

if [ -z "$PID" ]; then
    echo "Aucun processus trouvé sur le port 8081"
    exit 0
fi

echo "Processus trouvé (PID: $PID)"
kill $PID 2>/dev/null

sleep 1

if lsof -ti:8081 >/dev/null 2>&1; then
    echo "Arrêt forcé..."
    kill -9 $PID 2>/dev/null
fi

sleep 1

if ! lsof -ti:8081 >/dev/null 2>&1; then
    echo "✅ Backend arrêté"
else
    echo "❌ Erreur lors de l'arrêt"
fi


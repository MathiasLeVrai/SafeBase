#!/bin/bash

# Test du webhook Google Chat
# Usage: ./scripts/test-google-chat-notification.sh <WEBHOOK_URL>

if [ -z "$1" ]; then
    echo "Usage: $0 <WEBHOOK_URL>"
    exit 1
fi

echo "📧 Envoi d'une notification de test..."

curl -k -X POST "$1" \
  -H "Content-Type: application/json" \
  -d '{"text": "ca marche le boss"}' \
  2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Notification envoyée avec succès"
else
    echo ""
    echo "❌ Erreur lors de l'envoi"
    exit 1
fi


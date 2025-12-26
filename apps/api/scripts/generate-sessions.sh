#!/bin/bash

# Script pour générer les sessions récurrentes
# Usage: ./scripts/generate-sessions.sh [AUTH_TOKEN] [WEEKS_AHEAD]

AUTH_TOKEN=${1:-"your-auth-token-here"}
WEEKS_AHEAD=${2:-4}
API_URL=${API_URL:-"http://localhost:3000"}

echo "🔄 Génération des sessions pour toutes les classes actives..."
echo "📅 Semaines à l'avance: $WEEKS_AHEAD"
echo ""

response=$(curl -s -X POST \
  "$API_URL/api/recurring-sessions/generate-all?weeksAhead=$WEEKS_AHEAD" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json")

echo "✅ Réponse:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""
echo "📱 Vous pouvez maintenant voir vos sessions dans l'application mobile!"

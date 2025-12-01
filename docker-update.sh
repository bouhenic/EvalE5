#!/bin/bash

# Script de mise à jour de l'application Docker
# Ce script met à jour l'application depuis GitHub et reconstruit l'image Docker

set -e  # Arrêter en cas d'erreur

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🔄 Mise à jour de l'application EvalE5                   ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Récupérer les dernières modifications depuis GitHub
echo "📥 Récupération des dernières modifications depuis GitHub..."
git fetch origin
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la récupération des modifications"
    exit 1
fi

echo "✅ Modifications récupérées"
echo ""

# 2. Arrêter le conteneur actuel
echo "🛑 Arrêt du conteneur actuel..."
docker-compose down

echo "✅ Conteneur arrêté"
echo ""

# 3. Reconstruire l'image Docker avec les nouveaux fichiers
echo "🔨 Reconstruction de l'image Docker..."
docker-compose build --no-cache

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la construction de l'image"
    exit 1
fi

echo "✅ Image reconstruite"
echo ""

# 4. Redémarrer le conteneur
echo "🚀 Démarrage du conteneur..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du démarrage du conteneur"
    exit 1
fi

echo "✅ Conteneur démarré"
echo ""

# 5. Afficher les logs
echo "📋 Logs du conteneur (Ctrl+C pour quitter):"
echo ""
docker-compose logs -f

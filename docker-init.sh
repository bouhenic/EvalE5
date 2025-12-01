#!/bin/bash

# Script d'initialisation pour Docker
# Ce script prépare l'environnement avant le premier démarrage Docker

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║  Initialisation de l'application EvalE5 pour Docker       ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 1. Créer les dossiers nécessaires
echo "📁 Création des dossiers nécessaires..."
mkdir -p backend/export backend/data backend/ssl
chmod 755 backend/export backend/data backend/ssl
echo "✅ Dossiers créés"
echo ""

# 2. Créer le fichier auth.json s'il n'existe pas
if [ ! -f "backend/config/auth.json" ]; then
    echo "🔐 Création du fichier d'authentification..."
    cp backend/config/auth.example.json backend/config/auth.json
    echo "✅ Fichier auth.json créé avec le mot de passe par défaut"
    echo "⚠️  IMPORTANT: Changez le mot de passe avec: node tools/change-password.js"
else
    echo "✅ Fichier auth.json existe déjà"
fi
echo ""

# 3. Vérifier/Créer les certificats SSL
if [ ! -f "backend/ssl/localhost+2.pem" ]; then
    echo "🔒 Génération des certificats SSL auto-signés..."

    # Vérifier si OpenSSL est installé
    if ! command -v openssl &> /dev/null; then
        echo "❌ OpenSSL n'est pas installé"
        echo "Sur Ubuntu/Debian: sudo apt-get install openssl"
        echo "Sur CentOS/RHEL: sudo yum install openssl"
        exit 1
    fi

    # Générer les certificats auto-signés
    openssl req -x509 -newkey rsa:4096 -nodes \
        -keyout backend/ssl/localhost+2-key.pem \
        -out backend/ssl/localhost+2.pem \
        -days 365 \
        -subj "/C=FR/ST=Ile-de-France/L=Paris/O=Lycee/OU=BTS CIEL/CN=localhost"

    if [ $? -eq 0 ]; then
        echo "✅ Certificats SSL générés"
        echo "⚠️  Note: Ces certificats sont auto-signés, votre navigateur affichera un avertissement"
    else
        echo "❌ Erreur lors de la génération des certificats"
        exit 1
    fi
else
    echo "✅ Certificats SSL existent déjà"
fi
echo ""

# 4. Vérifier les fichiers de données
if [ ! -f "backend/data/eleves.json" ]; then
    echo "⚠️  backend/data/eleves.json n'existe pas"
    echo "L'application démarrera mais la liste des élèves sera vide"
fi

if [ ! -f "backend/data/evaluations.json" ]; then
    echo "⚠️  backend/data/evaluations.json n'existe pas"
    echo "L'application démarrera mais sans évaluations"
fi
echo ""

# 5. Résumé
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║  ✅ Initialisation terminée !                              ║"
echo "║                                                            ║"
echo "║  Vous pouvez maintenant démarrer l'application :          ║"
echo "║  $ docker-compose up -d                                    ║"
echo "║                                                            ║"
echo "║  Accès :                                                   ║"
echo "║  - HTTPS: https://localhost:3443                           ║"
echo "║  - HTTP:  http://localhost:3000                            ║"
echo "║                                                            ║"
echo "║  Identifiants par défaut :                                ║"
echo "║  - Utilisateur: professeur                                ║"
echo "║  - Mot de passe: password123                              ║"
echo "║                                                            ║"
echo "║  ⚠️  IMPORTANT: Changez le mot de passe !                  ║"
echo "║  $ docker exec -it eval-e5-app node tools/change-password.js ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"

#!/bin/bash

# Script d'installation des certificats SSL pour l'application

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║  Configuration SSL pour l'application d'évaluation E5     ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier si mkcert est installé
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert n'est pas installé"
    echo ""
    echo "Installation de mkcert..."

    # Vérifier si Homebrew est installé
    if command -v brew &> /dev/null; then
        brew install mkcert
    else
        echo "❌ Homebrew n'est pas installé"
        echo "Veuillez installer Homebrew depuis https://brew.sh/"
        exit 1
    fi
fi

echo "✅ mkcert est installé"
echo ""

# Installer l'autorité de certification locale
echo "📋 Installation de l'autorité de certification locale..."
echo "⚠️  Vous allez devoir entrer votre mot de passe macOS"
echo ""

mkcert -install

if [ $? -eq 0 ]; then
    echo "✅ Autorité de certification installée"
else
    echo "❌ Erreur lors de l'installation de l'autorité de certification"
    exit 1
fi

echo ""

# Générer les certificats
cd "$(dirname "$0")/.."

if [ ! -f "backend/ssl/localhost+2.pem" ]; then
    echo "📜 Génération des certificats SSL..."
    cd backend/ssl
    mkcert localhost 127.0.0.1 ::1

    if [ $? -eq 0 ]; then
        echo "✅ Certificats générés avec succès"
    else
        echo "❌ Erreur lors de la génération des certificats"
        exit 1
    fi
else
    echo "✅ Les certificats existent déjà"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║  ✅ Configuration SSL terminée !                           ║"
echo "║                                                            ║"
echo "║  Vous pouvez maintenant démarrer l'application :          ║"
echo "║  $ npm start                                               ║"
echo "║                                                            ║"
echo "║  Puis accéder à : https://localhost:3443                   ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"

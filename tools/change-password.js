#!/usr/bin/env node

/**
 * Script pour changer le mot de passe de l'utilisateur
 * Usage: node tools/change-password.js
 */

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const authConfigPath = path.join(__dirname, '../backend/config/auth.json');

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('=== Changement de mot de passe ===\n');

  // Vérifier si le fichier existe
  if (!fs.existsSync(authConfigPath)) {
    console.log('Le fichier auth.json n\'existe pas. Copie depuis auth.example.json...');
    const examplePath = path.join(__dirname, '../backend/config/auth.example.json');
    fs.copyFileSync(examplePath, authConfigPath);
    console.log('Fichier créé!\n');
  }

  const authConfig = JSON.parse(fs.readFileSync(authConfigPath, 'utf8'));

  const username = await question('Nom d\'utilisateur (professeur): ') || 'professeur';
  const newPassword = await question('Nouveau mot de passe: ');

  if (!newPassword || newPassword.length < 6) {
    console.error('Le mot de passe doit contenir au moins 6 caractères.');
    rl.close();
    process.exit(1);
  }

  // Hasher le mot de passe
  console.log('\nHashage du mot de passe...');
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Mettre à jour ou ajouter l'utilisateur
  const userIndex = authConfig.users.findIndex(u => u.username === username);

  if (userIndex >= 0) {
    authConfig.users[userIndex].password = hashedPassword;
    console.log(`Mot de passe mis à jour pour l'utilisateur "${username}"`);
  } else {
    authConfig.users.push({ username, password: hashedPassword });
    console.log(`Nouvel utilisateur "${username}" créé`);
  }

  // Sauvegarder
  fs.writeFileSync(authConfigPath, JSON.stringify(authConfig, null, 2));
  console.log('\nMot de passe enregistré avec succès!');
  console.log(`Fichier: ${authConfigPath}\n`);

  rl.close();
}

main().catch(err => {
  console.error('Erreur:', err);
  rl.close();
  process.exit(1);
});

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Charger les utilisateurs
const authConfigPath = path.join(__dirname, '../config/auth.json');
let authConfig = JSON.parse(fs.readFileSync(authConfigPath, 'utf8'));

// Route de connexion
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    // Rechercher l'utilisateur
    const user = authConfig.users.find(u => u.username === username);

    if (!user) {
        return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Vérifier le mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Créer la session
    req.session.authenticated = true;
    req.session.username = username;

    res.json({
        success: true,
        message: 'Connexion réussie',
        username: username
    });
});

// Route de déconnexion
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
        }
        res.json({ success: true, message: 'Déconnexion réussie' });
    });
});

// Route pour vérifier l'authentification
router.get('/check', (req, res) => {
    if (req.session.authenticated) {
        res.json({
            authenticated: true,
            username: req.session.username
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Route pour changer le mot de passe (uniquement si authentifié)
router.post('/change-password', async (req, res) => {
    if (!req.session.authenticated) {
        return res.status(401).json({ error: 'Non authentifié' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
    }

    const user = authConfig.users.find(u => u.username === req.session.username);

    // Vérifier l'ancien mot de passe
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!passwordMatch) {
        return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    user.password = hashedPassword;

    // Sauvegarder dans le fichier
    fs.writeFileSync(authConfigPath, JSON.stringify(authConfig, null, 2));

    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
});

module.exports = router;

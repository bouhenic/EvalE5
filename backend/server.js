const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const config = require('./config/config.json');
const authConfig = require('./config/auth.json');

const app = express();
const PORT = config.port || 3000;
const HTTPS_PORT = config.httpsPort || 3443;

// Charger les certificats SSL
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'ssl/localhost+2-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl/localhost+2.pem'))
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration des sessions
app.use(session({
  secret: authConfig.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // Activé pour HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Routes d'authentification (publiques)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Route publique pour la page de login
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Middleware d'authentification pour les routes protégées
const { requireAuth } = require('./middleware/auth');

// Servir les fichiers statiques (frontend) - protégés
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes API protégées
const apiRoutes = require('./routes/api');
app.use('/api', requireAuth, apiRoutes);

// Route pour la page d'accueil - protégée
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Route pour la page d'évaluation - protégée
app.get('/evaluation/:id', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/evaluation.html'));
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur HTTPS
https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎓 Serveur d'évaluation BTS CIEL - Épreuve E5           ║
║                                                           ║
║   🔒 Mode HTTPS activé                                    ║
║   📡 Port: ${HTTPS_PORT}                                     ║
║   🌐 URL: https://localhost:${HTTPS_PORT}                    ║
║                                                           ║
║   📂 Modèle Excel: ${config.fichiers.modele_excel}
║   💾 Exports: ${config.paths.export}
║                                                           ║
║   ✅ Certificats SSL: mkcert (localhost)                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;

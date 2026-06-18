const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const config = require('./config/config.json');

// Charger la configuration d'authentification avec gestion d'erreur
let authConfig;
const authConfigPath = path.join(__dirname, 'config/auth.json');
try {
  authConfig = require('./config/auth.json');
} catch (error) {
  console.error('❌ ERREUR: Fichier auth.json non trouvé !');
  console.error('📝 Créez le fichier depuis l\'exemple:');
  console.error('   cp backend/config/auth.example.json backend/config/auth.json');
  console.error('   ou exécutez: ./docker-init.sh');
  process.exit(1);
}

const app = express();
const PORT = config.port || 3000;
const HTTPS_PORT = config.httpsPort || 3443;

// Charger les certificats SSL avec gestion d'erreur
let sslOptions = null;
const sslKeyPath = path.join(__dirname, 'ssl/localhost+2-key.pem');
const sslCertPath = path.join(__dirname, 'ssl/localhost+2.pem');

try {
  sslOptions = {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath)
  };
  console.log('✅ Certificats SSL chargés');
} catch (error) {
  console.warn('⚠️  Certificats SSL non trouvés, HTTPS désactivé');
  console.warn('📝 Générez les certificats avec: ./docker-init.sh ou ./tools/setup-ssl.sh');
}

// Middleware
app.use(cors());
// Limite relevée pour accepter les PDF encodés en base64 (import d'élèves).
app.use(bodyParser.json({ limit: '25mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '25mb' }));

// Configuration des sessions
app.use(session({
  secret: authConfig.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Désactivé pour permettre HTTP et HTTPS
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

// Migration des ids vers le format 2026XX (idempotente, au démarrage)
const dataService = require('./services/dataService');
dataService.migrerIds()
  .then(({ change, total }) => {
    if (change) {
      console.log(`🔢 Migration des ids effectuée (${total} élèves renumérotés au format 2026XX)`);
    }
  })
  .catch((err) => console.error('⚠️  Migration des ids échouée:', err.message));

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

// Route pour la page de changement de mot de passe - protégée
app.get('/change-password.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/change-password.html'));
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
if (sslOptions) {
  // Mode HTTPS si les certificats sont disponibles
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
║   ✅ Certificats SSL chargés                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });

  // Démarrer aussi HTTP pour la compatibilité
  app.listen(PORT, () => {
    console.log(`📡 HTTP également disponible sur le port ${PORT}`);
  });
} else {
  // Mode HTTP seulement si pas de certificats
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎓 Serveur d'évaluation BTS CIEL - Épreuve E5           ║
║                                                           ║
║   📡 Port: ${PORT}                                        ║
║   🌐 URL: http://localhost:${PORT}                        ║
║                                                           ║
║   📂 Modèle Excel: ${config.fichiers.modele_excel}
║   💾 Exports: ${config.paths.export}
║                                                           ║
║   ⚠️  Mode HTTP (certificats SSL non trouvés)             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

module.exports = app;

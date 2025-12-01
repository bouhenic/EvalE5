const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config/config.json');

const app = express();
const PORT = config.port || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir les fichiers statiques (frontend)
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes API
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Route pour la page d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Route pour la page d'évaluation
app.get('/evaluation/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/evaluation.html'));
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage du serveur
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
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;

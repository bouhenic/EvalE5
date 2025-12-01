// Middleware pour vérifier l'authentification
function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    }

    // Si c'est une requête API, renvoyer une erreur JSON
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ error: 'Non authentifié' });
    }

    // Sinon, rediriger vers la page de login
    res.redirect('/login.html');
}

module.exports = { requireAuth };

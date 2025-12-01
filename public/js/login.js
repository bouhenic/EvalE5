document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    try {
        // URL dynamique qui s'adapte au protocole (HTTP ou HTTPS)
        const loginUrl = `${window.location.protocol}//${window.location.host}/api/auth/login`;
        const response = await fetch(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Connexion réussie, rediriger vers la page d'accueil
            window.location.href = '/';
        } else {
            // Afficher le message d'erreur
            errorMessage.textContent = data.error || 'Identifiants incorrects';
            errorMessage.classList.add('show');

            // Masquer le message après 3 secondes
            setTimeout(() => {
                errorMessage.classList.remove('show');
            }, 3000);
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        errorMessage.textContent = 'Erreur de connexion au serveur';
        errorMessage.classList.add('show');
    }
});

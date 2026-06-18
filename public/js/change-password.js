// Fonction pour afficher un message
function afficherMessage(texte, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = texte;
    messageDiv.className = `message ${type} show`;

    // Masquer le message après 5 secondes
    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 5000);
}

// Fonction pour retourner à l'accueil
function retourAccueil() {
    window.location.href = '/';
}

// Gestion du formulaire de changement de mot de passe
document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Vérifier que les mots de passe correspondent
    if (newPassword !== confirmPassword) {
        afficherMessage('Les nouveaux mots de passe ne correspondent pas', 'error');
        return;
    }

    // Vérifier la longueur minimale
    if (newPassword.length < 6) {
        afficherMessage('Le nouveau mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    if (oldPassword === newPassword) {
        afficherMessage('Le nouveau mot de passe doit être différent de l\'ancien', 'error');
        return;
    }

    try {
        const API_BASE = `${window.location.protocol}//${window.location.host}/api`;
        const response = await fetch(`${API_BASE}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                oldPassword: oldPassword,
                newPassword: newPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            afficherMessage('Mot de passe modifié avec succès ! Redirection...', 'success');

            // Réinitialiser le formulaire
            document.getElementById('changePasswordForm').reset();

            // Rediriger vers l'accueil après 2 secondes
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            afficherMessage(data.error || 'Erreur lors du changement de mot de passe', 'error');
            // Focus sur le champ ancien mot de passe en cas d'erreur
            document.getElementById('oldPassword').focus();
        }
    } catch (error) {
        console.error('Erreur:', error);
        afficherMessage('Erreur de connexion au serveur', 'error');
    }
});

// Focus automatique sur le premier champ au chargement
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('oldPassword').focus();
});

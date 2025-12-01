# Guide d'Authentification

L'application est maintenant protégée par un système d'authentification pour garantir que seul le professeur peut y accéder.

## 🔐 Connexion

### Accès à l'application

1. Ouvrez l'application dans votre navigateur : `http://localhost:3000`
2. Vous serez automatiquement redirigé vers la page de connexion
3. Utilisez vos identifiants pour vous connecter

### Identifiants par défaut

**⚠️ IMPORTANT: Changez le mot de passe par défaut avant d'utiliser l'application en production!**

- **Nom d'utilisateur:** `professeur`
- **Mot de passe:** `password123`

## 🔧 Changer le mot de passe

### Méthode 1 : Utiliser le script (Recommandé)

```bash
node tools/change-password.js
```

Le script vous demandera :
1. Le nom d'utilisateur (laissez vide pour "professeur")
2. Le nouveau mot de passe (minimum 6 caractères)

### Méthode 2 : Depuis l'application

Une fois connecté, vous pouvez changer votre mot de passe via l'API :

```javascript
// Exemple de requête pour changer le mot de passe
fetch('http://localhost:3000/api/auth/change-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    oldPassword: 'ancien_mot_de_passe',
    newPassword: 'nouveau_mot_de_passe'
  })
})
```

## 📁 Fichiers de configuration

### `backend/config/auth.json`

**⚠️ CE FICHIER N'EST PAS SUIVI PAR GIT (pour la sécurité)**

Ce fichier contient :
- Les utilisateurs autorisés
- Les mots de passe hashés (bcrypt)
- Le secret de session

Structure :
```json
{
  "users": [
    {
      "username": "professeur",
      "password": "$2b$10$hash_bcrypt..."
    }
  ],
  "sessionSecret": "votre-secret-unique"
}
```

### Première installation

Si le fichier `auth.json` n'existe pas, copiez le fichier exemple :

```bash
cp backend/config/auth.example.json backend/config/auth.json
```

Puis changez immédiatement le mot de passe avec :

```bash
node tools/change-password.js
```

## 🔒 Sécurité

### Points de sécurité implémentés

✅ Mots de passe hashés avec bcrypt (10 rounds)
✅ Sessions sécurisées avec express-session
✅ Cookies HTTP-only
✅ Protection de toutes les routes API et pages
✅ Fichier d'authentification exclu de Git

### Recommandations pour la production

1. **Changez le mot de passe par défaut**
2. **Changez le secret de session** dans `auth.json`
3. **Utilisez HTTPS** en production (mettez `cookie.secure: true` dans `server.js`)
4. **Utilisez un mot de passe fort** (12+ caractères, mélangeant majuscules, minuscules, chiffres et symboles)
5. **Sauvegardez le fichier auth.json** en lieu sûr

## 🚪 Déconnexion

- Cliquez sur le bouton "Déconnexion" en haut à droite de la page
- Ou fermez simplement le navigateur (la session expire après 24h)

## ❓ Problèmes courants

### "Identifiants incorrects"
- Vérifiez que vous utilisez le bon nom d'utilisateur et mot de passe
- Si vous avez oublié le mot de passe, utilisez le script `change-password.js`

### "Non authentifié" après connexion
- Vérifiez que les cookies sont activés dans votre navigateur
- Essayez de vider le cache et les cookies du site

### Fichier auth.json manquant
```bash
cp backend/config/auth.example.json backend/config/auth.json
node tools/change-password.js
```

## 👥 Ajouter d'autres utilisateurs

Pour ajouter un autre utilisateur, utilisez le script :

```bash
node tools/change-password.js
```

Et entrez un nouveau nom d'utilisateur quand demandé.

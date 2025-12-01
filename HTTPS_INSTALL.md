# Installation HTTPS - Guide rapide

## ⚡ Installation rapide

Pour activer HTTPS sur votre machine, suivez ces 3 étapes :

### Étape 1 : Installer l'autorité de certification

```bash
mkcert -install
```

**Vous devrez entrer votre mot de passe macOS.**

Cette commande installe une autorité de certification locale dans votre trousseau macOS, permettant à votre navigateur de faire confiance aux certificats.

### Étape 2 : Démarrer le serveur

```bash
npm start
```

### Étape 3 : Accéder à l'application

Ouvrez votre navigateur et allez à :

**https://localhost:3443**

## ✅ Vérification

Vous devriez voir :
- 🔒 Un cadenas vert dans la barre d'adresse
- Aucun avertissement de sécurité
- "Connexion sécurisée" quand vous cliquez sur le cadenas

## ❌ Si ça ne fonctionne pas

### Certificat non approuvé

Si vous voyez "Votre connexion n'est pas privée" :

1. Assurez-vous d'avoir exécuté `mkcert -install`
2. Redémarrez votre navigateur
3. Réessayez

### Autre problème

Consultez le guide complet : [HTTPS_SETUP.md](./HTTPS_SETUP.md)

## 📝 Notes

- Les certificats sont déjà générés dans `backend/ssl/`
- Ils sont valides jusqu'en **Mars 2028**
- Ils fonctionnent pour `localhost`, `127.0.0.1` et `::1`

# Configuration HTTPS avec mkcert

L'application utilise maintenant HTTPS pour une sécurité renforcée, avec des certificats SSL locaux générés par mkcert.

## 🔒 Pourquoi HTTPS en local ?

- **Sécurité** : Les mots de passe et données sont chiffrés
- **Cookies sécurisés** : Les sessions utilisent des cookies secure
- **Production-ready** : Fonctionne comme en production
- **Pas d'avertissement** : Avec mkcert, votre navigateur fait confiance aux certificats

## 📋 Installation initiale (déjà fait)

Les certificats ont été générés avec mkcert. Voici ce qui a été configuré :

### 1. Installation de mkcert

```bash
brew install mkcert
```

### 2. Installation de l'autorité de certification locale

**IMPORTANT** : Vous devez exécuter cette commande manuellement :

```bash
mkcert -install
```

Cette commande :
- Crée une autorité de certification (CA) locale
- L'installe dans le trousseau système de macOS
- Permet aux navigateurs de faire confiance aux certificats générés

**Vous devrez entrer votre mot de passe macOS.**

### 3. Génération des certificats

Les certificats ont été générés pour :
- `localhost`
- `127.0.0.1`
- `::1` (IPv6)

Fichiers créés :
- `backend/ssl/localhost+2.pem` (certificat)
- `backend/ssl/localhost+2-key.pem` (clé privée)

**Ces fichiers ne sont pas suivis par Git** (ajoutés au .gitignore)

## 🚀 Utilisation

### Démarrer le serveur

```bash
npm start
```

Le serveur démarre maintenant en HTTPS sur le port **3443** :

```
🌐 URL: https://localhost:3443
```

### Accéder à l'application

Ouvrez votre navigateur et allez à :

**https://localhost:3443**

⚠️ **Première fois** : Si vous n'avez pas exécuté `mkcert -install`, votre navigateur affichera un avertissement de sécurité. C'est normal pour un certificat auto-signé.

## ✅ Vérifier que tout fonctionne

### 1. Vérifier l'installation de mkcert

```bash
mkcert -install
```

Si déjà installé, vous verrez :
```
The local CA is already installed in the system trust store! 👍
```

### 2. Vérifier les certificats

```bash
ls -la backend/ssl/
```

Vous devriez voir :
```
localhost+2.pem
localhost+2-key.pem
```

### 3. Tester la connexion

1. Ouvrez https://localhost:3443
2. Vérifiez le cadenas 🔒 dans la barre d'adresse
3. Cliquez sur le cadenas → Devrait montrer "Connexion sécurisée"

## 🔧 Configuration

### Ports utilisés

- **HTTP** : 3000 (désactivé pour forcer HTTPS)
- **HTTPS** : 3443 (configuré dans `backend/config/config.json`)

### Changer le port HTTPS

Éditez `backend/config/config.json` :

```json
{
  "port": 3000,
  "httpsPort": 3443,  // ← Changez ce port
  ...
}
```

### Cookies sécurisés

Les cookies de session sont maintenant configurés en mode `secure: true` :
- Ne sont transmis que via HTTPS
- Protection contre les attaques man-in-the-middle
- Configuration dans `backend/server.js:32`

## 🔍 Résolution de problèmes

### Erreur "self signed certificate"

**Problème** : Le navigateur affiche "Votre connexion n'est pas privée"

**Solution** :
```bash
mkcert -install
```

Puis redémarrez votre navigateur.

### Erreur "ENOENT: no such file or directory, open 'backend/ssl/localhost+2.pem'"

**Problème** : Les certificats n'existent pas

**Solution** :
```bash
cd backend/ssl
mkcert localhost 127.0.0.1 ::1
```

### Erreur "Cannot GET /"

**Problème** : Vous accédez en HTTP au lieu de HTTPS

**Solution** : Utilisez `https://` dans l'URL, pas `http://`
```
✅ https://localhost:3443
❌ http://localhost:3443
```

### Les cookies ne fonctionnent pas

**Problème** : La session n'est pas maintenue après connexion

**Vérifications** :
1. Utilisez bien HTTPS (pas HTTP)
2. Les cookies secure nécessitent HTTPS
3. Vérifiez dans les DevTools → Application → Cookies

## 🔄 Régénérer les certificats

Si vous devez régénérer les certificats :

```bash
cd backend/ssl
rm *.pem
mkcert localhost 127.0.0.1 ::1
```

Les certificats expirent après **3 ans** (Mars 2028).

## 🌐 Certificats pour d'autres domaines

Si vous voulez accéder à l'application via un autre nom (ex: `eval.local`) :

```bash
cd backend/ssl
mkcert localhost 127.0.0.1 ::1 eval.local
```

N'oubliez pas d'ajouter `eval.local` à votre fichier `/etc/hosts` :

```bash
sudo nano /etc/hosts
```

Ajoutez :
```
127.0.0.1  eval.local
```

## 📱 Accès depuis un autre appareil

Pour accéder depuis un téléphone ou tablette sur le même réseau :

1. Trouvez votre IP locale :
```bash
ipconfig getifaddr en0
```

2. Générez un nouveau certificat avec votre IP :
```bash
cd backend/ssl
mkcert localhost 127.0.0.1 ::1 192.168.1.x  # Remplacez par votre IP
```

3. Installez mkcert CA sur l'appareil mobile (voir documentation mkcert)

## 🔐 Sécurité

### Fichiers sensibles

Ces fichiers **ne doivent JAMAIS être commités** sur Git :
- `backend/ssl/*.pem` (certificats et clés privées)
- `backend/config/auth.json` (mots de passe hashés)

Ils sont automatiquement ignorés par `.gitignore`.

### En production

⚠️ **N'utilisez PAS ces certificats en production !**

En production, utilisez :
- Let's Encrypt (gratuit, renouvelable automatiquement)
- Un certificat SSL commercial
- Un reverse proxy (nginx, Apache) avec SSL

## 📚 Ressources

- [Documentation mkcert](https://github.com/FiloSottile/mkcert)
- [MDN : Transport Layer Security](https://developer.mozilla.org/fr/docs/Web/Security/Transport_Layer_Security)
- [OWASP : Transport Layer Protection](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)

## ✨ Avantages de cette configuration

✅ Certificats de confiance (pas d'avertissement)
✅ Environnement de développement identique à la production
✅ Cookies sécurisés
✅ Chiffrement des données
✅ Facile à configurer et maintenir
✅ Gratuit et open source

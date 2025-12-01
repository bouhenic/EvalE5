# Docker - Démarrage Rapide

## 🚀 Installation rapide sur une nouvelle machine

Si vous venez de cloner le dépôt sur une nouvelle machine, suivez ces étapes **DANS L'ORDRE** :

### 1. Initialiser l'environnement (⚠️ OBLIGATOIRE)

```bash
./docker-init.sh
```

**⚠️ IMPORTANT** : Vous **DEVEZ** exécuter ce script **AVANT** `docker-compose up` !

Ce script va :
- ✅ Créer les dossiers nécessaires (`backend/export`, `backend/data`, `backend/ssl`)
- ✅ Créer le fichier `backend/config/auth.json` depuis l'exemple
- ✅ Générer des certificats SSL auto-signés
- ✅ Vérifier que tout est prêt

Sans ce script, Docker ne pourra pas démarrer correctement.

### 2. Démarrer l'application

```bash
docker-compose up -d
```

### 3. Accéder à l'application

Selon si vous avez exécuté le script d'initialisation :

**Avec certificats SSL** (après `./docker-init.sh`):
- **HTTPS** : https://localhost:3443 _(recommandé)_
- **HTTP** : http://localhost:3000

**Sans certificats SSL** :
- **HTTP** : http://localhost:3000

⚠️ **Note** : Les certificats SSL sont auto-signés, votre navigateur affichera un avertissement. C'est normal et sécurisé pour un usage local.

### 4. Se connecter

**Identifiants par défaut** :
- Utilisateur : `professeur`
- Mot de passe : `password123`

### 5. Changer le mot de passe (IMPORTANT)

```bash
docker exec -it eval-e5-app node tools/change-password.js
```

## 📋 Prérequis

- Docker installé ([Installation Docker](https://docs.docker.com/get-docker/))
- Docker Compose installé ([Installation Docker Compose](https://docs.docker.com/compose/install/))
- Ports 3000 et 3443 disponibles

## 🔧 Commandes utiles

### Voir les logs

```bash
docker-compose logs -f
```

### Redémarrer l'application

```bash
docker-compose restart
```

### Arrêter l'application

```bash
docker-compose down
```

### Reconstruire après une mise à jour

```bash
git pull
docker-compose up -d --build
```

## ❓ Problèmes courants

### Erreur "Are you trying to mount a directory onto a file (or vice-versa)?"

**Message complet** :
```
error mounting "/home/user/EvalE5/backend/config/auth.json" to rootfs
```

**Cause** : Le fichier `auth.json` n'existe pas avant le démarrage de Docker. Docker crée un dossier vide à la place, causant une erreur de montage.

**Solution** : Exécutez le script d'initialisation **AVANT** `docker-compose up`
```bash
./docker-init.sh
docker-compose up -d
```

### Erreur "Cannot find module 'backend/config/auth.json'"

**Solution** : Exécutez le script d'initialisation
```bash
./docker-init.sh
docker-compose restart
```

### Erreur "ENOENT: no such file or directory, open 'backend/ssl/localhost+2.pem'"

**Solution** : Exécutez le script d'initialisation
```bash
./docker-init.sh
docker-compose restart
```

### Port déjà utilisé

**Erreur** : `Bind for 0.0.0.0:3443 failed: port is already allocated`

**Solution** : Un autre service utilise le port. Arrêtez-le ou changez le port dans `docker-compose.yml`

```yaml
ports:
  - "3000:3000"
  - "8443:3443"  # Utilisez 8443 au lieu de 3443
```

### Permission denied sur les volumes

**Solution** : Vérifiez les permissions
```bash
sudo chmod 755 backend/export backend/data backend/ssl
```

### L'application ne démarre pas

**Diagnostic** :
```bash
# Voir les logs détaillés
docker-compose logs

# Vérifier que le conteneur est lancé
docker ps -a

# Accéder au conteneur pour déboguer
docker exec -it eval-e5-app /bin/bash
```

## 🔄 Mise à jour de l'application

```bash
# 1. Récupérer les dernières modifications
git pull

# 2. Reconstruire l'image
docker-compose build

# 3. Redémarrer avec la nouvelle image
docker-compose up -d
```

## 🗑️ Réinitialisation complète

```bash
# Arrêter et supprimer les conteneurs
docker-compose down

# Supprimer l'image
docker rmi evale5-eval-e5

# Réinitialiser
./docker-init.sh
docker-compose up -d
```

## 📚 Documentation complète

Pour plus d'informations, consultez [DOCKER.md](./DOCKER.md)

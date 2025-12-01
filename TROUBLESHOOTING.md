# Dépannage

## 🔍 Problèmes courants et solutions

### 1. L'application ne fonctionne pas en HTTP (localhost:3000)

**Symptôme** : Quand vous accédez à http://localhost:3000, l'application ne charge pas ou affiche des erreurs.

**Cause** : Le navigateur utilise une version mise en cache des anciens fichiers JavaScript qui avaient des URLs codées en dur vers HTTPS.

**Solution** : Vider le cache du navigateur

#### Chrome / Edge / Brave
1. Appuyez sur **Cmd+Shift+Delete** (Mac) ou **Ctrl+Shift+Delete** (Windows/Linux)
2. Sélectionnez **"Images et fichiers en cache"**
3. Choisissez **"Depuis toujours"**
4. Cliquez sur **"Effacer les données"**

#### Firefox
1. Appuyez sur **Cmd+Shift+Delete** (Mac) ou **Ctrl+Shift+Delete** (Windows/Linux)
2. Cochez **"Cache"**
3. Cliquez sur **"Effacer maintenant"**

#### Safari
1. Menu **Développement** → **Vider les caches**
2. Ou appuyez sur **Cmd+Option+E**

#### Solution rapide : Navigation privée
Ouvrez une fenêtre de navigation privée / incognito pour tester sans cache :
- **Chrome/Edge** : Cmd+Shift+N (Mac) ou Ctrl+Shift+N (Windows)
- **Firefox** : Cmd+Shift+P (Mac) ou Ctrl+Shift+P (Windows)
- **Safari** : Cmd+Shift+N

---

### 2. Avertissement de sécurité HTTPS même avec mkcert installé

**Symptôme** : Le navigateur affiche "Votre connexion n'est pas privée" ou demande d'accepter un risque de sécurité sur https://localhost:3443

**Cause** : L'autorité de certification (CA) de mkcert n'est pas installée dans le magasin de certificats du navigateur.

**Solution selon le navigateur** :

#### Chrome / Edge / Brave / Safari
```bash
mkcert -install
```

Redémarrez le navigateur après l'installation.

#### Firefox
Firefox utilise son propre magasin de certificats. Vous devez installer `nss` :

```bash
# macOS
brew install nss
mkcert -install

# Linux (Debian/Ubuntu)
sudo apt install libnss3-tools
mkcert -install

# Linux (Fedora)
sudo dnf install nss-tools
mkcert -install
```

**Redémarrez Firefox** après l'installation.

#### Vérifier que mkcert est installé
```bash
mkcert -CAROOT
```

Cette commande devrait afficher le chemin vers le dossier de l'autorité de certification.

---

### 3. Erreur "Cannot find module 'backend/config/auth.json'"

**Symptôme** : Le serveur plante au démarrage avec cette erreur.

**Solution** :
```bash
# Mode Docker
./docker-init.sh

# Mode développement local
cp backend/config/auth.example.json backend/config/auth.json
```

---

### 4. Erreur "ENOENT: no such file or directory, open 'backend/ssl/localhost+2.pem'"

**Symptôme** : Le serveur démarre en mode HTTP uniquement (pas de HTTPS).

**Solution** : Générer les certificats SSL
```bash
# macOS
brew install mkcert
mkcert -install
cd backend/ssl
mkcert localhost 127.0.0.1 ::1

# Linux
# Installer mkcert d'abord : https://github.com/FiloSottile/mkcert#installation
mkcert -install
cd backend/ssl
mkcert localhost 127.0.0.1 ::1
```

---

### 5. Port déjà utilisé (EADDRINUSE)

**Symptôme** :
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution** : Arrêter le processus utilisant le port

#### macOS / Linux
```bash
# Trouver le processus
lsof -ti:3000 -ti:3443

# Tuer le processus
lsof -ti:3000 -ti:3443 | xargs kill -9
```

#### Windows
```powershell
# Trouver le processus
netstat -ano | findstr :3000

# Tuer le processus (remplacer PID par le numéro du processus)
taskkill /PID <PID> /F
```

---

### 6. L'application fonctionne mais les modifications ne s'affichent pas

**Cause** : Cache du navigateur ou du serveur Express.

**Solution** :

1. **Vider le cache du navigateur** (voir solution 1)

2. **Redémarrer le serveur** :
```bash
# Arrêter le serveur (Ctrl+C)
# Puis le relancer
npm start
```

3. **Mode développement avec auto-rechargement** :
```bash
npm run dev
```

---

### 7. Docker : Le conteneur reste en "restarting"

**Symptôme** : `docker ps` montre que le conteneur redémarre en boucle.

**Solution** :

1. **Vérifier les logs** :
```bash
docker logs eval-e5-app
```

2. **Vérifier que docker-init.sh a été exécuté** :
```bash
./docker-init.sh
docker-compose restart
```

3. **Si le problème persiste**, supprimer complètement et recréer :
```bash
docker-compose down
docker rmi evale5-eval-e5
./docker-init.sh
docker-compose up -d
```

---

### 8. Docker : Erreur "Are you trying to mount a directory onto a file"

**Symptôme** : Erreur au démarrage de docker-compose concernant le montage de volumes.

**Solution** : Le fichier `auth.json` n'existe pas. Exécutez **OBLIGATOIREMENT** :
```bash
./docker-init.sh
```

**AVANT** de lancer docker-compose :
```bash
docker-compose up -d
```

---

## 🆘 Support

Si aucune de ces solutions ne résout votre problème :

1. **Vérifiez les logs du serveur**
   - Regardez la console où le serveur est lancé
   - Cherchez les messages d'erreur en rouge

2. **Vérifiez la console du navigateur**
   - Ouvrez les outils de développement (F12)
   - Allez dans l'onglet "Console"
   - Cherchez les erreurs JavaScript

3. **Testez avec curl**
   ```bash
   # Test HTTP
   curl -v http://localhost:3000/login.html

   # Test HTTPS (ignore les avertissements SSL)
   curl -k -v https://localhost:3443/login.html
   ```

4. **Réinstallation complète**
   ```bash
   # Supprimer node_modules
   rm -rf node_modules

   # Réinstaller les dépendances
   npm install

   # Régénérer les certificats
   cd backend/ssl
   rm -f localhost+2*.pem
   mkcert localhost 127.0.0.1 ::1
   cd ../..

   # Redémarrer
   npm start
   ```

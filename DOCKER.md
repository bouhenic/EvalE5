# Déploiement Docker

## Prérequis

- Docker installé sur l'hôte
- Docker Compose installé (optionnel mais recommandé)

## Démarrage rapide avec Docker Compose

### 1. Vérifier la structure des dossiers

Les dossiers `backend/export` et `backend/data` devraient déjà exister. Si ce n'est pas le cas :

```bash
mkdir -p backend/export backend/data
chmod 755 backend/export backend/data
```

### 2. Lancer l'application

```bash
# Construire et démarrer le conteneur
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter l'application
docker-compose down
```

### 3. Accéder à l'application

Ouvrir votre navigateur : `http://localhost:3000`

## Commandes Docker manuelles (sans Docker Compose)

### Construire l'image

```bash
docker build -t eval-e5:latest .
```

### Lancer le conteneur

```bash
docker run -d \
  --name eval-e5-app \
  -p 3000:3000 \
  -v $(pwd)/backend/export:/app/backend/export \
  -v $(pwd)/modeles:/app/modeles:ro \
  -v $(pwd)/backend/data:/app/backend/data \
  --restart unless-stopped \
  eval-e5:latest
```

### Voir les logs

```bash
docker logs -f eval-e5-app
```

### Arrêter le conteneur

```bash
docker stop eval-e5-app
docker rm eval-e5-app
```

## Volumes montés

| Dossier hôte | Dossier conteneur | Description |
|--------------|-------------------|-------------|
| `./backend/export` | `/app/backend/export` | Fichiers Excel générés (lecture/écriture) |
| `./modeles` | `/app/modeles` | Modèles Excel (lecture seule) |
| `./backend/data` | `/app/backend/data` | Données des élèves et évaluations (JSON) |

## Avantages de cette configuration

✅ **Isolation** : L'application tourne dans un environnement isolé
✅ **Portabilité** : Fonctionne sur n'importe quel serveur avec Docker
✅ **Persistance** : Les fichiers Excel sont créés directement sur l'hôte
✅ **Facilité** : Mise à jour simple avec `docker-compose up -d --build`
✅ **Sécurité** : Environnement contrôlé et reproductible

## Production

Pour la production, considérez :

1. **Reverse proxy** (Nginx ou Traefik)
2. **HTTPS** avec Let's Encrypt
3. **Sauvegardes** automatiques des dossiers `backend/export` et `backend/data`
4. **Monitoring** avec Prometheus/Grafana

### Exemple avec Nginx reverse proxy

```yaml
version: '3.8'

services:
  eval-e5:
    build: .
    container_name: eval-e5-app
    expose:
      - "3000"
    volumes:
      - ./backend/export:/app/backend/export
      - ./modeles:/app/modeles:ro
      - ./backend/data:/app/backend/data
    restart: unless-stopped
    networks:
      - eval-network

  nginx:
    image: nginx:alpine
    container_name: eval-e5-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - eval-e5
    restart: unless-stopped
    networks:
      - eval-network

networks:
  eval-network:
    driver: bridge
```

## Mise à jour de l'application

```bash
# Reconstruire et redémarrer
docker-compose up -d --build

# Ou avec Docker manuel
docker stop eval-e5-app
docker rm eval-e5-app
docker build -t eval-e5:latest .
docker run -d ... (commande complète ci-dessus)
```

## Dépannage

### Les fichiers ne sont pas créés dans backend/export/

```bash
# Vérifier les permissions
ls -la backend/export/
chmod 755 backend/export/

# Vérifier que le volume est bien monté
docker inspect eval-e5-app | grep Mounts -A 20
```

### Le conteneur ne démarre pas

```bash
# Voir les logs d'erreur
docker logs eval-e5-app

# Vérifier que les dépendances sont installées
docker exec -it eval-e5-app npm list
```

### Accéder au conteneur pour déboguer

```bash
docker exec -it eval-e5-app /bin/bash
```

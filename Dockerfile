# Utiliser une image Node.js sur Ubuntu
FROM ubuntu:22.04

# Installer Node.js et npm
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Créer le répertoire de l'application
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le reste de l'application
COPY . .

# Créer les dossiers nécessaires (seront montés depuis l'hôte)
RUN mkdir -p backend/export backend/data backend/ssl

# Exposer les ports de l'application
EXPOSE 3000 3443

# Démarrer l'application
CMD ["npm", "start"]

# 🎓 Outil d'Évaluation BTS CIEL - Épreuve E5

Application web complète pour l'évaluation des étudiants de BTS Cybersécurité, Informatique et Réseaux, Électronique (CIEL) - Épreuve E5 : Exploitation et maintenance de réseaux informatiques.

## 🐳 Démarrage Rapide avec Docker

**Nouvelle machine ? Utilisez Docker !**

```bash
git clone https://github.com/bouhenic/EvalE5.git
cd EvalE5
./docker-init.sh          # ⚠️ OBLIGATOIRE avant docker-compose !
docker-compose up -d
```

👉 Accédez à https://localhost:3443 ou http://localhost:3000

📖 Guide complet : [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md)

---

## 📋 Description

Cette application permet aux enseignants de :
- **Gérer une liste d'élèves** (ajout, modification, suppression simple ou **multiple**)
- **Importer une classe depuis un PDF** Index Education / Pronote en un clic
- **Évaluer par semestre** (4 semestres) les compétences techniques et transversales
- **S'appuyer sur les aides au positionnement** officielles, affichées au survol des critères
- **Générer automatiquement des fichiers Excel individuels** conformes au modèle officiel du ministère
- **Sauvegarder des brouillons** d'évaluation en format JSON
- **Finaliser et remplir automatiquement** les fichiers Excel avec les notes
- **Imprimer une synthèse** filtrée par promotion
- **🔐 Authentification sécurisée** (avec changement de mot de passe) et **🔒 HTTPS**

## ✨ Fonctionnalités principales

### 🏠 Page d'accueil
- Liste des élèves avec filtre par promotion
- Ajout d'un élève, **import d'une classe entière depuis un PDF**
- **Sélection multiple** (cases à cocher) et suppression groupée
- Statut de génération du fichier Excel par élève
- Génération et téléchargement des fichiers Excel individuels
- Accès direct à l'évaluation de chaque élève
- Impression d'une synthèse (filtrée sur la promotion sélectionnée)

### 📝 Page d'évaluation
- Sélection du semestre à évaluer
- Formulaire interactif pour les 4 compétences :
  - **C02** : Organiser une intervention
  - **C06** : Valider un système informatique
  - **C09** : Installer un réseau informatique
  - **C11** : Maintenir un réseau informatique
- Système de notation à 4 niveaux pour chaque critère
- **Aides au positionnement** (reprises de la grille officielle) affichées au survol de l'icône ℹ️
- Commentaires globaux
- Sauvegarde en brouillon (JSON)
- Finalisation et export vers Excel

## 🏗️ Architecture

```
EvalE5/
├── backend/
│   ├── config/
│   │   ├── config.json          # Configuration générale
│   │   ├── mapping.json         # Mapping cellules Excel + aides au positionnement
│   │   └── auth.json            # Utilisateurs (non versionné, cf. auth.example.json)
│   ├── data/
│   │   ├── eleves.json          # Liste des élèves (non versionné : données réelles)
│   │   └── evaluations.json     # Données d'évaluation (non versionné)
│   ├── middleware/
│   │   └── auth.js              # Protection des routes par session
│   ├── routes/
│   │   ├── api.js               # Routes API Express
│   │   └── auth.js              # Login / logout / changement de mot de passe
│   ├── services/
│   │   ├── excelService.js      # Manipulation Excel (génération, remplissage)
│   │   ├── dataService.js       # Données + renumérotation/dédoublonnage
│   │   └── pdfImportService.js  # Extraction d'élèves depuis un PDF (pdftotext)
│   ├── export/                  # Fichiers Excel générés
│   └── server.js                # Serveur Express (HTTP + HTTPS)
├── frontend/
│   ├── index.html               # Page d'accueil
│   ├── evaluation.html          # Page d'évaluation
│   ├── login.html               # Page de connexion
│   └── change-password.html     # Changement de mot de passe
├── public/
│   ├── css/styles.css
│   ├── images/logo.png
│   └── js/                      # index.js, evaluation.js, login.js, change-password.js
├── tools/
│   └── import-eleves-pdf.js     # Import d'élèves en ligne de commande
├── modeles/
│   └── modele_officiel.xlsx     # Modèle Excel du ministère
├── grille.xlsx                  # Grille officielle (source des aides au positionnement)
├── Dockerfile / docker-compose.yml
├── package.json
└── README.md
```

## 🚀 Installation

### Prérequis
- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)
- **poppler-utils** (commande `pdftotext`) pour l'import depuis un PDF
  (macOS : `brew install poppler` ; Debian/Ubuntu : `apt-get install poppler-utils`).
  Déjà inclus dans l'image Docker.

### Étapes d'installation

1. **Cloner ou télécharger le projet**
   ```bash
   cd EvalE5
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Vérifier le fichier modèle Excel**
   - Le fichier `modeles/modele_officiel.xlsx` doit être présent
   - Ce fichier est la copie du modèle officiel fourni par le ministère

4. **Démarrer le serveur**
   ```bash
   npm start
   ```

   Ou en mode développement avec auto-rechargement :
   ```bash
   npm run dev
   ```

5. **Installer l'autorité de certification SSL (première fois uniquement)**
   ```bash
   mkcert -install
   ```
   Entrez votre mot de passe macOS quand demandé.

6. **Accéder à l'application**
   - Ouvrir un navigateur web
   - Aller à l'adresse : `https://localhost:3443`

   📘 **Note** : L'application utilise HTTPS pour la sécurité. Voir [HTTPS_INSTALL.md](./HTTPS_INSTALL.md) pour plus de détails.

## 📖 Guide d'utilisation

### 1️⃣ Gestion des élèves

#### Ajouter un élève
Depuis la page d'accueil, bouton **« ➕ Ajouter un élève »** (formulaire).

#### Importer une classe depuis un PDF
1. Bouton **« 📥 Importer un PDF »** (export « Liste des élèves par classe » d'Index Education / Pronote).
2. Choisir le fichier, indiquer la **promotion** (format `AAAA-AAAA`, ex. `2024-2026`).
3. Les élèves déjà présents (même nom/prénom) sont ignorés ; les nouveaux sont ajoutés.

En ligne de commande (équivalent) :
```bash
node tools/import-eleves-pdf.js <fichier.pdf> --promotion 2024-2026 [--replace] [--dry-run]
```

#### Supprimer plusieurs élèves
Cocher les cases des élèves concernés puis **« 🗑️ Supprimer la sélection »**.

#### Identifiants
À l'ajout/import, l'`id` et le `numero_candidat` sont attribués automatiquement au
format **`AAAA` (année de fin) + rang dans la classe** (ex. promotion `2024-2026` →
`202601`, `202602`…), par ordre alphabétique. Les évaluations suivent automatiquement
en cas de renumérotation.

#### Générer le fichier Excel d'un élève
1. Sur la page d'accueil, cliquer sur **"📄 Générer Excel"**
2. Le fichier est créé dans `backend/export/`
3. Le format du nom : `NOM_Prenom_E5_Evaluation.xlsx`

### 2️⃣ Évaluer un élève

#### Accéder à l'évaluation
1. Cliquer sur **"✏️ Évaluer"** pour l'élève souhaité
2. Sélectionner un semestre dans la liste déroulante

#### Remplir l'évaluation
1. Pour chaque compétence, sélectionner le niveau atteint pour chaque critère :
   - **Niveau 1** : Non réalisé (0 observable)
   - **Niveau 2** : Réalisation partielle (1 observable)
   - **Niveau 3** : Réalisation satisfaisante (2-3 observables)
   - **Niveau 4** : Réalisation très satisfaisante (4 observables)
2. Ajouter un commentaire global si nécessaire (obligatoire si note < 10/20)

#### Sauvegarder
- **💾 Enregistrer brouillon** : Sauvegarde en JSON uniquement
- **✅ Finaliser et remplir Excel** : Sauvegarde en JSON + remplissage du fichier Excel

### 3️⃣ Télécharger les fichiers Excel

Sur la page d'accueil, cliquer sur **"💾 Télécharger"** pour l'élève concerné.

## 🔧 Configuration

### Modifier le mapping Excel

Si le modèle Excel officiel change, modifier `backend/config/mapping.json` :

```json
{
  "identite": {
    "nom": {
      "semestre_1": "D9",  // Cellule pour le nom dans Semestre 1
      ...
    }
  },
  "competences": {
    "C02": {
      "criteres": [
        {
          "id": "c02_c1",
          "ligne": 20  // Ligne du critère dans Excel
        }
      ]
    }
  }
}
```

### Modifier les compétences évaluées

Éditer `backend/config/mapping.json` dans la section `"competences"`.

### Changer le port du serveur

Modifier `backend/config/config.json` :
```json
{
  "port": 3000
}
```

## 📊 Structure des données

### Format d'un élève (JSON)
```json
{
  "id": 202601,
  "nom": "AMROUNI",
  "prenom": "Aghiles",
  "promotion": "2024-2026",
  "numero_candidat": "202601",
  "academie": "Académie de Versailles",
  "etablissement": "Lycée Isaac Newton",
  "session": "SESSION 2026"
}
```
> `id` et `numero_candidat` sont gérés automatiquement (année de fin + rang dans la
> promotion). Les fichiers `eleves.json` / `evaluations.json` ne sont **pas versionnés**
> (données réelles d'élèves).

### Format d'évaluation (JSON)
```json
{
  "date_evaluation": "2024-11-30T12:00:00.000Z",
  "commentaire": "Bon travail global...",
  "competences": {
    "C02": {
      "criteres": {
        "c02_c1": { "niveau": 3 },
        "c02_c2": { "niveau": 2 }
      }
    }
  }
}
```

## 🎯 Compétences évaluées

### C02 : Organiser une intervention (coef. 0.2)
- Identifier les interlocuteurs et ressources
- Compléter le cahier des charges
- Interpréter le planning prévisionnel
- Compétences transversales

### C06 : Valider un système informatique (coef. 0.2)
- Identifier les exigences à valider
- Établir les procédures de test
- Appliquer les tests
- Synthétiser les résultats
- Valider le document de recette
- Compétences transversales

### C09 : Installer un réseau informatique (coef. 0.3)
- Identifier les équipements nécessaires
- Déterminer les procédures
- Suivre les procédures
- Respecter les règles de sécurité
- Fournir un compte-rendu
- Compétences transversales

### C11 : Maintenir un réseau informatique (coef. 0.3)
- Identifier et mettre en œuvre les outils
- Interpréter les résultats et localiser les causes
- Résoudre ou escalader l'incident
- Informer et conseiller le client
- Compétences transversales

## 🔄 Calcul des notes

La **Fiche récapitulative** calcule automatiquement la note finale selon :

```
Note /20 = (C02×0.2 + C06×0.2 + C09×0.3 + C11×0.3) × 20/3 + Points bonus
```

Les formules Excel sont **préservées** lors du remplissage automatique.

## 🛠️ Technologies utilisées

- **Backend** : Node.js, Express.js (sessions + bcrypt)
- **Manipulation Excel** : xlsx-populate (préservation complète des fichiers Excel complexes)
- **Lecture Excel / import PDF** : exceljs, poppler (`pdftotext`)
- **Frontend** : HTML5, CSS3, JavaScript Vanilla
- **Stockage** : JSON (fichiers locaux)

## ⚠️ Points importants

1. **Génération du fichier Excel** : Doit être effectuée avant la première évaluation
2. **Formules Excel** : Toujours préservées, ne jamais modifier manuellement les cellules de calcul
3. **Sauvegarde brouillon** : Les données JSON ne sont pas perdues, vous pouvez reprendre plus tard
4. **Finalisation** : Écrit dans le fichier Excel, les données restent aussi en JSON
5. **Fiche récapitulative** : Se met à jour automatiquement à partir des semestres

## 📝 API Endpoints

Toutes les routes `/api/*` (sauf `/api/auth/*`) requièrent une session authentifiée.

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/eleves` | Liste tous les élèves |
| GET | `/api/eleves/:id` | Récupère un élève |
| POST | `/api/eleves` | Ajoute un élève |
| PUT | `/api/eleves/:id` | Modifie un élève |
| DELETE | `/api/eleves/:id` | Supprime un élève |
| POST | `/api/eleves/import-pdf` | Importe des élèves depuis un PDF (base64) |
| POST | `/api/eleves/supprimer-multiple` | Supprime plusieurs élèves (`{ ids: [...] }`) |
| POST | `/api/eleves/:id/generer-excel` | Génère le fichier Excel |
| GET | `/api/eleves/:id/evaluations/:semestre` | Récupère l'évaluation d'un semestre |
| POST | `/api/eleves/:id/evaluations/:semestre/save` | Sauvegarde brouillon |
| POST | `/api/eleves/:id/evaluations/:semestre/finaliser` | Finalise et remplit Excel |
| GET | `/api/eleves/:id/telecharger` | Télécharge le fichier Excel |
| GET | `/api/eleves/:id/notes` | Notes calculées d'un élève |
| GET | `/api/config` / `/api/config/mapping` | Configuration et mapping |
| POST | `/api/cache/reset` | Réinitialise le cache d'existence des fichiers Excel |
| POST | `/api/auth/login` / `/logout` | Connexion / déconnexion |
| GET | `/api/auth/check` | État d'authentification |
| POST | `/api/auth/change-password` | Change le mot de passe |

## 🐛 Dépannage

### Le serveur ne démarre pas
- Vérifier que le port 3000 n'est pas déjà utilisé
- Vérifier que Node.js est installé : `node --version`

### Erreur "Fichier Excel non trouvé"
- Générer d'abord le fichier Excel depuis la page d'accueil

### Les formules Excel sont cassées
- Ne jamais modifier manuellement les cellules contenant des formules
- Utiliser uniquement l'application pour remplir les données

### Problème de mise à jour
- Supprimer `node_modules/` et relancer `npm install`

## 📄 Licence

MIT

## 👨‍💻 Support

Pour toute question ou problème, contacter l'administrateur de l'application.

---

**Version** : 1.1.0
**Dernière mise à jour** : Juin 2026

# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Aperçu

**EvalE5** est une application web (Node.js / Express) destinée aux enseignants pour
évaluer les étudiants de **BTS CIEL** sur l'**épreuve E5**, et générer automatiquement
des fichiers Excel individuels conformes au modèle officiel du ministère.

Pile : **Express** (backend), **HTML/CSS/JS vanilla** (frontend, sans framework),
stockage en **fichiers JSON locaux**, manipulation Excel via **xlsx-populate**
(préserve formules et mise en forme du modèle), authentification par session +
**bcrypt**, et déploiement **Docker** avec HTTPS (mkcert).

## Commandes

```bash
npm install            # Installer les dépendances
npm start              # Démarrer le serveur (node backend/server.js)
npm run dev            # Démarrer avec auto-rechargement (nodemon)
```

Docker :
```bash
./docker-init.sh       # OBLIGATOIRE avant le 1er run : génère auth.json + certs SSL
docker-compose up -d
```

Accès : `https://localhost:3443` (HTTPS) ou `http://localhost:3000` (HTTP).
Les deux serveurs démarrent si les certificats SSL sont présents, sinon HTTP seul.

Il n'y a **pas de framework de test** ni de linter configuré. Les fichiers
`test-*.js` à la racine sont des scripts manuels (`node test-xxx.js`) pour explorer
la génération/lecture Excel, pas une suite de tests automatisée.

## Architecture

```
backend/
  server.js              Express : HTTP + HTTPS, sessions, montage des routes/auth
  routes/api.js          API métier : CRUD élèves, évaluations, génération/téléchargement Excel
  routes/auth.js         /login, /logout, /check, /change-password
  middleware/auth.js     requireAuth : protège "/" et toutes les routes "/api"
  services/
    dataService.js       Lecture/écriture des JSON, calcul des notes
    excelService.js      Génération et remplissage des .xlsx (avec cache d'existence des fichiers)
  config/
    config.json          Ports, chemins, liste des semestres
    mapping.json         Mapping cellules Excel <-> critères/identité (à éditer si le modèle change)
    auth.json            Utilisateurs (bcrypt) + sessionSecret — NON VERSIONNÉ (cf. auth.example.json)
  data/
    eleves.json          Liste des élèves
    evaluations.json     Données d'évaluation persistées (brouillons + finalisées)
  export/                Fichiers Excel générés (runtime)
frontend/                index.html, evaluation.html, login.html, change-password.html
public/
  css/styles.css
  js/                    index.js, evaluation.js, login.js, change-password.js
modeles/modele_officiel.xlsx   Modèle Excel officiel (source de la génération)
```

Flux de requête : `server.js` sert d'abord `/api/auth/*` (public), puis applique
`requireAuth` sur `/` et `/api`. Les fichiers statiques de `public/` et `frontend/`
sont servis directement.

## Domaine métier

- Évaluation sur **4 semestres** (`semestre_1`..`semestre_4`, définis dans `config.json`).
- **4 compétences** avec coefficients : **C02** (0.2), **C06** (0.2), **C09** (0.3), **C11** (0.3).
- Chaque critère est noté sur **4 niveaux** (1 = non réalisé … 4 = très satisfaisant).
- Note finale `/20 = (C02×0.2 + C06×0.2 + C09×0.3 + C11×0.3) × 20/3 + bonus`.
- Workflow type : générer l'Excel d'un élève → évaluer un semestre → **brouillon**
  (JSON seul) ou **finaliser** (JSON + écriture dans l'Excel).

## Principaux endpoints API (préfixe `/api`, protégés par session)

| Méthode | Endpoint | Rôle |
|---------|----------|------|
| GET/POST/PUT/DELETE | `/eleves[/:id]` | CRUD élèves |
| POST | `/eleves/:id/generer-excel` | Génère le fichier Excel |
| GET | `/eleves/:id/evaluations/:semestre` | Lit l'évaluation d'un semestre |
| POST | `/eleves/:id/evaluations/:semestre/save` | Sauvegarde brouillon (JSON) |
| POST | `/eleves/:id/evaluations/:semestre/finaliser` | Sauvegarde + écrit dans l'Excel |
| GET | `/eleves/:id/telecharger` | Télécharge le .xlsx |
| GET | `/eleves/:id/notes` | Notes calculées |
| GET | `/config`, `/config/mapping` | Configuration et mapping |
| POST | `/cache/reset` | Réinitialise le cache d'existence des fichiers Excel |

## Points d'attention

- **`auth.json` n'est pas versionné** : généré par `docker-init.sh` ou copié depuis
  `backend/config/auth.example.json`. Le serveur refuse de démarrer s'il est absent.
- **Formules Excel** : ne jamais réécrire manuellement les cellules de calcul ;
  `xlsx-populate` est choisi pour préserver formules et styles. Le mapping des
  cellules vit dans `config/mapping.json`.
- **Cache excelService** : l'existence des fichiers Excel est mise en cache
  (`fichierExisteCache`). Après création/suppression hors application, utiliser
  `POST /api/cache/reset`.
- **Cookie de session** `secure: false` volontairement, pour autoriser HTTP et HTTPS.
- Le modèle officiel (`modeles/modele_officiel.xlsx`) est la source de génération ;
  ne pas le modifier sans mettre à jour `mapping.json` en conséquence.

## Documentation complémentaire

Le dépôt contient de nombreux guides Markdown à la racine : `README.md` (référence
principale), `AUTHENTICATION.md`, `DOCKER*.md`, `HTTPS_*.md`, `IMPORT_EXCEL.md`,
`FIX_EXCEL.md`, `TROUBLESHOOTING.md`, `QUICKSTART.md`, et `Explications/`.

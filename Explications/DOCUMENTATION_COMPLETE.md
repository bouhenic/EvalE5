# Documentation Complète - Application d'Évaluation BTS CIEL E5

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture générale](#architecture-générale)
3. [Structure des dossiers](#structure-des-dossiers)
4. [Backend](#backend)
5. [Frontend](#frontend)
6. [Flux de données](#flux-de-données)
7. [Fonctionnalités principales](#fonctionnalités-principales)
8. [Configuration](#configuration)

---

## Vue d'ensemble

Cette application permet de gérer les évaluations des étudiants de BTS CIEL pour l'épreuve E5 (Exploitation et maintenance de réseaux informatiques).

### Objectifs principaux :
- Gérer une liste d'élèves par promotion
- Évaluer les compétences sur 4 semestres
- Générer des fichiers Excel individuels pré-remplis
- Calculer automatiquement les notes
- Organiser les fichiers par promotion

### Technologies utilisées :
- **Backend** : Node.js + Express
- **Frontend** : HTML, CSS, JavaScript vanilla
- **Base de données** : Fichiers JSON (simple et portable)
- **Génération Excel** : xlsx-populate
- **Serveur** : Express.js

---

## Architecture générale

L'application suit une architecture client-serveur classique :

```
┌─────────────────┐         HTTP/REST API        ┌─────────────────┐
│                 │ ◄────────────────────────────► │                 │
│   FRONTEND      │                                │    BACKEND      │
│  (HTML/CSS/JS)  │                                │  (Node.js)      │
│                 │ ────────────────────────────► │                 │
└─────────────────┘      GET/POST/PUT/DELETE      └─────────────────┘
                                                           │
                                                           ▼
                                                   ┌───────────────┐
                                                   │  Fichiers     │
                                                   │  - JSON       │
                                                   │  - Excel      │
                                                   └───────────────┘
```

---

## Structure des dossiers

```
EvalE5/
├── backend/                    # Code serveur
│   ├── config/                # Configuration
│   │   ├── config.json       # Configuration générale
│   │   └── mapping.json      # Mapping Excel (cellules, compétences)
│   ├── data/                 # Données JSON
│   │   ├── eleves.json       # Liste des élèves
│   │   └── evaluations.json  # Évaluations sauvegardées
│   ├── export/               # Fichiers Excel générés
│   │   ├── 2024-2026/       # Fichiers de la promotion 2024-2026
│   │   └── 2025-2027/       # Fichiers de la promotion 2025-2027
│   ├── routes/               # Routes API
│   │   └── api.js           # Endpoints REST
│   ├── services/             # Logique métier
│   │   ├── dataService.js   # Gestion des données JSON
│   │   └── excelService.js  # Génération/modification Excel
│   └── server.js            # Point d'entrée du serveur
├── frontend/                 # Pages HTML
│   ├── index.html           # Page d'accueil (liste élèves)
│   └── evaluation.html      # Page d'évaluation
├── public/                   # Assets statiques
│   ├── css/
│   │   └── styles.css       # Styles CSS
│   └── js/
│       ├── index.js         # JavaScript page d'accueil
│       └── evaluation.js    # JavaScript page d'évaluation
├── modeles/                  # Modèle Excel
│   └── modele_officiel.xlsx # Fichier modèle vierge
└── Explications/             # Documentation
    └── DOCUMENTATION_COMPLETE.md
```

---

## Backend

### 1. server.js - Point d'entrée

**Rôle** : Démarre le serveur Express et configure les middlewares.

```javascript
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const apiRouter = require('./routes/api');

const app = express();
const PORT = 3000;

// Middlewares
app.use(bodyParser.json());                    // Parse JSON
app.use(express.static('public'));             // Fichiers statiques
app.use('/api', apiRouter);                    // Routes API

// Routes HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/evaluation/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/evaluation.html'));
});

// Démarrage
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
```

**Points clés** :
- Middleware `bodyParser.json()` pour parser les requêtes JSON
- `express.static('public')` sert les fichiers CSS/JS
- Routes HTML pour servir les pages
- Routes API sous le préfixe `/api`

---

### 2. routes/api.js - Endpoints REST

**Rôle** : Définit toutes les routes API de l'application.

#### Endpoints principaux :

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/eleves` | Liste tous les élèves avec statut Excel |
| GET | `/api/eleves/:id` | Récupère un élève par ID |
| POST | `/api/eleves` | Ajoute un nouvel élève |
| PUT | `/api/eleves/:id` | Modifie un élève |
| DELETE | `/api/eleves/:id` | Supprime un élève |
| POST | `/api/eleves/:id/generer-excel` | Génère le fichier Excel |
| GET | `/api/eleves/:id/telecharger` | Télécharge le fichier Excel |
| GET | `/api/eleves/:id/evaluations/:semestre` | Récupère une évaluation |
| POST | `/api/eleves/:id/evaluations/:semestre/save` | Sauvegarde en brouillon |
| POST | `/api/eleves/:id/evaluations/:semestre/finaliser` | Finalise et remplit Excel |
| GET | `/api/eleves/:id/notes` | Calcule les notes |
| GET | `/api/config/mapping` | Récupère le mapping |

#### Exemple : Génération d'un fichier Excel

```javascript
router.post('/eleves/:id/generer-excel', async (req, res) => {
  try {
    // 1. Récupérer l'élève
    const eleve = await dataService.getEleveById(req.params.id);
    if (!eleve) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    // 2. Générer le fichier Excel
    const fileName = await excelService.genererFichierEleve(eleve);

    // 3. Retourner le résultat
    res.json({
      success: true,
      message: 'Fichier Excel généré avec succès',
      fileName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 3. services/dataService.js - Gestion des données

**Rôle** : CRUD sur les fichiers JSON (élèves et évaluations).

#### Méthodes principales :

##### 3.1 Gestion des élèves

```javascript
// Récupérer tous les élèves
async getEleves() {
  const data = await fs.readFile(this.elevesPath, 'utf8');
  return JSON.parse(data);
}

// Récupérer un élève par ID
async getEleveById(id) {
  const eleves = await this.getEleves();
  return eleves.find(e => e.id === parseInt(id));
}

// Ajouter un élève
async addEleve(eleveData) {
  const eleves = await this.getEleves();
  const maxId = eleves.length > 0 ? Math.max(...eleves.map(e => e.id)) : 0;
  const newEleve = { id: maxId + 1, ...eleveData };
  eleves.push(newEleve);
  await fs.writeFile(this.elevesPath, JSON.stringify(eleves, null, 2));
  return { success: true, eleve: newEleve };
}
```

##### 3.2 Gestion des évaluations

```javascript
// Sauvegarder une évaluation
async saveEvaluationSemestre(eleveId, semestreId, evaluationData) {
  const evaluations = await this.getEvaluations();

  // Créer la structure si elle n'existe pas
  if (!evaluations[eleveId]) {
    const eleve = await this.getEleveById(eleveId);
    evaluations[eleveId] = {
      id: parseInt(eleveId),
      nom: eleve.nom,
      prenom: eleve.prenom,
      promotion: eleve.promotion || eleve.classe,
      evaluations: {}
    };
  }

  // Ajouter la date d'évaluation
  evaluations[eleveId].evaluations[semestreId] = {
    ...evaluationData,
    date_evaluation: new Date().toISOString()
  };

  // Sauvegarder
  await fs.writeFile(this.evaluationsPath, JSON.stringify(evaluations, null, 2));
  return { success: true };
}
```

##### 3.3 Calcul des notes

```javascript
// Calculer la note d'un semestre
calculerNoteSemestre(semestreData) {
  const result = { competences: {}, total: 0, note: null };

  if (!semestreData?.competences) return result;

  let totalPondere = 0;
  let hasAnyEvaluation = false;

  // Pour chaque compétence
  for (const [compCode, compData] of Object.entries(semestreData.competences)) {
    const competence = mapping.competences[compCode];
    if (!competence) continue;

    let totalCriteres = 0;
    let totalCoefficients = 0;

    // Pour chaque critère
    for (const [critereId, critereData] of Object.entries(compData.criteres)) {
      const critere = competence.criteres.find(c => c.id === critereId);
      if (!critere || critereData.niveau === null) continue;

      hasAnyEvaluation = true;
      const noteNiveau = parseInt(critereData.niveau); // 0-3
      totalCriteres += noteNiveau * critere.coefficient;
      totalCoefficients += critere.coefficient;
    }

    // Note de la compétence (sur 3)
    const noteCompetence = totalCoefficients > 0
      ? totalCriteres / totalCoefficients
      : 0;

    if (totalCoefficients > 0) {
      result.competences[compCode] = {
        note: noteCompetence,
        coefficient: competence.coefficient
      };
      totalPondere += noteCompetence * competence.coefficient;
    }
  }

  result.total = totalPondere;

  // Convertir sur 20 : (total / 3) * 20
  if (hasAnyEvaluation) {
    result.note = (result.total / 3) * 20;
  }

  return result;
}
```

**Formule de calcul** :
1. Chaque critère est noté de 0 à 3
2. Note de compétence = moyenne pondérée des critères
3. Note de semestre = somme pondérée des compétences
4. Conversion sur 20 : `(note / 3) × 20`

---

### 4. services/excelService.js - Gestion Excel

**Rôle** : Génération et modification des fichiers Excel.

#### 4.1 Organisation par promotion

```javascript
// Obtenir le chemin du dossier de promotion
getPromotionPath(eleve) {
  const promotion = eleve.promotion || eleve.classe || 'Non_classé';
  return path.join(this.exportPath, promotion);
}
```

**Résultat** : Les fichiers sont organisés dans `backend/export/2024-2026/`, `backend/export/2025-2027/`, etc.

#### 4.2 Génération d'un fichier Excel

```javascript
async genererFichierEleve(eleve) {
  try {
    // 1. Créer le dossier de promotion
    const promotionPath = this.getPromotionPath(eleve);
    await fs.mkdir(promotionPath, { recursive: true });

    // 2. Définir le chemin de sortie
    const outputFileName = `${eleve.nom}_${eleve.prenom}_E5_Evaluation.xlsx`;
    const outputPath = path.join(promotionPath, outputFileName);

    // 3. Charger le modèle Excel
    const workbook = await XlsxPopulate.fromFileAsync(this.modelePath);

    // 4. Remplir les informations d'identité
    await this.remplirIdentite(workbook, eleve);

    // 5. Sauvegarder le fichier
    await workbook.toFileAsync(outputPath);

    return outputFileName;
  } catch (error) {
    throw new Error(`Impossible de générer le fichier Excel: ${error.message}`);
  }
}
```

#### 4.3 Remplissage de l'identité

```javascript
async remplirIdentite(workbook, eleve) {
  const identiteFields = {
    academie: eleve.academie || '',
    etablissement: eleve.etablissement || '',
    nom: eleve.nom || '',
    prenom: eleve.prenom || '',
    numero_candidat: eleve.numero_candidat || '',
    session: eleve.session || 'SESSION 2026'
  };

  // Pour chaque champ d'identité
  for (const [field, value] of Object.entries(identiteFields)) {
    const fieldMapping = mapping.identite[field];
    if (!fieldMapping) continue;

    // Pour chaque onglet (semestres + récapitulatif + jury)
    for (const [key, cellAddress] of Object.entries(fieldMapping)) {
      const sheetName = mapping.sheetNames[key];
      if (!sheetName) continue;

      try {
        const sheet = workbook.sheet(sheetName);
        if (!sheet) continue;

        // Écrire la valeur dans la cellule
        sheet.cell(cellAddress).value(value);
      } catch (err) {
        console.error(`Erreur ${sheetName}:${cellAddress}`, err.message);
      }
    }
  }
}
```

**Exemple de mapping** (config/mapping.json) :
```json
{
  "identite": {
    "nom": {
      "semestre_1": "E9",
      "semestre_2": "E9",
      "recapitulatif": "E9",
      "jury": "C22"
    }
  }
}
```

#### 4.4 Remplissage d'un semestre

```javascript
async remplirSemestre(eleveNom, elevePrenom, semestreId, evaluationData, eleve) {
  try {
    // 1. Localiser le fichier
    const fileName = `${eleveNom}_${elevePrenom}_E5_Evaluation.xlsx`;
    const promotionPath = this.getPromotionPath(eleve);
    const filePath = path.join(promotionPath, fileName);

    // 2. Charger le fichier
    const workbook = await XlsxPopulate.fromFileAsync(filePath);
    const sheetName = mapping.sheetNames[semestreId];
    const sheet = workbook.sheet(sheetName);

    // 3. Effacer les anciennes évaluations
    this.effacerEvaluations(sheet);

    // 4. Remplir les nouvelles évaluations
    for (const [compCode, compData] of Object.entries(evaluationData.competences)) {
      const competence = mapping.competences[compCode];
      if (!competence) continue;

      for (const [critereId, critereData] of Object.entries(compData.criteres)) {
        const critere = competence.criteres.find(c => c.id === critereId);
        if (!critere || critereData.niveau === null) continue;

        // Déterminer la colonne selon le niveau (0-3)
        let colonne;
        switch (parseInt(critereData.niveau)) {
          case 0: colonne = 'C'; break; // Niveau 1
          case 1: colonne = 'D'; break; // Niveau 2
          case 2: colonne = 'E'; break; // Niveau 3
          case 3: colonne = 'F'; break; // Niveau 4
          default: continue;
        }

        // Écrire "x" dans la cellule
        const cellAddress = `${colonne}${critere.ligne}`;
        sheet.cell(cellAddress).value('x');
      }
    }

    // 5. Remplir le commentaire
    if (evaluationData.commentaire) {
      const commentCell = mapping.commentaires.commentaire_global[semestreId];
      sheet.cell(commentCell).value(evaluationData.commentaire);
    }

    // 6. Sauvegarder
    await workbook.toFileAsync(filePath);

    return { success: true };
  } catch (error) {
    throw error;
  }
}
```

---

## Frontend

### 1. index.html - Page d'accueil

**Rôle** : Afficher la liste des élèves avec filtrage par promotion.

#### Structure HTML :

```html
<div class="toolbar">
  <!-- Boutons d'action -->
  <div>
    <button onclick="ouvrirModalAjout()">➕ Ajouter un élève</button>
    <button onclick="refreshEleves()">🔄 Actualiser</button>
  </div>

  <!-- Filtre de promotion -->
  <div class="filters">
    <label>Promotion :</label>
    <select id="filtre-promotion" onchange="filtrerParPromotion()">
      <option value="">Toutes les promotions</option>
      <!-- Rempli dynamiquement -->
    </select>
  </div>

  <!-- Compteur -->
  <div class="info">
    <span id="count-eleves">0 élève(s)</span>
  </div>
</div>

<!-- Tableau des élèves -->
<table id="table-eleves">
  <thead>
    <tr>
      <th>ID</th>
      <th>Nom</th>
      <th>Prénom</th>
      <th>Promotion</th>
      <th>Moyenne</th>
      <th>N° Candidat</th>
      <th>Statut Excel</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody id="tbody-eleves"></tbody>
</table>
```

---

### 2. public/js/index.js - Logique page d'accueil

#### 2.1 Chargement des élèves

```javascript
// Variables globales
let tousLesEleves = [];
let promotionSelectionnee = '';

async function chargerEleves() {
  // 1. Récupérer les élèves depuis l'API
  const response = await fetch(`${API_BASE}/eleves`);
  tousLesEleves = await response.json();

  // 2. Mettre à jour le sélecteur de promotions
  await mettreAJourSelecteurPromotion();

  // 3. Afficher les élèves filtrés
  await afficherElevesFiltre();
}
```

#### 2.2 Filtrage par promotion

```javascript
async function mettreAJourSelecteurPromotion() {
  const selectPromotion = document.getElementById('filtre-promotion');

  // Extraire les promotions uniques
  const promotions = [...new Set(tousLesEleves.map(e => e.promotion || e.classe))]
    .sort()
    .reverse(); // Plus récente en premier

  // Remplir le sélecteur
  selectPromotion.innerHTML = '<option value="">Toutes les promotions</option>';
  promotions.forEach(promo => {
    const option = document.createElement('option');
    option.value = promo;
    option.textContent = promo;
    selectPromotion.appendChild(option);
  });

  // Sélectionner automatiquement la plus récente
  if (promotions.length > 0 && !promotionSelectionnee) {
    promotionSelectionnee = promotions[0];
    selectPromotion.value = promotionSelectionnee;
  }
}

async function filtrerParPromotion() {
  const selectPromotion = document.getElementById('filtre-promotion');
  promotionSelectionnee = selectPromotion.value;
  await afficherElevesFiltre();
}
```

#### 2.3 Affichage du tableau

```javascript
async function afficherElevesFiltre() {
  const tbody = document.getElementById('tbody-eleves');

  // Filtrer les élèves
  const elevesFiltres = promotionSelectionnee
    ? tousLesEleves.filter(e => (e.promotion || e.classe) === promotionSelectionnee)
    : tousLesEleves;

  // Remplir le tableau
  tbody.innerHTML = '';
  for (const eleve of elevesFiltres) {
    const tr = document.createElement('tr');

    // Charger les notes
    const notes = await chargerNotesEleve(eleve.id);
    const celluleMoyenne = formaterCelluleMoyenne(notes);

    // Générer la ligne
    tr.innerHTML = `
      <td>${eleve.id}</td>
      <td>${eleve.nom}</td>
      <td>${eleve.prenom}</td>
      <td>${eleve.promotion || eleve.classe}</td>
      ${celluleMoyenne}
      <td>${eleve.numero_candidat}</td>
      <td>${eleve.fichierExiste ? '✓ Généré' : '⚠ Non généré'}</td>
      <td class="actions">
        <button onclick="genererExcel(${eleve.id})">📄 Générer</button>
        <button onclick="evaluer(${eleve.id})">✏️ Évaluer</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  // Mettre à jour le compteur
  document.getElementById('count-eleves').textContent =
    `${elevesFiltres.length} élève(s)` +
    (promotionSelectionnee ? ` (promotion ${promotionSelectionnee})` : '');
}
```

#### 2.4 Génération Excel

```javascript
async function genererExcel(id, nom, prenom) {
  if (!confirm(`Générer le fichier Excel pour ${prenom} ${nom} ?`)) {
    return;
  }

  const btn = event.target;
  btn.disabled = true;
  btn.innerHTML = '⏳ Génération...';

  try {
    const response = await fetch(`${API_BASE}/eleves/${id}/generer-excel`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la génération');
    }

    const result = await response.json();
    alert(`✅ ${result.message}\nFichier: ${result.fileName}`);

    // Recharger la liste
    chargerEleves();
  } catch (err) {
    alert(`❌ Erreur: ${err.message}`);
    btn.disabled = false;
    btn.innerHTML = '📄 Générer Excel';
  }
}
```

---

### 3. evaluation.html - Page d'évaluation

**Rôle** : Formulaire d'évaluation des compétences par semestre.

#### Structure :

```html
<!-- Sélecteur de semestre -->
<select id="select-semestre" onchange="changerSemestre()">
  <option value="">-- Sélectionner --</option>
  <option value="semestre_1">Semestre 1</option>
  <option value="semestre_2">Semestre 2</option>
  <option value="semestre_3">Semestre 3</option>
  <option value="semestre_4">Semestre 4</option>
</select>

<!-- Affichage des notes -->
<div id="notes-container">
  <div class="note-card">
    <div class="note-label">Semestre actuel</div>
    <div class="note-value" id="note-semestre">--</div>
  </div>
  <div class="note-card">
    <div class="note-label">Moyenne générale</div>
    <div class="note-value" id="note-moyenne">--</div>
  </div>
</div>

<!-- Formulaire des compétences -->
<div id="competences-container">
  <!-- Généré dynamiquement -->
</div>

<!-- Commentaire -->
<textarea id="commentaire-global"></textarea>

<!-- Actions -->
<button onclick="sauvegarderBrouillon()">💾 Enregistrer brouillon</button>
<button onclick="finaliser()">✅ Finaliser et remplir Excel</button>
```

---

### 4. public/js/evaluation.js - Logique évaluation

#### 4.1 Génération du formulaire

```javascript
async function genererFormulaire() {
  const container = document.getElementById('competences-container');
  container.innerHTML = '';

  // Pour chaque compétence
  for (const [compCode, compData] of Object.entries(mapping.competences)) {
    const section = document.createElement('div');
    section.className = 'competence-section';

    // En-tête
    section.innerHTML = `
      <div class="competence-header">
        <h3>${compCode} : ${compData.nom}</h3>
        <span>Coefficient : ${compData.coefficient}</span>
      </div>
    `;

    // Table des critères
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Critère</th>
          <th>Coef.</th>
          <th>Niveau 1<br>Non réalisé</th>
          <th>Niveau 2<br>Partiel</th>
          <th>Niveau 3<br>Satisfaisant</th>
          <th>Niveau 4<br>Très satisfaisant</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    // Pour chaque critère
    for (const critere of compData.criteres) {
      const tr = document.createElement('tr');
      const niveauActuel = evaluationData.competences?.[compCode]?.criteres?.[critere.id]?.niveau;
      const nonEvalue = (niveauActuel === null || niveauActuel === undefined);

      // Ajouter classe si non évalué
      if (nonEvalue) {
        tr.className = 'critere-non-evalue'; // Fond jaune
      }

      tr.innerHTML = `
        <td>
          ${critere.nom}
          ${nonEvalue ? '<span class="badge badge-warning-small">Non évalué</span>' : ''}
        </td>
        <td>${critere.coefficient}</td>
        <td><input type="radio" name="${critere.id}" value="0"
            ${niveauActuel === 0 ? 'checked' : ''}
            onchange="updateNiveau('${compCode}', '${critere.id}', 0)"></td>
        <td><input type="radio" name="${critere.id}" value="1"
            ${niveauActuel === 1 ? 'checked' : ''}
            onchange="updateNiveau('${compCode}', '${critere.id}', 1)"></td>
        <td><input type="radio" name="${critere.id}" value="2"
            ${niveauActuel === 2 ? 'checked' : ''}
            onchange="updateNiveau('${compCode}', '${critere.id}', 2)"></td>
        <td><input type="radio" name="${critere.id}" value="3"
            ${niveauActuel === 3 ? 'checked' : ''}
            onchange="updateNiveau('${compCode}', '${critere.id}', 3)"></td>
      `;

      tbody.appendChild(tr);
    }

    section.appendChild(table);
    container.appendChild(section);
  }

  // Charger et afficher les notes
  await afficherNotes();
}
```

#### 4.2 Mise à jour en temps réel

```javascript
function updateNiveau(compCode, critereId, niveau) {
  // 1. Mettre à jour les données
  if (!evaluationData.competences) {
    evaluationData.competences = {};
  }
  if (!evaluationData.competences[compCode]) {
    evaluationData.competences[compCode] = { criteres: {} };
  }

  evaluationData.competences[compCode].criteres[critereId] = {
    niveau: parseInt(niveau)
  };

  // 2. Retirer l'indicateur "Non évalué" immédiatement
  const radioInputs = document.getElementsByName(critereId);
  if (radioInputs.length > 0) {
    const row = radioInputs[0].closest('tr');
    if (row) {
      // Retirer la classe de fond jaune
      row.classList.remove('critere-non-evalue');

      // Retirer le badge "Non évalué"
      const badge = row.querySelector('.badge-warning-small');
      if (badge) {
        badge.remove();
      }
    }
  }
}
```

#### 4.3 Sauvegarde et finalisation

```javascript
// Sauvegarde en brouillon (JSON uniquement)
async function sauvegarderBrouillon() {
  evaluationData.commentaire = document.getElementById('commentaire-global').value;

  const response = await fetch(
    `${API_BASE}/eleves/${eleveId}/evaluations/${semestreActuel}/save`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evaluationData)
    }
  );

  const result = await response.json();
  alert(`✅ ${result.message}`);

  // Régénérer le formulaire pour mettre à jour l'affichage
  await chargerEvaluation();
  await genererFormulaire();
}

// Finalisation (JSON + Excel)
async function finaliser() {
  if (!confirm('Finaliser cette évaluation et remplir le fichier Excel ?')) {
    return;
  }

  evaluationData.commentaire = document.getElementById('commentaire-global').value;

  const response = await fetch(
    `${API_BASE}/eleves/${eleveId}/evaluations/${semestreActuel}/finaliser`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evaluationData)
    }
  );

  const result = await response.json();
  alert(`✅ ${result.message}\n\nVous pouvez télécharger le fichier Excel depuis la page d'accueil.`);

  // Régénérer le formulaire
  await chargerEvaluation();
  await genererFormulaire();
}
```

---

## Flux de données

### 1. Ajout d'un élève

```
┌─────────┐        POST /api/eleves         ┌──────────────┐
│ Frontend│ ────────────────────────────────►│   Backend    │
│         │                                  │   api.js     │
└─────────┘                                  └──────┬───────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │  dataService  │
                                            │  .addEleve()  │
                                            └───────┬───────┘
                                                    │
                                                    ▼
                                            ┌───────────────┐
                                            │ eleves.json   │
                                            │ (ajout ligne) │
                                            └───────────────┘
```

### 2. Génération d'un fichier Excel

```
┌─────────┐    POST /generer-excel    ┌──────────────┐
│ Frontend│ ───────────────────────────►│   Backend    │
│         │                             │   api.js     │
└─────────┘                             └──────┬───────┘
                                               │
                                               ▼
                                       ┌───────────────┐
                                       │ excelService  │
                                       │.genererFichier│
                                       └───────┬───────┘
                                               │
                    ┌──────────────────────────┼──────────────────────┐
                    ▼                          ▼                      ▼
            ┌───────────────┐          ┌──────────────┐      ┌───────────────┐
            │ Créer dossier │          │ Charger      │      │ Remplir       │
            │  promotion/   │ ────────►│ modele.xlsx  │─────►│ identité      │
            │  2024-2026/   │          │              │      │ (nom, prénom) │
            └───────────────┘          └──────────────┘      └───────┬───────┘
                                                                      │
                                                                      ▼
                                                              ┌───────────────┐
                                                              │ Sauvegarder   │
                                                              │ Nom_Prenom.   │
                                                              │ xlsx          │
                                                              └───────────────┘
```

### 3. Évaluation d'un semestre

```
┌─────────┐    POST /finaliser     ┌──────────────┐
│ Frontend│ ────────────────────────►│   Backend    │
│         │                          │   api.js     │
└─────────┘                          └──────┬───────┘
                                            │
                    ┌───────────────────────┼────────────────────┐
                    ▼                       ▼                    ▼
            ┌───────────────┐       ┌──────────────┐    ┌───────────────┐
            │ dataService   │       │ excelService │    │ Réponse       │
            │.saveEvaluation│       │.remplirSem() │    │ success       │
            └───────┬───────┘       └──────┬───────┘    └───────────────┘
                    │                      │
                    ▼                      ▼
            ┌───────────────┐       ┌──────────────┐
            │evaluations.   │       │ Fichier Excel│
            │json           │       │ mis à jour   │
            │(sauvegarde)   │       │ (ajout "x")  │
            └───────────────┘       └──────────────┘
```

### 4. Calcul des notes

```
┌─────────┐    GET /notes      ┌──────────────┐
│ Frontend│ ───────────────────►│   Backend    │
│         │                     │   api.js     │
└─────────┘                     └──────┬───────┘
                                       │
                                       ▼
                               ┌───────────────┐
                               │ dataService   │
                               │.calculerNotes │
                               └───────┬───────┘
                                       │
                                       ▼
                               ┌───────────────┐
                               │evaluations.   │
                               │json (lecture) │
                               └───────┬───────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
            ┌───────────────┐  ┌──────────────┐  ┌───────────────┐
            │ Calcul note   │  │ Calcul note  │  │ Moyenne       │
            │ semestre 1    │  │ semestre 2-4 │  │ générale      │
            └───────────────┘  └──────────────┘  └───────┬───────┘
                                                          │
                                                          ▼
                                                  ┌───────────────┐
                                                  │ Retour JSON   │
                                                  │ {note: 14.5}  │
                                                  └───────────────┘
```

---

## Fonctionnalités principales

### 1. Gestion des élèves

#### Ajouter un élève :
1. Cliquer sur "➕ Ajouter un élève"
2. Remplir le formulaire (nom, prénom, promotion, etc.)
3. Valider → L'élève est ajouté à `backend/data/eleves.json`

#### Supprimer un élève :
1. Cliquer sur "🗑️ Supprimer"
2. Confirmer → L'élève et ses évaluations sont supprimés

### 2. Filtrage par promotion

- Le sélecteur de promotion liste toutes les promotions existantes
- Par défaut, la promotion la plus récente est sélectionnée
- Sélectionner "Toutes les promotions" pour voir tous les élèves

### 3. Génération Excel

**Quand générer ?** : Avant la première évaluation d'un élève.

**Processus** :
1. Cliquer sur "📄 Générer Excel"
2. Le fichier est créé dans `backend/export/PROMOTION/Nom_Prenom.xlsx`
3. Toutes les informations d'identité sont pré-remplies
4. Le statut passe à "✓ Généré"

### 4. Évaluation des compétences

**Workflow** :
1. Cliquer sur "✏️ Évaluer"
2. Sélectionner un semestre
3. Pour chaque critère, cocher un niveau (1-4)
4. Les critères non évalués sont en jaune
5. Dès qu'on évalue, le jaune disparaît immédiatement
6. Ajouter un commentaire si note < 10/20
7. "💾 Enregistrer brouillon" (JSON seulement)
8. "✅ Finaliser" (JSON + Excel)

**Affichage des notes** :
- Note du semestre actuel
- Moyenne générale (4 semestres)
- Détail par compétence
- Couleur selon la note (rouge < 10, vert ≥ 10)

### 5. Téléchargement Excel

1. Cliquer sur "💾 Télécharger"
2. Le fichier Excel complet est téléchargé
3. Contient toutes les évaluations finalisées

---

## Configuration

### config.json

```json
{
  "port": 3000,
  "paths": {
    "modeles": "./modeles",
    "export": "./backend/export",
    "data": "./backend/data",
    "config": "./backend/config"
  },
  "fichiers": {
    "modele_excel": "modele_officiel.xlsx",
    "eleves": "eleves.json",
    "evaluations": "evaluations.json",
    "mapping": "mapping.json"
  }
}
```

### mapping.json

**Structure** :

```json
{
  "sheetNames": {
    "semestre_1": "E5-FICHE SEMESTRE1 E5-IR",
    "semestre_2": "E5-FICHE SEMESTRE2 E5-IR",
    ...
  },
  "identite": {
    "nom": {
      "semestre_1": "E9",
      "semestre_2": "E9",
      ...
    }
  },
  "competences": {
    "C02": {
      "nom": "ORGANISER UNE INTERVENTION",
      "coefficient": 0.2,
      "criteres": [
        {
          "id": "c02_c1",
          "nom": "Les différents interlocuteurs...",
          "coefficient": 0.25,
          "ligne": 20
        }
      ]
    }
  },
  "niveaux": {
    "niveau_1": { "colonne": "C", "valeur": 0 },
    "niveau_2": { "colonne": "D", "valeur": 1 },
    "niveau_3": { "colonne": "E", "valeur": 2 },
    "niveau_4": { "colonne": "F", "valeur": 3 }
  }
}
```

**À quoi ça sert ?** :
- Mapper les champs JSON vers les cellules Excel
- Définir les compétences et critères
- Configurer les coefficients de calcul

---

## Points techniques importants

### 1. Gestion des promotions

Les fichiers Excel sont organisés par dossier de promotion :
- `backend/export/2024-2026/`
- `backend/export/2025-2027/`

**Compatibilité** : Le code gère à la fois `promotion` et `classe` pour assurer la rétrocompatibilité.

### 2. Mise à jour visuelle immédiate

Lorsqu'un critère est évalué :
```javascript
// 1. Supprimer le fond jaune
row.classList.remove('critere-non-evalue');

// 2. Supprimer le badge "Non évalué"
badge.remove();
```

Après sauvegarde :
```javascript
// Recharger ET régénérer le formulaire
await chargerEvaluation();
await genererFormulaire();
```

### 3. Calcul des notes

**Formule** :
```
Note critère = niveau (0-3)
Note compétence = Σ(note critère × coef critère) / Σ(coef critères)
Note semestre = Σ(note compétence × coef compétence)
Note finale = (note semestre / 3) × 20
```

**Exemple** :
- Critère 1 : niveau 2, coef 0.25 → 2 × 0.25 = 0.5
- Critère 2 : niveau 3, coef 0.25 → 3 × 0.25 = 0.75
- Note compétence = (0.5 + 0.75) / (0.25 + 0.25) = 2.5 / 0.5 = 2.5
- Note sur 20 = (2.5 / 3) × 20 = 16.67/20

### 4. Gestion des erreurs

Tous les endpoints API utilisent try/catch :
```javascript
try {
  // Traitement
  res.json({ success: true });
} catch (error) {
  res.status(500).json({ error: error.message });
}
```

Frontend :
```javascript
try {
  const response = await fetch(...);
  if (!response.ok) throw new Error('Erreur');
  // Traitement
} catch (err) {
  alert(`❌ Erreur: ${err.message}`);
}
```

---

## Démarrage de l'application

### 1. Installation

```bash
npm install
```

### 2. Lancement

```bash
node backend/server.js
```

### 3. Accès

Ouvrir : `http://localhost:3000`

---

## Maintenance et évolution

### Ajouter une compétence

1. Modifier `backend/config/mapping.json` :
```json
"C12": {
  "nom": "Nouvelle compétence",
  "coefficient": 0.1,
  "criteres": [...]
}
```

2. Le frontend se met à jour automatiquement

### Ajouter un champ d'identité

1. Ajouter dans `mapping.json` :
```json
"identite": {
  "nouveau_champ": {
    "semestre_1": "E12",
    ...
  }
}
```

2. Modifier `excelService.remplirIdentite()` pour inclure ce champ

### Changer le modèle Excel

Remplacer `modeles/modele_officiel.xlsx` et ajuster le mapping si nécessaire.

---

## Conclusion

Cette application est conçue pour être :
- **Simple** : Fichiers JSON, pas de base de données complexe
- **Portable** : Tout tient dans un dossier
- **Maintenable** : Code modulaire et bien structuré
- **Évolutive** : Configuration externe (mapping.json)

Pour toute question ou amélioration, se référer aux fichiers de code commentés.

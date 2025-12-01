# ✨ Nouvelles fonctionnalités ajoutées

## 🎯 Objectifs
1. Permettre l'ajout d'élèves via l'interface web
2. Afficher les notes calculées et la moyenne générale

---

## 1️⃣ Gestion des élèves

### ➕ Ajouter un élève

**Page d'accueil** : Bouton "➕ Ajouter un élève"

- Ouvre une **modal** avec un formulaire
- Champs requis :
  - Nom
  - Prénom
  - Classe (pré-rempli : "BTS CIEL 1")
  - Numéro candidat
  - Académie (pré-rempli : "Académie de Paris")
  - Établissement (pré-rempli : "Lycée Exemple")
  - Session (pré-rempli : "SESSION 2024")

- Validation automatique
- Confirmation et actualisation de la liste

### 🗑️ Supprimer un élève

**Nouveau bouton** : "🗑️ Supprimer" pour chaque élève

- Confirmation avant suppression
- **Supprime également** :
  - Les évaluations de l'élève
  - Le fichier Excel (si existant)

### 📝 Note technique
- L'ID est auto-généré (max + 1)
- Les données sont sauvegardées dans `backend/data/eleves.json`

---

## 2️⃣ Affichage des notes

### 📊 Calcul automatique

Le système calcule automatiquement :

1. **Note par compétence** (C02, C06, C09, C11)
   - Basée sur les niveaux attribués (0-3)
   - Pondérée par les coefficients des critères

2. **Note du semestre** (/20)
   - Formule : `(Total pondéré / 3) × 20`
   - Total pondéré = Σ (note_compétence × coefficient_compétence)

3. **Moyenne générale** (/20)
   - Moyenne des notes de tous les semestres évalués

### 🎨 Interface de visualisation

**Page d'évaluation** : Nouveau bloc "📊 Notes calculées"

#### Cartes de notes
- **Semestre actuel** : Note du semestre en cours
- **Moyenne générale** : Moyenne de tous les semestres

#### Code couleur
- 🟢 **Excellent** : ≥ 16/20 (vert)
- 🔵 **Très bien** : ≥ 14/20 (bleu)
- 🟣 **Bien** : ≥ 12/20 (violet)
- 🟡 **Passable** : ≥ 10/20 (jaune)
- 🔴 **Insuffisant** : < 10/20 (rouge)

#### Détails par compétence
Affichage de la note de chaque compétence pour le semestre actuel :
- C02 : Organiser une intervention
- C06 : Valider un système informatique
- C09 : Installer un réseau informatique
- C11 : Maintenir un réseau informatique

### 🔄 Actualisation automatique
Les notes se mettent à jour automatiquement :
- Après "💾 Enregistrer brouillon"
- Après "✅ Finaliser et remplir Excel"

---

## 🔧 Modifications techniques

### Backend

#### Nouvelles routes API

```
POST   /api/eleves                    - Ajouter un élève
PUT    /api/eleves/:id                - Modifier un élève
DELETE /api/eleves/:id                - Supprimer un élève
GET    /api/eleves/:id/notes          - Récupérer les notes calculées
```

#### Nouvelles méthodes (dataService.js)

```javascript
addEleve(eleveData)           // Ajoute un élève avec ID auto
updateEleve(id, eleveData)    // Modifie un élève
deleteEleve(id)               // Supprime élève + évaluations
calculerNotes(id)             // Calcule toutes les notes
calculerNoteSemestre(data)    // Calcule la note d'un semestre
```

#### Algorithme de calcul

```
Pour chaque compétence :
  total_criteres = 0
  total_coefficients = 0

  Pour chaque critère :
    total_criteres += niveau × coefficient_critere
    total_coefficients += coefficient_critere

  note_competence = total_criteres / total_coefficients

total_pondere = Σ (note_competence × coefficient_competence)
note_semestre = (total_pondere / 3) × 20

moyenne_generale = Σ notes_semestres / nb_semestres_evalues
```

### Frontend

#### Nouveaux fichiers modifiés

**HTML** :
- `frontend/index.html` : Modal d'ajout d'élève
- `frontend/evaluation.html` : Bloc de notes

**CSS** : `public/css/styles.css`
- Styles pour la modal
- Styles pour les cartes de notes
- Code couleur pour les niveaux

**JavaScript** :
- `public/js/index.js` : Gestion de la modal et suppression
- `public/js/evaluation.js` : Affichage et calcul des notes

#### Nouvelles fonctions JavaScript

```javascript
// index.js
ouvrirModalAjout()
fermerModalAjout()
ajouterEleve(event)
supprimerEleve(id, nom, prenom)

// evaluation.js
afficherNotes()
getNoteClass(note)
```

---

## 📈 Exemple de calcul

### Données : Alice Dupont - Semestre 1

#### C02 : Organiser une intervention (coef 0.2)
- c02_c1 : Niveau 3 (coef 0.25) → 3 × 0.25 = 0.75
- c02_c2 : Niveau 2 (coef 0.25) → 2 × 0.25 = 0.50
- c02_c3 : Niveau 2 (coef 0.2)  → 2 × 0.2  = 0.40
- c02_c4 : Niveau 3 (coef 0.3)  → 3 × 0.3  = 0.90
- **Total** : 2.55 / 1.0 = **2.55**

#### C06 : Valider un système (coef 0.2)
- 6 critères évalués
- **Total** : **2.60**

#### C09 : Installer un réseau (coef 0.3)
- 6 critères évalués
- **Total** : **2.50**

#### C11 : Maintenir un réseau (coef 0.3)
- 5 critères évalués
- **Total** : **2.50**

### Calcul final

```
Total pondéré = (2.55 × 0.2) + (2.60 × 0.2) + (2.50 × 0.3) + (2.50 × 0.3)
              = 0.51 + 0.52 + 0.75 + 0.75
              = 2.53

Note semestre = (2.53 / 3) × 20 = 16.87 / 20
```

### Moyenne générale (4 semestres)

```
Semestre 1 : 16.87
Semestre 2 : 15.53
Semestre 3 : 15.40
Semestre 4 : 15.87

Moyenne = (16.87 + 15.53 + 15.40 + 15.87) / 4 = 15.92 / 20
```

🎉 **Alice Dupont a une moyenne de 15.92/20 !**

---

## 🎨 Aperçu visuel

### Page d'accueil

```
┌─────────────────────────────────────────┐
│ 🎓 Évaluation BTS CIEL - Épreuve E5   │
├─────────────────────────────────────────┤
│ [➕ Ajouter élève] [🔄 Actualiser]     │
│                            3 élève(s)   │
├─────────────────────────────────────────┤
│ ID  Nom      Prénom  Classe  Actions   │
├─────────────────────────────────────────┤
│ 1   Dupont   Alice   BTS 1   [Évaluer] │
│                                [🗑️]     │
└─────────────────────────────────────────┘
```

### Page d'évaluation

```
┌──────────────────────────────────────────┐
│ 📝 Évaluation - Alice Dupont            │
├──────────────────────────────────────────┤
│ Semestre : [Semestre 1 ▼]               │
├──────────────────────────────────────────┤
│ 📊 Notes calculées                       │
│ ┌──────────────┐  ┌─────────────────┐   │
│ │ Semestre 1   │  │ Moyenne générale│   │
│ │   16.87/20   │  │    15.92/20     │   │
│ └──────────────┘  └─────────────────┘   │
│                                          │
│ Détails par compétence:                 │
│ C02 - Organiser          17.00/20 🟢    │
│ C06 - Valider            17.33/20 🟢    │
│ C09 - Installer          16.67/20 🟢    │
│ C11 - Maintenir          16.67/20 🟢    │
└──────────────────────────────────────────┘
```

---

## ✅ Tests effectués

### Ajout d'élève
- ✅ Modal s'ouvre correctement
- ✅ Formulaire avec valeurs par défaut
- ✅ Validation des champs obligatoires
- ✅ Génération automatique de l'ID
- ✅ Sauvegarde dans eleves.json
- ✅ Actualisation de la liste

### Suppression d'élève
- ✅ Confirmation avant suppression
- ✅ Suppression dans eleves.json
- ✅ Suppression dans evaluations.json
- ✅ Actualisation de la liste

### Calcul de notes
- ✅ API `/api/eleves/:id/notes` fonctionnelle
- ✅ Calcul correct des notes par compétence
- ✅ Calcul correct de la note du semestre
- ✅ Calcul correct de la moyenne générale
- ✅ Affichage avec code couleur
- ✅ Détails par compétence

### Actualisation
- ✅ Notes mises à jour après sauvegarde
- ✅ Notes mises à jour après finalisation

---

## 🚀 Utilisation

### Ajouter un élève

1. Page d'accueil → **"➕ Ajouter un élève"**
2. Remplir le formulaire
3. **"Ajouter"**
4. L'élève apparaît dans la liste

### Consulter les notes

1. **"✏️ Évaluer"** sur un élève
2. Sélectionner un semestre
3. Le bloc "📊 Notes calculées" s'affiche automatiquement
4. Notes du semestre + Moyenne générale visible

### Supprimer un élève

1. **"🗑️ Supprimer"** sur un élève
2. Confirmer
3. L'élève est supprimé définitivement

---

## 📝 Notes importantes

- Les notes sont calculées **à la volée** (pas de stockage)
- Les calculs respectent la **pondération officielle**
- La moyenne générale prend en compte **tous les semestres évalués**
- Un semestre non évalué (tous critères à `null`) n'est pas comptabilisé

---

**Version** : 1.1.0
**Date** : 30 novembre 2024

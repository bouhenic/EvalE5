# Guide d'importation de fichiers Excel existants

Ce guide explique comment importer des fichiers Excel d'évaluation déjà remplis dans l'application.

## ✅ Fonctionnement

L'application peut utiliser des fichiers Excel déjà remplis. Vous pouvez :
1. Placer un fichier Excel pré-rempli dans le dossier approprié
2. Créer l'élève correspondant dans l'application
3. Accéder et modifier les évaluations existantes

## 📁 Structure des dossiers

Les fichiers Excel sont organisés par promotion :

```
backend/export/
├── 2024-2026/
│   ├── DUPONT_Marie_E5_Evaluation.xlsx
│   └── MARTIN_Paul_E5_Evaluation.xlsx
└── 2025-2027/
    └── DURAND_LOIC_E5_Evaluation.xlsx
```

## 📝 Convention de nommage

**IMPORTANT** : Le nom du fichier doit suivre exactement ce format :

```
NOM_Prenom_E5_Evaluation.xlsx
```

### Exemples corrects :
- ✅ `DUPONT_Marie_E5_Evaluation.xlsx`
- ✅ `MARTIN_Paul_E5_Evaluation.xlsx`
- ✅ `ABAID_Soulaimane_E5_Evaluation.xlsx`

### Exemples incorrects :
- ❌ `Marie_DUPONT_E5_Evaluation.xlsx` (prénom avant nom)
- ❌ `DUPONT_Marie.xlsx` (manque le suffixe)
- ❌ `dupont_marie_E5_Evaluation.xlsx` (nom en minuscules)
- ❌ `DUPONT Marie_E5_Evaluation.xlsx` (espace au lieu d'underscore)

## 🔄 Procédure d'importation

### Étape 1 : Préparer le fichier Excel

Le fichier doit être au format du modèle officiel avec :
- Les feuilles : `E5-FICHE SEMESTRE1 E5-IR`, `E5-FICHE SEMESTRE2 E5-IR`, etc.
- Les évaluations marquées par des "x" dans les colonnes C, D, E, F
- Les informations d'identité dans les cellules appropriées

### Étape 2 : Placer le fichier dans le bon dossier

1. Identifiez la promotion de l'élève (ex: `2024-2026`)
2. Créez le dossier si nécessaire :
   ```bash
   mkdir -p backend/export/2024-2026
   ```
3. Copiez le fichier dans ce dossier

### Étape 3 : Ajouter l'élève dans l'application

1. Connectez-vous à l'application
2. Cliquez sur "➕ Ajouter un élève"
3. Remplissez les informations **EXACTEMENT** comme dans le nom du fichier :
   - **Nom** : DUPONT (en MAJUSCULES)
   - **Prénom** : Marie (Première lettre en majuscule)
   - **Promotion** : 2024-2026 (doit correspondre au dossier)
   - **N° Candidat** : Le numéro de l'élève
   - **Académie** : Académie de Versailles
   - **Établissement** : Lycée Isaac Newton
   - **Session** : SESSION 2026

4. Cliquez sur "Ajouter"

### Étape 4 : Vérifier et accéder à l'évaluation

1. L'élève apparaît dans la liste avec le badge "✅ Généré"
2. Cliquez sur "📝 Évaluer" pour accéder aux évaluations
3. Les données déjà présentes dans le fichier Excel seront affichées
4. Vous pouvez modifier et sauvegarder de nouvelles évaluations

## 🔍 Vérification

### Vérifier que le fichier est reconnu

Dans la liste des élèves, la colonne "Statut Excel" doit afficher :
- ✅ **"✅ Généré"** : Le fichier existe et est reconnu
- ⚠️ **"❌ Non généré"** : Le fichier n'existe pas ou le nom ne correspond pas

### Résolution des problèmes

#### Le fichier n'est pas reconnu

**Problème** : L'élève affiche "❌ Non généré"

**Solutions** :
1. Vérifiez que le nom du fichier correspond exactement :
   ```
   backend/export/[PROMOTION]/NOM_Prenom_E5_Evaluation.xlsx
   ```

2. Vérifiez la casse (majuscules/minuscules) :
   - Le nom doit être en MAJUSCULES : `DUPONT`
   - Le prénom avec première lettre en majuscule : `Marie`

3. Vérifiez que le fichier est dans le bon dossier de promotion

4. Redémarrez le serveur :
   ```bash
   # Arrêter
   pkill -f "node backend/server.js"

   # Redémarrer
   npm start
   ```

#### Les évaluations ne s'affichent pas

**Problème** : Le fichier est reconnu mais les évaluations sont vides

**Cause probable** : Le fichier n'a pas la bonne structure ou les "x" ne sont pas dans les bonnes cellules

**Solution** : Utilisez le modèle officiel (`modeles/modele_officiel.xlsx`) comme base

## 📊 Test d'importation

Un élève de test a été créé pour démonstration :

```
Fichier : backend/export/2024-2026/DUPONT_Marie_E5_Evaluation.xlsx
Élève   : DUPONT Marie (ID: 6)
Données :
  - Promotion: 2024-2026
  - N° Candidat: 2024999
  - Semestre 1: 3 évaluations pré-remplies
    * C02_C1: Niveau 3
    * C02_C2: Niveau 2
    * C06_C1: Niveau 4
  - Commentaire: "Très bon travail..."
```

Vous pouvez utiliser cet élève pour tester la fonctionnalité d'importation.

## 💡 Conseils

1. **Toujours utiliser le modèle officiel** comme base pour créer des fichiers Excel
2. **Respecter exactement** la convention de nommage
3. **Vérifier la promotion** avant de placer le fichier
4. **Sauvegarder régulièrement** les fichiers Excel en dehors de l'application
5. **Ne pas ouvrir** le fichier Excel pendant que l'application l'utilise

## ⚠️ Attention

- Les fichiers Excel dans `backend/export/` ne sont **pas suivis par Git** (pour la confidentialité)
- Pensez à faire des **sauvegardes régulières** de ces fichiers
- Si vous supprimez un élève dans l'application, son fichier Excel **n'est pas supprimé automatiquement**

# 🚀 Guide de démarrage rapide

## Démarrage en 3 étapes

### 1️⃣ Installer les dépendances (déjà fait)
```bash
npm install
```

### 2️⃣ Démarrer le serveur
```bash
npm start
```

Vous devriez voir :
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎓 Serveur d'évaluation BTS CIEL - Épreuve E5         ║
║                                                           ║
║   📡 Port: 3000                                          ║
║   🌐 URL: http://localhost:3000                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### 3️⃣ Ouvrir l'application
Ouvrir votre navigateur à l'adresse : **http://localhost:3000**

## 📝 Premier workflow

### Sur la page d'accueil :
1. Vous voyez 3 élèves d'exemple
2. Pour chaque élève, cliquez sur **"📄 Générer Excel"**
3. Un fichier `.xlsx` sera créé dans `backend/export/`

### Évaluer un élève :
1. Cliquez sur **"✏️ Évaluer"** pour un élève
2. Sélectionnez un **semestre** dans la liste déroulante
3. Remplissez l'évaluation :
   - Pour chaque critère, cochez le niveau atteint (1 à 4)
4. Ajoutez un commentaire si nécessaire
5. **💾 Enregistrer brouillon** : sauvegarde en JSON
6. **✅ Finaliser** : sauvegarde + remplissage du fichier Excel

### Télécharger le fichier Excel :
1. Retour à la page d'accueil
2. Cliquez sur **"💾 Télécharger"**

## 🎯 Compétences évaluées

### C02 - Organiser une intervention (20%)
- 4 critères à évaluer

### C06 - Valider un système informatique (20%)
- 6 critères à évaluer

### C09 - Installer un réseau informatique (30%)
- 6 critères à évaluer

### C11 - Maintenir un réseau informatique (30%)
- 5 critères à évaluer

## 📊 Calcul automatique

La note finale est calculée automatiquement dans Excel :
```
Note /20 = (C02×0.2 + C06×0.2 + C09×0.3 + C11×0.3) × 20/3 + Bonus
```

## 🛠️ Personnalisation

### Ajouter un élève
Éditer `backend/data/eleves.json` :
```json
{
  "id": 4,
  "nom": "Nouveau",
  "prenom": "Eleve",
  "classe": "BTS CIEL 1",
  "numero_candidat": "2024004",
  "academie": "Académie de Paris",
  "etablissement": "Lycée Exemple",
  "session": "SESSION 2024"
}
```

Puis **relancer le serveur** pour voir le nouvel élève.

## ⚠️ Points importants

1. **Toujours générer le fichier Excel avant d'évaluer**
2. **Les formules Excel sont préservées** - ne jamais modifier manuellement
3. **Sauvegarder en brouillon** permet de reprendre plus tard
4. **Finaliser** écrit définitivement dans le fichier Excel

## 🐛 Problèmes ?

### Le serveur ne démarre pas ?
- Vérifier que le port 3000 est libre : `lsof -i :3000`
- Si occupé : changer le port dans `backend/config/config.json`

### Erreur "Fichier Excel non trouvé" ?
- Générer d'abord le fichier depuis la page d'accueil

### L'application ne charge pas ?
- Vérifier que le serveur est bien démarré
- Ouvrir la console du navigateur (F12) pour voir les erreurs

## 📖 Documentation complète

Voir **README.md** pour :
- Architecture détaillée
- API complète
- Configuration avancée
- Mapping Excel

---

**Bon travail !** 🎓

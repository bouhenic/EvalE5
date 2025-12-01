# 📚 Documentation de l'Application EvalE5

Bienvenue dans la documentation de l'application d'évaluation BTS CIEL E5.

## 📖 Fichiers de documentation

### [DOCUMENTATION_COMPLETE.md](./DOCUMENTATION_COMPLETE.md)

**Documentation technique complète** qui explique en détail :

- ✅ Architecture générale de l'application
- ✅ Structure des dossiers et fichiers
- ✅ Fonctionnement du Backend (services, routes, API)
- ✅ Fonctionnement du Frontend (HTML, CSS, JavaScript)
- ✅ Flux de données entre les composants
- ✅ Toutes les fonctionnalités pas à pas
- ✅ Configuration et mapping Excel
- ✅ Calcul des notes
- ✅ Gestion des promotions
- ✅ Guide de maintenance

**À lire si vous voulez** :
- Comprendre comment fonctionne l'application
- Modifier ou ajouter des fonctionnalités
- Débugger un problème
- Former un nouveau développeur

---

## 🚀 Démarrage rapide

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur
node backend/server.js

# 3. Ouvrir dans le navigateur
http://localhost:3000
```

---

## 📂 Structure du projet

```
EvalE5/
├── backend/              # Code serveur Node.js
│   ├── config/          # Configuration (mapping Excel, etc.)
│   ├── data/            # Données JSON (élèves, évaluations)
│   ├── export/          # Fichiers Excel générés (par promotion)
│   ├── routes/          # Routes API REST
│   ├── services/        # Logique métier (data, excel)
│   └── server.js        # Point d'entrée serveur
├── frontend/            # Pages HTML
├── public/              # Assets (CSS, JS)
├── modeles/             # Modèle Excel de base
└── Explications/        # 📚 Documentation (vous êtes ici)
```

---

## 🎯 Fonctionnalités principales

### 1. Gestion des élèves
- Ajouter/modifier/supprimer des élèves
- Organiser par promotion (2024-2026, 2025-2027, etc.)
- Filtrer l'affichage par promotion

### 2. Génération de fichiers Excel
- Créer un fichier Excel personnalisé par élève
- Pré-remplir automatiquement les informations d'identité
- Organiser les fichiers dans des dossiers par promotion

### 3. Évaluation des compétences
- Évaluer 4 compétences sur 4 semestres
- Interface intuitive avec feedback visuel immédiat
- Sauvegarde en brouillon ou finalisation

### 4. Calcul automatique des notes
- Calcul en temps réel des notes par semestre
- Moyenne générale sur les 4 semestres
- Affichage coloré selon le niveau

### 5. Export et téléchargement
- Télécharger les fichiers Excel complétés
- Toutes les évaluations sont inscrites dans le fichier

---

## 🔧 Technologies

| Composant | Technologie |
|-----------|-------------|
| Backend | Node.js + Express |
| Frontend | HTML5 + CSS3 + JavaScript (vanilla) |
| Stockage | Fichiers JSON |
| Excel | xlsx-populate |
| API | REST |

---

## 📊 Flux de travail typique

### Scénario : Évaluer un élève

1. **Préparer l'élève**
   - Page d'accueil → Ajouter un élève
   - Cliquer "📄 Générer Excel"

2. **Évaluer un semestre**
   - Cliquer "✏️ Évaluer"
   - Sélectionner "Semestre 1"
   - Cocher les niveaux pour chaque critère
   - Ajouter un commentaire
   - Cliquer "✅ Finaliser"

3. **Télécharger le fichier**
   - Retour à la page d'accueil
   - Cliquer "💾 Télécharger"
   - Le fichier Excel est complet avec l'évaluation

4. **Répéter pour les autres semestres**

---

## 🎨 Interface utilisateur

### Page d'accueil
- **Toolbar** : Boutons d'action + filtre promotion + compteur
- **Tableau** : Liste des élèves avec notes et actions
- **Modal** : Formulaire d'ajout d'élève

### Page d'évaluation
- **Header** : Infos élève + navigation
- **Sélecteur** : Choix du semestre
- **Notes** : Affichage des notes calculées
- **Formulaire** : Grilles d'évaluation par compétence
- **Commentaire** : Zone de texte pour commentaire global
- **Actions** : Boutons sauvegarde/finalisation

---

## 🔐 Sécurité et bonnes pratiques

### Points de sécurité implémentés :
- Validation des données côté serveur
- Gestion des erreurs avec try/catch
- Vérification de l'existence des fichiers
- Messages d'erreur clairs pour l'utilisateur

### Bonnes pratiques :
- Code modulaire et réutilisable
- Services séparés (data, excel)
- Configuration externalisée (JSON)
- Nommage cohérent et explicite

---

## 📈 Évolution future possible

### Améliorations suggérées :
- [ ] Authentification utilisateur
- [ ] Export PDF en plus d'Excel
- [ ] Graphiques de progression
- [ ] Import/export de données en masse
- [ ] Sauvegarde automatique (auto-save)
- [ ] Mode hors ligne (PWA)
- [ ] Notifications en temps réel

### Maintenance :
- Mettre à jour le modèle Excel si le format change
- Ajuster le mapping si nouvelles compétences
- Sauvegarder régulièrement les données JSON

---

## 🆘 Support

### En cas de problème :

1. **Vérifier les logs du serveur**
   ```bash
   node backend/server.js
   # Regarder les messages d'erreur
   ```

2. **Vérifier la console du navigateur**
   - F12 → Onglet Console
   - Regarder les erreurs en rouge

3. **Consulter la documentation complète**
   - [DOCUMENTATION_COMPLETE.md](./DOCUMENTATION_COMPLETE.md)

4. **Problèmes courants** :
   - Fichier Excel non généré → Vérifier que le dossier `backend/export/` existe
   - Notes non calculées → Vérifier que les évaluations sont sauvegardées
   - Erreur 404 → Vérifier que le serveur est démarré

---

## 📝 Licence et crédits

Application développée pour la gestion des évaluations BTS CIEL E5.

**Auteur** : Samuel Bouhenic
**Date** : 2025
**Version** : 1.0

---

## 🎓 Ressources complémentaires

### Documentation Node.js :
- [Express.js](https://expressjs.com/)
- [xlsx-populate](https://github.com/dtjohnson/xlsx-populate)

### Standards web :
- [MDN Web Docs](https://developer.mozilla.org/)
- [REST API Best Practices](https://restfulapi.net/)

---

**Bonne lecture ! 📖**

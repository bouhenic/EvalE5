const XlsxPopulate = require('xlsx-populate');
const fs = require('fs').promises;
const path = require('path');

const config = require('../config/config.json');
const mapping = require('../config/mapping.json');

class ExcelService {
  constructor() {
    this.modelePath = path.join(process.cwd(), config.paths.modeles, config.fichiers.modele_excel);
    this.exportPath = path.join(process.cwd(), config.paths.export);
  }

  /**
   * Obtient le dossier de promotion pour un élève
   * @param {Object} eleve - Données de l'élève
   * @returns {string} - Chemin du dossier de promotion
   */
  getPromotionPath(eleve) {
    const promotion = eleve.promotion || eleve.classe || 'Non_classé';
    return path.join(this.exportPath, promotion);
  }

  /**
   * Génère un fichier Excel individuel pour un élève
   * @param {Object} eleve - Données de l'élève
   * @returns {Promise<string>} - Chemin du fichier généré
   */
  async genererFichierEleve(eleve) {
    try {
      // Créer le dossier de promotion s'il n'existe pas
      const promotionPath = this.getPromotionPath(eleve);
      await fs.mkdir(promotionPath, { recursive: true });

      // Nom du fichier de sortie
      const outputFileName = `${eleve.nom}_${eleve.prenom}_E5_Evaluation.xlsx`;
      const outputPath = path.join(promotionPath, outputFileName);

      // Charger le modèle avec xlsx-populate
      const workbook = await XlsxPopulate.fromFileAsync(this.modelePath);

      // Remplir les informations d'identité dans tous les onglets
      await this.remplirIdentite(workbook, eleve);

      // Sauvegarder le fichier
      await workbook.toFileAsync(outputPath);

      return outputFileName;
    } catch (error) {
      console.error('Erreur lors de la génération du fichier Excel:', error);
      throw new Error(`Impossible de générer le fichier Excel: ${error.message}`);
    }
  }

  /**
   * Remplit les informations d'identité dans toutes les feuilles
   * @param {XlsxPopulate.Workbook} workbook - Le classeur Excel
   * @param {Object} eleve - Données de l'élève
   */
  async remplirIdentite(workbook, eleve) {
    const identiteFields = {
      academie: eleve.academie || '',
      etablissement: eleve.etablissement || '',
      nom: eleve.nom || '',
      prenom: eleve.prenom || '',
      numero_candidat: eleve.numero_candidat || '',
      session: eleve.session || 'SESSION 2024'
    };

    console.log('📝 Remplissage des champs d\'identité pour:', eleve.nom, eleve.prenom);
    let celluleRemplies = 0;
    let erreursRencontrees = 0;

    // Pour chaque champ d'identité
    for (const [field, value] of Object.entries(identiteFields)) {
      const fieldMapping = mapping.identite[field];
      if (!fieldMapping) {
        console.warn(`⚠️  Champ non mappé: ${field}`);
        continue;
      }

      // Pour chaque onglet (semestre et fiches)
      for (const [key, cellAddress] of Object.entries(fieldMapping)) {
        const sheetName = mapping.sheetNames[key];
        if (!sheetName) {
          console.warn(`⚠️  Nom d'onglet non trouvé pour la clé: ${key}`);
          continue;
        }

        try {
          const sheet = workbook.sheet(sheetName);
          if (!sheet) {
            console.warn(`⚠️  Feuille non trouvée: ${sheetName}`);
            erreursRencontrees++;
            continue;
          }

          // Écrire la valeur dans la cellule
          sheet.cell(cellAddress).value(value);
          celluleRemplies++;
        } catch (err) {
          console.error(`❌ Erreur lors de l'écriture dans ${sheetName}:${cellAddress}:`, err.message);
          erreursRencontrees++;
        }
      }
    }

    console.log(`✅ Identité remplie: ${celluleRemplies} cellules modifiées, ${erreursRencontrees} erreurs`);
  }

  /**
   * Remplit un semestre avec les données d'évaluation
   * @param {string} eleveNom - Nom de l'élève
   * @param {string} elevePrenom - Prénom de l'élève
   * @param {string} semestreId - ID du semestre (ex: 'semestre_1')
   * @param {Object} evaluationData - Données d'évaluation
   * @param {Object} eleve - Objet élève complet avec promotion
   */
  async remplirSemestre(eleveNom, elevePrenom, semestreId, evaluationData, eleve) {
    try {
      // Chemin du fichier de l'élève
      const fileName = `${eleveNom}_${elevePrenom}_E5_Evaluation.xlsx`;
      const promotionPath = this.getPromotionPath(eleve);
      const filePath = path.join(promotionPath, fileName);

      // Vérifier que le fichier existe
      try {
        await fs.access(filePath);
      } catch {
        throw new Error('Le fichier Excel de cet élève n\'existe pas. Générez-le d\'abord.');
      }

      // Charger le fichier avec xlsx-populate
      const workbook = await XlsxPopulate.fromFileAsync(filePath);

      // Obtenir le nom de la feuille
      const sheetName = mapping.sheetNames[semestreId];
      if (!sheetName) {
        throw new Error(`Semestre inconnu: ${semestreId}`);
      }

      const sheet = workbook.sheet(sheetName);
      if (!sheet) {
        throw new Error(`Feuille non trouvée: ${sheetName}`);
      }

      // Effacer d'abord tous les "x" existants dans cette feuille
      this.effacerEvaluations(sheet);

      // Remplir les évaluations pour chaque compétence
      if (evaluationData.competences) {
        for (const [compCode, compData] of Object.entries(evaluationData.competences)) {
          const competence = mapping.competences[compCode];
          if (!competence) continue;

          if (compData.criteres) {
            for (const [critereId, critereData] of Object.entries(compData.criteres)) {
              // Trouver le critère dans le mapping
              const critere = competence.criteres.find(c => c.id === critereId);
              if (!critere || critereData.niveau === null || critereData.niveau === undefined) continue;

              // Déterminer la colonne selon le niveau
              let colonne;
              switch (parseInt(critereData.niveau)) {
                case 0:
                  colonne = mapping.niveaux.niveau_1.colonne;
                  break;
                case 1:
                  colonne = mapping.niveaux.niveau_2.colonne;
                  break;
                case 2:
                  colonne = mapping.niveaux.niveau_3.colonne;
                  break;
                case 3:
                  colonne = mapping.niveaux.niveau_4.colonne;
                  break;
                default:
                  continue;
              }

              // Écrire "x" dans la cellule appropriée
              const cellAddress = `${colonne}${critere.ligne}`;
              try {
                sheet.cell(cellAddress).value('x');
              } catch (err) {
                console.warn(`Erreur lors de l'écriture dans ${cellAddress}:`, err.message);
              }
            }
          }
        }
      }

      // Remplir le commentaire si présent
      if (evaluationData.commentaire && mapping.commentaires.commentaire_global[semestreId]) {
        try {
          const commentCellAddress = mapping.commentaires.commentaire_global[semestreId];
          sheet.cell(commentCellAddress).value(evaluationData.commentaire);
        } catch (err) {
          console.warn('Erreur lors de l\'écriture du commentaire:', err.message);
        }
      }

      // Sauvegarder le fichier
      await workbook.toFileAsync(filePath);

      return { success: true, message: 'Semestre rempli avec succès' };
    } catch (error) {
      console.error('Erreur lors du remplissage du semestre:', error);
      throw error;
    }
  }

  /**
   * Efface toutes les évaluations (les "x") d'une feuille
   * @param {XlsxPopulate.Sheet} sheet
   */
  effacerEvaluations(sheet) {
    const colonnes = ['C', 'D', 'E', 'F'];

    // Parcourir toutes les compétences
    for (const competence of Object.values(mapping.competences)) {
      for (const critere of competence.criteres) {
        for (const col of colonnes) {
          const cellAddress = `${col}${critere.ligne}`;
          try {
            const cell = sheet.cell(cellAddress);
            const value = cell.value();
            // Ne supprimer que si c'est un "x"
            if (value === 'x' || value === 'X') {
              cell.value(null);
            }
          } catch (err) {
            // Ignorer les erreurs de cellule inexistante
          }
        }
      }
    }
  }

  /**
   * Vérifie si le fichier Excel d'un élève existe
   * @param {string} nom
   * @param {string} prenom
   * @param {Object} eleve - Objet élève complet avec promotion
   */
  async fichierExiste(nom, prenom, eleve) {
    const fileName = `${nom}_${prenom}_E5_Evaluation.xlsx`;
    const promotionPath = this.getPromotionPath(eleve);
    const filePath = path.join(promotionPath, fileName);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retourne le chemin complet d'un fichier élève
   * @param {string} nom
   * @param {string} prenom
   * @param {Object} eleve - Objet élève complet avec promotion
   */
  getFilePath(nom, prenom, eleve) {
    const fileName = `${nom}_${prenom}_E5_Evaluation.xlsx`;
    const promotionPath = this.getPromotionPath(eleve);
    return path.join(promotionPath, fileName);
  }
}

module.exports = new ExcelService();

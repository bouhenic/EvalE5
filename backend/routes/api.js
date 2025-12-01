const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const excelService = require('../services/excelService');

/**
 * GET /api/eleves
 * Récupère la liste de tous les élèves
 */
router.get('/eleves', async (req, res) => {
  try {
    const eleves = await dataService.getEleves();

    // Ajouter l'info si le fichier Excel existe
    const elevesAvecFichier = await Promise.all(
      eleves.map(async (eleve) => {
        const fichierExiste = await excelService.fichierExiste(eleve.nom, eleve.prenom, eleve);
        return { ...eleve, fichierExiste };
      })
    );

    res.json(elevesAvecFichier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/eleves/:id
 * Récupère un élève par son ID
 */
router.get('/eleves/:id', async (req, res) => {
  try {
    const eleve = await dataService.getEleveById(req.params.id);
    if (!eleve) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }
    res.json(eleve);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/eleves/:id/generer-excel
 * Génère le fichier Excel pour un élève
 */
router.post('/eleves/:id/generer-excel', async (req, res) => {
  try {
    const eleve = await dataService.getEleveById(req.params.id);
    if (!eleve) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    const fileName = await excelService.genererFichierEleve(eleve);

    res.json({
      success: true,
      message: 'Fichier Excel généré avec succès',
      fileName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/eleves/:id/evaluations/:semestre
 * Récupère l'évaluation d'un semestre pour un élève
 */
router.get('/eleves/:id/evaluations/:semestre', async (req, res) => {
  try {
    const evaluation = await dataService.getEvaluationSemestre(
      req.params.id,
      req.params.semestre
    );
    res.json(evaluation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/eleves/:id/evaluations/:semestre/save
 * Sauvegarde l'évaluation d'un semestre (brouillon JSON)
 */
router.post('/eleves/:id/evaluations/:semestre/save', async (req, res) => {
  try {
    const result = await dataService.saveEvaluationSemestre(
      req.params.id,
      req.params.semestre,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/eleves/:id/evaluations/:semestre/finaliser
 * Finalise et écrit dans Excel
 */
router.post('/eleves/:id/evaluations/:semestre/finaliser', async (req, res) => {
  try {
    const eleve = await dataService.getEleveById(req.params.id);
    if (!eleve) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    // D'abord sauvegarder en JSON
    await dataService.saveEvaluationSemestre(
      req.params.id,
      req.params.semestre,
      req.body
    );

    // Ensuite remplir le fichier Excel
    const result = await excelService.remplirSemestre(
      eleve.nom,
      eleve.prenom,
      req.params.semestre,
      req.body,
      eleve
    );

    res.json({
      success: true,
      message: 'Évaluation finalisée et fichier Excel mis à jour'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/config/mapping
 * Récupère la configuration du mapping
 */
router.get('/config/mapping', (req, res) => {
  try {
    const mapping = dataService.getMapping();
    res.json(mapping);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/config
 * Récupère la configuration générale
 */
router.get('/config', (req, res) => {
  try {
    const config = dataService.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/eleves/:id/telecharger
 * Télécharge le fichier Excel d'un élève
 */
router.get('/eleves/:id/telecharger', async (req, res) => {
  try {
    const eleve = await dataService.getEleveById(req.params.id);
    if (!eleve) {
      return res.status(404).json({ error: 'Élève non trouvé' });
    }

    const filePath = excelService.getFilePath(eleve.nom, eleve.prenom, eleve);
    const fileName = `${eleve.nom}_${eleve.prenom}_E5_Evaluation.xlsx`;

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Erreur lors du téléchargement:', err);
        res.status(404).json({ error: 'Fichier non trouvé' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/eleves
 * Ajoute un nouvel élève
 */
router.post('/eleves', async (req, res) => {
  try {
    const result = await dataService.addEleve(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/eleves/:id
 * Modifie un élève existant
 */
router.put('/eleves/:id', async (req, res) => {
  try {
    const result = await dataService.updateEleve(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/eleves/:id
 * Supprime un élève
 */
router.delete('/eleves/:id', async (req, res) => {
  try {
    const result = await dataService.deleteEleve(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/eleves/:id/notes
 * Récupère les notes calculées pour un élève
 */
router.get('/eleves/:id/notes', async (req, res) => {
  try {
    const notes = await dataService.calculerNotes(req.params.id);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

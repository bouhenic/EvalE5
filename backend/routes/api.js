const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const excelService = require('../services/excelService');
const pdfImport = require('../services/pdfImportService');

/**
 * GET /api/eleves
 * Récupère la liste de tous les élèves
 */
router.get('/eleves', async (req, res) => {
  try {
    const eleves = await dataService.getEleves();

    // Initialiser le cache si nécessaire (première requête uniquement)
    await excelService.initialiserCache(eleves);

    // Ajouter l'info si le fichier Excel existe (utilise le cache)
    const elevesAvecFichier = eleves.map((eleve) => {
      const fichierExiste = excelService.fichierExisteCache.get(eleve.id) || false;
      return { ...eleve, fichierExiste };
    });

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
    excelService.resetCache();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/eleves/import-pdf
 * Importe des élèves depuis un PDF "Liste des élèves par classe" (Index Education).
 * Corps JSON : { pdfBase64, promotion, academie?, etablissement?, replace? }
 */
router.post('/eleves/import-pdf', async (req, res) => {
  try {
    const { pdfBase64, promotion, academie, etablissement, replace } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: 'Aucun fichier PDF fourni' });
    }
    if (!promotion || !/^\d{4}-\d{4}$/.test(promotion)) {
      return res.status(400).json({ error: 'Promotion invalide (format attendu : AAAA-AAAA)' });
    }

    // Le front envoie une data-URL "data:application/pdf;base64,XXXX"
    const base64 = pdfBase64.replace(/^data:.*;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    const parsed = pdfImport.extractNamesFromBuffer(buffer);
    if (parsed.length === 0) {
      return res.status(422).json({ error: 'Aucun élève détecté dans le PDF' });
    }

    const existants = replace ? [] : await dataService.getEleves();
    const { ajoutes, ignores } = pdfImport.buildEleveRecords(parsed, existants, {
      promotion,
      academie,
      etablissement,
    });

    // En mode remplacement, les évaluations des anciens élèves sont écartées.
    const evaluations = replace ? {} : await dataService.getEvaluations();
    const renum = dataService.renumeroterTout([...existants, ...ajoutes], evaluations);
    await dataService.sauvegarderElevesEtEvaluations(renum.eleves, renum.evaluations);
    excelService.resetCache();

    // Récupère les élèves réellement ajoutés avec leur id/numero définitifs.
    const cle = (e) => `${e.nom}|${e.prenom}`.toLowerCase();
    const ajouteSet = new Set(ajoutes.map(cle));
    const ajoutesFinal = renum.eleves
      .filter((e) => ajouteSet.has(cle(e)))
      .sort((a, b) => a.id - b.id);

    res.json({
      success: true,
      message: `${ajoutes.length} élève(s) importé(s)`,
      lus: parsed.length,
      ajoutes: ajoutesFinal,
      ignores,
    });
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
    excelService.resetCache();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/eleves/supprimer-multiple
 * Supprime plusieurs élèves d'un coup. Corps JSON : { ids: [1, 2, ...] }
 */
router.post('/eleves/supprimer-multiple', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Aucun élève sélectionné' });
    }
    const result = await dataService.deleteEleves(ids);
    excelService.resetCache();
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
    excelService.resetCache();
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

/**
 * POST /api/cache/reset
 * Réinitialise le cache des fichiers Excel
 */
router.post('/cache/reset', async (req, res) => {
  try {
    excelService.resetCache();
    res.json({ success: true, message: 'Cache réinitialisé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

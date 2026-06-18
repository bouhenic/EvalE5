const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config.json');
const mapping = require('../config/mapping.json');

class DataService {
  constructor() {
    this.elevesPath = path.join(process.cwd(), config.paths.data, config.fichiers.eleves);
    this.evaluationsPath = path.join(process.cwd(), config.paths.data, config.fichiers.evaluations);
  }

  /**
   * Récupère la liste de tous les élèves
   */
  async getEleves() {
    try {
      const data = await fs.readFile(this.elevesPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erreur lors de la lecture des élèves:', error);
      throw new Error('Impossible de lire la liste des élèves');
    }
  }

  /**
   * Récupère un élève par son ID
   */
  async getEleveById(id) {
    const eleves = await this.getEleves();
    return eleves.find(e => e.id === parseInt(id));
  }

  /**
   * Récupère toutes les évaluations
   */
  async getEvaluations() {
    try {
      const data = await fs.readFile(this.evaluationsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erreur lors de la lecture des évaluations:', error);
      return {};
    }
  }

  /**
   * Récupère les évaluations d'un élève
   */
  async getEvaluationEleve(eleveId) {
    const evaluations = await this.getEvaluations();
    return evaluations[eleveId] || this.creerStructureEvaluationVide(eleveId);
  }

  /**
   * Récupère l'évaluation d'un semestre pour un élève
   */
  async getEvaluationSemestre(eleveId, semestreId) {
    const evalEleve = await this.getEvaluationEleve(eleveId);

    if (!evalEleve.evaluations) {
      evalEleve.evaluations = {};
    }

    if (!evalEleve.evaluations[semestreId]) {
      evalEleve.evaluations[semestreId] = this.creerStructureSemestreVide();
    }

    return evalEleve.evaluations[semestreId];
  }

  /**
   * Sauvegarde l'évaluation d'un semestre
   */
  async saveEvaluationSemestre(eleveId, semestreId, evaluationData) {
    try {
      const evaluations = await this.getEvaluations();

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

      if (!evaluations[eleveId].evaluations) {
        evaluations[eleveId].evaluations = {};
      }

      evaluations[eleveId].evaluations[semestreId] = {
        ...evaluationData,
        date_evaluation: new Date().toISOString()
      };

      await fs.writeFile(this.evaluationsPath, JSON.stringify(evaluations, null, 2), 'utf8');

      return { success: true, message: 'Évaluation sauvegardée avec succès' };
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'évaluation:', error);
      throw new Error('Impossible de sauvegarder l\'évaluation');
    }
  }

  /**
   * Crée une structure vide pour un semestre
   */
  creerStructureSemestreVide() {
    const structure = {
      date_evaluation: null,
      commentaire: '',
      competences: {}
    };

    // Pour chaque compétence dans le mapping
    for (const [compCode, compData] of Object.entries(mapping.competences)) {
      structure.competences[compCode] = {
        criteres: {}
      };

      // Pour chaque critère de la compétence
      for (const critere of compData.criteres) {
        structure.competences[compCode].criteres[critere.id] = {
          niveau: null
        };
      }
    }

    return structure;
  }

  /**
   * Crée une structure d'évaluation vide pour un élève
   */
  creerStructureEvaluationVide(eleveId) {
    return {
      id: parseInt(eleveId),
      evaluations: {
        semestre_1: this.creerStructureSemestreVide(),
        semestre_2: this.creerStructureSemestreVide(),
        semestre_3: this.creerStructureSemestreVide(),
        semestre_4: this.creerStructureSemestreVide()
      }
    };
  }

  /**
   * Récupère la configuration du mapping
   */
  getMapping() {
    return mapping;
  }

  /**
   * Récupère la configuration générale
   */
  getConfig() {
    return config;
  }

  /**
   * Ajoute un nouvel élève
   */
  async addEleve(eleveData) {
    try {
      const eleves = await this.getEleves();
      const evaluations = await this.getEvaluations();

      // id temporaire unique, finalisé par la renumérotation par promotion.
      const maxId = eleves.length > 0 ? Math.max(...eleves.map(e => e.id)) : 0;
      eleves.push({ id: maxId + 1, ...eleveData });

      const renum = this.renumeroterTout(eleves, evaluations);
      await this.sauvegarderElevesEtEvaluations(renum.eleves, renum.evaluations);

      return { success: true, message: 'Élève ajouté avec succès' };
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'élève:', error);
      throw new Error('Impossible d\'ajouter l\'élève');
    }
  }

  /**
   * Remplace l'intégralité de la liste des élèves (écriture en un seul passage).
   */
  async saveAllEleves(eleves) {
    try {
      await fs.writeFile(this.elevesPath, JSON.stringify(eleves, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'écriture des élèves:', error);
      throw new Error('Impossible d\'enregistrer la liste des élèves');
    }
  }

  /**
   * Écrit en une fois la liste des élèves ET les évaluations (après renumérotation).
   */
  async sauvegarderElevesEtEvaluations(eleves, evaluations) {
    await fs.writeFile(this.elevesPath, JSON.stringify(eleves, null, 2), 'utf8');
    await fs.writeFile(this.evaluationsPath, JSON.stringify(evaluations, null, 2), 'utf8');
  }

  /**
   * Migration au démarrage : applique le schéma d'ids 2026XX aux données
   * existantes. N'écrit que si au moins un id change (idempotent).
   * @returns {Promise<{change: boolean, total: number}>}
   */
  async migrerIds() {
    const eleves = await this.getEleves();
    const evaluations = await this.getEvaluations();
    const renum = this.renumeroterTout(eleves, evaluations);

    const idsModifies = Object.entries(renum.remap)
      .some(([oldId, newId]) => String(oldId) !== String(newId));
    // length différent => des doublons ont été retirés
    const change = idsModifies || renum.eleves.length !== eleves.length;

    if (change) {
      await this.sauvegarderElevesEtEvaluations(renum.eleves, renum.evaluations);
    }
    return { change, total: renum.eleves.length };
  }

  /**
   * Renumérote tous les élèves par promotion (ordre alphabétique nom puis prénom).
   * id (entier) = annéeFin × 100 + rang ; numero_candidat = String(id). Ex: 202601.
   * Les clés des évaluations sont migrées selon l'ancien -> nouvel id.
   * Les promotions au format non standard (≠ AAAA-AAAA) conservent leur id.
   *
   * Fonction pure : ne lit/écrit aucun fichier.
   * @returns {{eleves: Array, evaluations: Object, remap: Object}}
   */
  renumeroterTout(eleves, evaluations = {}) {
    const PROMO_RE = /^\d{4}-\d{4}$/;

    // Déduplication de sécurité : un même (nom, prénom, promotion) ne doit
    // apparaître qu'une fois. On garde de préférence l'entrée qui possède
    // déjà une évaluation, sinon la première rencontrée.
    const aEval = (e) => {
      const ev = evaluations && evaluations[e.id];
      return !!(ev && ev.evaluations && Object.keys(ev.evaluations).length > 0);
    };
    const vus = new Map(); // cle -> index dans uniques
    const uniques = [];
    for (const e of eleves) {
      const k = `${e.nom}|${e.prenom}|${e.promotion}`.toLowerCase();
      if (!vus.has(k)) {
        vus.set(k, uniques.length);
        uniques.push(e);
      } else {
        const idx = vus.get(k);
        if (!aEval(uniques[idx]) && aEval(e)) uniques[idx] = e;
      }
    }

    const groupes = new Map();
    const autres = [];

    for (const e of uniques) {
      if (PROMO_RE.test(e.promotion || '')) {
        if (!groupes.has(e.promotion)) groupes.set(e.promotion, []);
        groupes.get(e.promotion).push(e);
      } else {
        autres.push(e);
      }
    }

    const remap = {}; // ancien id -> nouvel id
    const nouveauxEleves = [];

    for (const [promo, liste] of groupes) {
      const anneeFin = parseInt(promo.split('-')[1], 10);
      liste.sort((a, b) =>
        a.nom.localeCompare(b.nom, 'fr') || a.prenom.localeCompare(b.prenom, 'fr')
      );
      liste.forEach((e, i) => {
        const newId = anneeFin * 100 + (i + 1);
        remap[e.id] = newId;
        nouveauxEleves.push({ ...e, id: newId, numero_candidat: String(newId) });
      });
    }

    // Promotions non standard : id inchangé.
    for (const e of autres) {
      remap[e.id] = e.id;
      nouveauxEleves.push(e);
    }

    // Migration des évaluations (clés + champ id interne).
    // Les évaluations dont l'élève a disparu (supprimé/dédupliqué) sont écartées.
    const evalMigrees = {};
    for (const [oldKey, val] of Object.entries(evaluations || {})) {
      if (remap[oldKey] === undefined) continue;
      const newId = remap[oldKey];
      evalMigrees[newId] = { ...val, id: newId };
    }

    return { eleves: nouveauxEleves, evaluations: evalMigrees, remap };
  }

  /**
   * Modifie un élève existant
   */
  async updateEleve(eleveId, eleveData) {
    try {
      const eleves = await this.getEleves();
      const index = eleves.findIndex(e => e.id === parseInt(eleveId));

      if (index === -1) {
        throw new Error('Élève non trouvé');
      }

      eleves[index] = {
        id: parseInt(eleveId),
        ...eleveData
      };

      // Le nom/la promotion peuvent changer -> on renumérote et on migre les évaluations.
      const evaluations = await this.getEvaluations();
      const renum = this.renumeroterTout(eleves, evaluations);
      await this.sauvegarderElevesEtEvaluations(renum.eleves, renum.evaluations);

      return { success: true, message: 'Élève modifié avec succès' };
    } catch (error) {
      console.error('Erreur lors de la modification de l\'élève:', error);
      throw error;
    }
  }

  /**
   * Supprime un élève
   */
  async deleteEleve(eleveId) {
    return this.deleteEleves([eleveId]);
  }

  /**
   * Supprime plusieurs élèves (et leurs évaluations), puis renumérote.
   * @param {Array<number|string>} ids
   */
  async deleteEleves(ids) {
    try {
      const idSet = new Set(ids.map(id => parseInt(id)));
      const eleves = await this.getEleves();
      const filteredEleves = eleves.filter(e => !idSet.has(e.id));

      const nbSupprimes = eleves.length - filteredEleves.length;
      if (nbSupprimes === 0) {
        throw new Error('Aucun élève correspondant trouvé');
      }

      // Retirer les évaluations des élèves supprimés.
      const evaluations = await this.getEvaluations();
      for (const id of idSet) {
        delete evaluations[id];
      }

      const renum = this.renumeroterTout(filteredEleves, evaluations);
      await this.sauvegarderElevesEtEvaluations(renum.eleves, renum.evaluations);

      return {
        success: true,
        message: `${nbSupprimes} élève(s) supprimé(s) avec succès`,
        supprimes: nbSupprimes
      };
    } catch (error) {
      console.error('Erreur lors de la suppression des élèves:', error);
      throw error;
    }
  }

  /**
   * Calcule les notes pour un élève
   */
  async calculerNotes(eleveId) {
    try {
      const evalEleve = await this.getEvaluationEleve(eleveId);
      const notes = {
        semestres: {},
        moyenne_generale: null
      };

      if (!evalEleve.evaluations) {
        return notes;
      }

      let totalNotes = 0;
      let nbSemestres = 0;

      // Pour chaque semestre
      for (const [semestreId, semestreData] of Object.entries(evalEleve.evaluations)) {
        if (!semestreData.competences) continue;

        const noteSemestre = this.calculerNoteSemestre(semestreData);
        notes.semestres[semestreId] = noteSemestre;

        if (noteSemestre.note !== null) {
          totalNotes += noteSemestre.note;
          nbSemestres++;
        }
      }

      // Calculer la moyenne générale
      if (nbSemestres > 0) {
        notes.moyenne_generale = totalNotes / nbSemestres;
      }

      return notes;
    } catch (error) {
      console.error('Erreur lors du calcul des notes:', error);
      throw new Error('Impossible de calculer les notes');
    }
  }

  /**
   * Calcule la note d'un semestre
   */
  calculerNoteSemestre(semestreData) {
    const result = {
      competences: {},
      total: 0,
      note: null
    };

    // Vérifier que les données existent
    if (!semestreData || !semestreData.competences) {
      return result;
    }

    let totalPondere = 0;
    let hasAnyEvaluation = false;

    // Pour chaque compétence
    for (const [compCode, compData] of Object.entries(semestreData.competences)) {
      const competence = mapping.competences[compCode];
      if (!competence || !compData.criteres) continue;

      let totalCriteres = 0;
      let totalCoefficients = 0;

      // Pour chaque critère
      for (const [critereId, critereData] of Object.entries(compData.criteres)) {
        const critere = competence.criteres.find(c => c.id === critereId);
        if (!critere || critereData.niveau === null || critereData.niveau === undefined) continue;

        hasAnyEvaluation = true;
        // Niveau : 0, 1, 2, 3 → on calcule sur 3
        const noteNiveau = parseInt(critereData.niveau);
        totalCriteres += noteNiveau * critere.coefficient;
        totalCoefficients += critere.coefficient;
      }

      // Note de la compétence sur 3 (max des niveaux)
      const noteCompetence = totalCoefficients > 0 ? totalCriteres / totalCoefficients : 0;

      // Ne stocker la compétence que si elle a été évaluée
      if (totalCoefficients > 0) {
        result.competences[compCode] = {
          note: noteCompetence,
          coefficient: competence.coefficient
        };

        // Ajouter au total pondéré
        totalPondere += noteCompetence * competence.coefficient;
      }
    }

    // La somme des coefficients = 1.0 (0.2 + 0.2 + 0.3 + 0.3)
    result.total = totalPondere;

    // Convertir sur 20 : (total / 3) * 20
    // Ne calculer une note que s'il y a au moins une évaluation
    if (hasAnyEvaluation) {
      result.note = (result.total / 3) * 20;
    }

    return result;
  }
}

module.exports = new DataService();

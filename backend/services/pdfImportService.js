/**
 * Service d'import d'élèves depuis un PDF "Liste des élèves par classe"
 * (export Index Education / Pronote).
 *
 * Le PDF est converti en texte avec `pdftotext -layout` (poppler), puis chaque
 * ligne de la colonne "Élève" est parsée au format `NOM(S) Prénom(s)`.
 *
 * Utilisé à la fois par la route POST /api/eleves/import-pdf et par le script
 * CLI tools/import-eleves-pdf.js.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const DATE_RE = /\b\d{2}\/\d{2}\/\d{4}\b/;
// Lignes parasites à ignorer (en-têtes, pied de page, titres).
const NOISE_RE = /(Liste des élèves|BTSCIEL|^LYCEE|Index Education|Né\(e\)|^\s*Élève\b)/i;
// Un fragment de nom : lettres (avec accents), espaces, traits d'union, apostrophes.
const NAME_FRAG_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;

/**
 * Convertit un PDF en texte conservant la mise en page des colonnes.
 */
function pdfToText(pdfPath) {
  try {
    return execFileSync('pdftotext', ['-layout', pdfPath, '-'], {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(
        "pdftotext introuvable. Installez poppler (brew install poppler / apt-get install poppler-utils)."
      );
    }
    throw err;
  }
}

/**
 * Extrait les noms bruts (un par élève) du texte mis en page.
 */
function parseRawNames(text) {
  const lines = text.split(/\r?\n/);
  const rawNames = [];
  for (const line of lines) {
    if (!line.trim() || NOISE_RE.test(line)) continue;

    const startsAtCol0 = /^\S/.test(line);
    const hasDate = DATE_RE.test(line);

    if (startsAtCol0 && hasDate) {
      // Nouvelle ligne élève : le nom précède la date de naissance.
      const name = line.slice(0, line.search(DATE_RE)).trim();
      if (name) rawNames.push(name);
    } else if (startsAtCol0 && !hasDate && rawNames.length) {
      // Débordement du nom sur une 2e ligne : ne garder que la 1re colonne
      // (un éventuel fragment d'e-mail est séparé par 2+ espaces, à droite).
      const frag = line.trim().split(/\s{2,}/)[0].trim();
      if (NAME_FRAG_RE.test(frag)) rawNames[rawNames.length - 1] += ' ' + frag;
    }
    // Les fragments d'e-mail sont indentés (ne commencent pas col 0) -> ignorés.
  }
  return rawNames;
}

/**
 * "EL OUARRAD Yahya" -> { nom: "EL OUARRAD", prenom: "Yahya" }
 * Les jetons de tête entièrement en MAJUSCULES forment le nom.
 */
function splitNomPrenom(raw) {
  const tokens = raw.split(/\s+/).filter(Boolean);
  const nom = [];
  let i = 0;
  while (i < tokens.length && tokens[i] === tokens[i].toUpperCase() && /[A-ZÀ-Ö]/.test(tokens[i])) {
    nom.push(tokens[i]);
    i++;
  }
  const prenom = tokens.slice(i);
  // Garde-fou : si tout était en majuscules, le dernier jeton devient le prénom.
  if (prenom.length === 0 && nom.length > 1) prenom.push(nom.pop());
  return { nom: nom.join(' '), prenom: prenom.join(' ') };
}

/**
 * Extrait la liste {nom, prenom} d'un fichier PDF sur disque.
 */
function extractNamesFromPdf(pdfPath) {
  const names = parseRawNames(pdfToText(pdfPath)).map(splitNomPrenom);
  return names.filter((e) => e.nom && e.prenom);
}

/**
 * Extrait la liste {nom, prenom} d'un PDF fourni sous forme de Buffer
 * (cas de l'upload web). Passe par un fichier temporaire nettoyé ensuite.
 */
function extractNamesFromBuffer(buffer) {
  const tmpPath = path.join(os.tmpdir(), `import-eleves-${Date.now()}.pdf`);
  fs.writeFileSync(tmpPath, buffer);
  try {
    return extractNamesFromPdf(tmpPath);
  } finally {
    fs.unlinkSync(tmpPath);
  }
}

/**
 * Construit les enregistrements élèves à partir des noms parsés.
 *
 * @param {Array<{nom,prenom}>} parsedNames
 * @param {Array} existants  élèves déjà présents (pour ids, séquence, doublons)
 * @param {Object} opts { promotion, academie, etablissement }
 * @returns {{ajoutes: Array, ignores: Array<string>}}
 */
function buildEleveRecords(parsedNames, existants, opts) {
  if (!opts.promotion || !/^\d{4}-\d{4}$/.test(opts.promotion)) {
    throw new Error('Promotion invalide. Format attendu : AAAA-AAAA (ex: 2024-2026).');
  }
  const [anneeDebut, anneeFin] = opts.promotion.split('-');
  const session = `SESSION ${anneeFin}`;
  const academie = opts.academie || 'Académie de Versailles';
  const etablissement = opts.etablissement || 'Lycée Isaac Newton';

  const cle = (e) => `${e.nom}|${e.prenom}`.toLowerCase();
  const dejaPresents = new Set(existants.map(cle));

  let nextId = existants.reduce((m, e) => Math.max(m, e.id || 0), 0) + 1;
  // Séquence basée sur le nombre d'élèves déjà rattachés à cette promotion.
  let nextSeq = existants.filter((e) => e.promotion === opts.promotion).length + 1;

  const ajoutes = [];
  const ignores = [];
  for (const { nom, prenom } of parsedNames) {
    if (dejaPresents.has(cle({ nom, prenom }))) {
      ignores.push(`${nom} ${prenom}`);
      continue;
    }
    dejaPresents.add(cle({ nom, prenom }));
    ajoutes.push({
      id: nextId++,
      nom,
      prenom,
      promotion: opts.promotion,
      numero_candidat: `${anneeDebut}${String(nextSeq++).padStart(3, '0')}`,
      academie,
      etablissement,
      session,
    });
  }
  return { ajoutes, ignores };
}

module.exports = {
  pdfToText,
  parseRawNames,
  splitNomPrenom,
  extractNamesFromPdf,
  extractNamesFromBuffer,
  buildEleveRecords,
};

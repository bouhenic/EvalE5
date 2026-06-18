#!/usr/bin/env node
/**
 * Import d'élèves depuis un PDF "Liste des élèves par classe" (Index Education).
 *
 * Toute la logique de parsing vit dans backend/services/pdfImportService.js
 * (partagée avec la route web POST /api/eleves/import-pdf).
 *
 * Usage :
 *   node tools/import-eleves-pdf.js <fichier.pdf> --promotion 2024-2026 [options]
 *
 * Options :
 *   --promotion <AAAA-AAAA>   Promotion (obligatoire). Ex: 2024-2026
 *   --academie <texte>        Défaut: "Académie de Versailles"
 *   --etablissement <texte>   Défaut: "Lycée Isaac Newton"
 *   --replace                 Remplace toute la liste au lieu de fusionner
 *   --dry-run                 Affiche le résultat sans écrire eleves.json
 */

const fs = require('fs');
const path = require('path');
const pdfImport = require('../backend/services/pdfImportService');
const dataService = require('../backend/services/dataService');

const ELEVES_PATH = path.join(__dirname, '../backend/data/eleves.json');
const EVAL_PATH = path.join(__dirname, '../backend/data/evaluations.json');

function lireJson(p, defaut) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return defaut;
  }
}

function parseArgs(argv) {
  const opts = {
    pdf: null,
    promotion: null,
    academie: 'Académie de Versailles',
    etablissement: 'Lycée Isaac Newton',
    replace: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--promotion') opts.promotion = argv[++i];
    else if (a === '--academie') opts.academie = argv[++i];
    else if (a === '--etablissement') opts.etablissement = argv[++i];
    else if (a === '--replace') opts.replace = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (!a.startsWith('--') && !opts.pdf) opts.pdf = a;
    else throw new Error(`Argument inattendu : ${a}`);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.pdf) throw new Error('Chemin du PDF manquant.');
  if (!fs.existsSync(opts.pdf)) throw new Error(`PDF introuvable : ${opts.pdf}`);

  const parsed = pdfImport.extractNamesFromPdf(opts.pdf);
  const existants = opts.replace ? [] : lireJson(ELEVES_PATH, []);
  const evaluations = opts.replace ? {} : lireJson(EVAL_PATH, {});
  const { ajoutes, ignores } = pdfImport.buildEleveRecords(parsed, existants, opts);

  // Renumérotation par promotion (id = annéeFin×100 + rang) + migration des évaluations.
  const renum = dataService.renumeroterTout([...existants, ...ajoutes], evaluations);
  const cle = (e) => `${e.nom}|${e.prenom}`.toLowerCase();
  const ajouteSet = new Set(ajoutes.map(cle));
  const ajoutesFinal = renum.eleves
    .filter((e) => ajouteSet.has(cle(e)))
    .sort((a, b) => a.id - b.id);

  console.log(`\n📄 ${parsed.length} élève(s) lus dans le PDF`);
  console.log(`➕ ${ajoutesFinal.length} ajouté(s) :`);
  ajoutesFinal.forEach((e) => console.log(`   ${e.numero_candidat}  ${e.nom} ${e.prenom}`));
  if (ignores.length) {
    console.log(`⏭️  ${ignores.length} déjà présent(s), ignoré(s) : ${ignores.join(', ')}`);
  }

  if (opts.dryRun) {
    console.log('\n🔍 Mode --dry-run : aucun fichier écrit.');
    return;
  }

  fs.writeFileSync(ELEVES_PATH, JSON.stringify(renum.eleves, null, 2) + '\n');
  fs.writeFileSync(EVAL_PATH, JSON.stringify(renum.evaluations, null, 2) + '\n');
  console.log(`\n✅ ${path.relative(process.cwd(), ELEVES_PATH)} mis à jour (${renum.eleves.length} élèves au total).`);
}

try {
  main();
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}

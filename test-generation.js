const XlsxPopulate = require('xlsx-populate');
const path = require('path');
const excelService = require('./backend/services/excelService');
const dataService = require('./backend/services/dataService');

async function testerGeneration() {
  try {
    console.log('🔄 Test de génération d\'un fichier Excel...\n');

    // Récupérer un élève
    const eleve = await dataService.getEleveById(4); // Bernardino Marie

    if (!eleve) {
      console.error('❌ Élève non trouvé');
      return;
    }

    console.log('👤 Élève sélectionné:', eleve.nom, eleve.prenom);
    console.log('📝 Données de l\'élève:');
    console.log('  - Nom:', eleve.nom);
    console.log('  - Prénom:', eleve.prenom);
    console.log('  - Académie:', eleve.academie);
    console.log('  - Établissement:', eleve.etablissement);
    console.log('  - N° Candidat:', eleve.numero_candidat);
    console.log('  - Session:', eleve.session);
    console.log('');

    // Générer le fichier
    const fileName = await excelService.genererFichierEleve(eleve);
    console.log('✅ Fichier généré:', fileName);
    console.log('');

    // Vérifier le contenu
    const filePath = path.join(__dirname, 'backend/export', fileName);
    const workbook = await XlsxPopulate.fromFileAsync(filePath);

    // Tester la première feuille (Semestre 1)
    const sheet1 = workbook.sheet('E5-FICHE SEMESTRE1 E5-IR');

    console.log('📋 Valeurs dans Semestre 1:');
    console.log('  Académie (E7):', sheet1.cell('E7').value());
    console.log('  Établissement (E8):', sheet1.cell('E8').value());
    console.log('  Nom (E9):', sheet1.cell('E9').value());
    console.log('  Prénom (E10):', sheet1.cell('E10').value());
    console.log('  N° Candidat (E11):', sheet1.cell('E11').value());
    console.log('  Session (A5):', sheet1.cell('A5').value());
    console.log('');

    // Tester la feuille récapitulative
    const sheetRecap = workbook.sheet('E5-FICHE RECAPITULATIVE E5-IR');

    console.log('📋 Valeurs dans Récapitulatif:');
    console.log('  Académie (E7):', sheetRecap.cell('E7').value());
    console.log('  Établissement (E8):', sheetRecap.cell('E8').value());
    console.log('  Nom (E9):', sheetRecap.cell('E9').value());
    console.log('  Prénom (E10):', sheetRecap.cell('E10').value());
    console.log('  N° Candidat (E11):', sheetRecap.cell('E11').value());
    console.log('  Session (A5):', sheetRecap.cell('A5').value());
    console.log('');

    // Tester la feuille jury
    const sheetJury = workbook.sheet('FICHE RENDU JURY E5 - ER');

    console.log('📋 Valeurs dans Fiche Jury:');
    console.log('  Académie (C20):', sheetJury.cell('C20').value());
    console.log('  Établissement (C21):', sheetJury.cell('C21').value());
    console.log('  Nom (C22):', sheetJury.cell('C22').value());
    console.log('  Prénom (C23):', sheetJury.cell('C23').value());
    console.log('  N° Candidat (C24):', sheetJury.cell('C24').value());
    console.log('  Session (B18):', sheetJury.cell('B18').value());

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  }
}

testerGeneration();

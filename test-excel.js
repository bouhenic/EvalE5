const XlsxPopulate = require('xlsx-populate');
const path = require('path');

async function testerLectureExcel() {
  try {
    const filePath = path.join(__dirname, 'backend/export/Bernard_Sophie_E5_Evaluation.xlsx');
    console.log('📂 Lecture du fichier:', filePath);

    const workbook = await XlsxPopulate.fromFileAsync(filePath);

    // Tester la première feuille (Semestre 1)
    const sheet1 = workbook.sheet('E5-FICHE SEMESTRE1 E5-IR');

    console.log('\n📋 Valeurs dans Semestre 1:');
    console.log('  Académie (D7):', sheet1.cell('D7').value());
    console.log('  Établissement (D8):', sheet1.cell('D8').value());
    console.log('  Nom (D9):', sheet1.cell('D9').value());
    console.log('  Prénom (D10):', sheet1.cell('D10').value());
    console.log('  N° Candidat (D11):', sheet1.cell('D11').value());
    console.log('  Session (A5):', sheet1.cell('A5').value());

    // Tester la feuille récapitulative
    const sheetRecap = workbook.sheet('E5-FICHE RECAPITULATIVE E5-IR');

    console.log('\n📋 Valeurs dans Récapitulatif:');
    console.log('  Académie (D7):', sheetRecap.cell('D7').value());
    console.log('  Établissement (D8):', sheetRecap.cell('D8').value());
    console.log('  Nom (D9):', sheetRecap.cell('D9').value());
    console.log('  Prénom (D10):', sheetRecap.cell('D10').value());
    console.log('  N° Candidat (D11):', sheetRecap.cell('D11').value());
    console.log('  Session (A5):', sheetRecap.cell('A5').value());

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testerLectureExcel();

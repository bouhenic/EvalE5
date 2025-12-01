const XlsxPopulate = require('xlsx-populate');
const path = require('path');

async function testerLectureExcel() {
  try {
    const filePath = path.join(__dirname, 'backend/export/2025-2027/ABAID_Soulaimane_E5_Evaluation.xlsx');

    console.log('📖 Tentative de lecture du fichier:', filePath);

    const workbook = await XlsxPopulate.fromFileAsync(filePath);

    console.log('✅ Fichier ouvert avec succès!');
    console.log('📋 Feuilles disponibles:', workbook.sheets().map(s => s.name()));

    // Essayer de lire quelques cellules de la première feuille (Semestre 1)
    const sheet = workbook.sheet('E5-FICHE SEMESTRE1 E5-IR');

    console.log('\n📝 Lecture de quelques cellules d\'identité:');
    console.log('- Nom (E9):', sheet.cell('E9').value());
    console.log('- Prénom (E10):', sheet.cell('E10').value());
    console.log('- N° Candidat (E11):', sheet.cell('E11').value());

    console.log('\n📊 Lecture de quelques évaluations (ligne 15 = C02_C1):');
    console.log('- Niveau 1 (C15):', sheet.cell('C15').value());
    console.log('- Niveau 2 (D15):', sheet.cell('D15').value());
    console.log('- Niveau 3 (E15):', sheet.cell('E15').value());
    console.log('- Niveau 4 (F15):', sheet.cell('F15').value());

    console.log('\n✅ Test de lecture réussi!');

  } catch (error) {
    console.error('❌ Erreur lors de la lecture:', error.message);
  }
}

testerLectureExcel();

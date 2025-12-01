const XlsxPopulate = require('xlsx-populate');
const path = require('path');

async function verifierSession() {
  try {
    const modelePath = path.join(__dirname, 'modeles/modele_officiel.xlsx');
    const workbook = await XlsxPopulate.fromFileAsync(modelePath);

    const feuilles = [
      'E5-FICHE SEMESTRE1 E5-IR',
      'FICHE RENDU JURY E5 - ER'
    ];

    for (const nomFeuille of feuilles) {
      console.log(`\n📋 Feuille: ${nomFeuille}`);
      const sheet = workbook.sheet(nomFeuille);

      if (nomFeuille === 'FICHE RENDU JURY E5 - ER') {
        console.log('  Ligne 18 (Session):');
        console.log('    A18:', typeof sheet.cell('A18').value());
        console.log('    B18:', typeof sheet.cell('B18').value(), '- RichText avec "SESSION"');
        console.log('    C18:', sheet.cell('C18').value());
        console.log('    D18:', sheet.cell('D18').value());
      } else {
        console.log('  Ligne 5 (Session):');
        console.log('    A5:', typeof sheet.cell('A5').value(), '- RichText avec "SESSION"');
        console.log('    B5:', sheet.cell('B5').value());
        console.log('    C5:', sheet.cell('C5').value());
        console.log('    D5:', sheet.cell('D5').value());
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

verifierSession();

const XlsxPopulate = require('xlsx-populate');
const path = require('path');

async function verifierToutesFeuilles() {
  try {
    const modelePath = path.join(__dirname, 'modeles/modele_officiel.xlsx');
    console.log('📂 Lecture du modèle:', modelePath);

    const workbook = await XlsxPopulate.fromFileAsync(modelePath);

    const feuilles = [
      'E5-FICHE SEMESTRE1 E5-IR',
      'E5-FICHE SEMESTRE2 E5-IR',
      'E5-FICHE RECAPITULATIVE E5-IR',
      'FICHE RENDU JURY E5 - ER'
    ];

    for (const nomFeuille of feuilles) {
      console.log(`\n\n📋 Feuille: ${nomFeuille}`);
      const sheet = workbook.sheet(nomFeuille);

      if (nomFeuille === 'FICHE RENDU JURY E5 - ER') {
        // Feuille jury - structure différente
        console.log('\nLignes 18-24:');
        for (let row = 18; row <= 24; row++) {
          console.log(`Ligne ${row}:`);
          console.log(`  B${row}:`, sheet.cell(`B${row}`).value());
          console.log(`  C${row}:`, sheet.cell(`C${row}`).value());
          console.log(`  D${row}:`, sheet.cell(`D${row}`).value());
        }
      } else {
        // Feuilles semestres et récapitulative
        console.log('\nLignes 5-11:');
        for (let row = 5; row <= 11; row++) {
          const cellC = sheet.cell(`C${row}`).value();
          const cellD = sheet.cell(`D${row}`).value();
          const cellE = sheet.cell(`E${row}`).value();

          if (cellC) {
            console.log(`${row}: C="${cellC}" | D="${cellD}" | E="${cellE}"`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

verifierToutesFeuilles();

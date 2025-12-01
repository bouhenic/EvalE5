const XlsxPopulate = require('xlsx-populate');
const path = require('path');

async function verifierModele() {
  try {
    const modelePath = path.join(__dirname, 'modeles/modele_officiel.xlsx');
    console.log('📂 Lecture du modèle:', modelePath);

    const workbook = await XlsxPopulate.fromFileAsync(modelePath);
    const sheet = workbook.sheet('E5-FICHE SEMESTRE1 E5-IR');

    console.log('\n📋 Analyse des cellules dans Semestre 1:');

    // Vérifier les lignes 7-11 dans les colonnes D, E, F
    for (let row = 7; row <= 11; row++) {
      console.log(`\nLigne ${row}:`);
      console.log(`  A${row}:`, sheet.cell(`A${row}`).value());
      console.log(`  B${row}:`, sheet.cell(`B${row}`).value());
      console.log(`  C${row}:`, sheet.cell(`C${row}`).value());
      console.log(`  D${row}:`, sheet.cell(`D${row}`).value());
      console.log(`  E${row}:`, sheet.cell(`E${row}`).value());
      console.log(`  F${row}:`, sheet.cell(`F${row}`).value());
    }

    console.log('\n\n📋 Cellules fusionnées dans la zone D7:F11:');
    // Vérifier si les cellules sont fusionnées
    for (let row = 7; row <= 11; row++) {
      for (let col of ['D', 'E', 'F']) {
        const cell = sheet.cell(`${col}${row}`);
        try {
          // xlsx-populate ne donne pas directement l'info de fusion,
          // mais on peut voir le contenu
          const value = cell.value();
          if (value !== undefined && value !== null && value !== '') {
            console.log(`${col}${row}: "${value}"`);
          }
        } catch (err) {
          // Ignorer
        }
      }
    }

    console.log('\n\n📋 Vérification de la ligne 5 (Session):');
    console.log(`  A5:`, sheet.cell('A5').value());
    console.log(`  B5:`, sheet.cell('B5').value());

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  }
}

verifierModele();

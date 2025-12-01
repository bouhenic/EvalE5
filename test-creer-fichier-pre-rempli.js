const XlsxPopulate = require('xlsx-populate');
const path = require('path');
const fs = require('fs').promises;

async function creerFichierPreRempli() {
  try {
    // Copier le modèle
    const modelePath = path.join(__dirname, 'modeles/modele_officiel.xlsx');
    const outputPath = path.join(__dirname, 'backend/export/2024-2026/DUPONT_Marie_E5_Evaluation.xlsx');

    // Créer le dossier si nécessaire
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    console.log('📋 Chargement du modèle...');
    const workbook = await XlsxPopulate.fromFileAsync(modelePath);

    // Remplir les informations d'identité
    const sheets = [
      'E5-FICHE SEMESTRE1 E5-IR',
      'E5-FICHE SEMESTRE2 E5-IR',
      'E5-FICHE SEMESTRE3 E5-IR',
      'E5-FICHE SEMESTRE4 E5-IR'
    ];

    console.log('✍️  Remplissage des informations d\'identité...');
    for (const sheetName of sheets) {
      const sheet = workbook.sheet(sheetName);
      sheet.cell('E7').value('Académie de Versailles');
      sheet.cell('E8').value('Lycée Isaac Newton');
      sheet.cell('E9').value('DUPONT');
      sheet.cell('E10').value('Marie');
      sheet.cell('E11').value('2024999');
      sheet.cell('E12').value('SESSION 2026');
    }

    // Remplir quelques évaluations dans Semestre 1
    console.log('📊 Ajout de quelques évaluations au Semestre 1...');
    const s1 = workbook.sheet('E5-FICHE SEMESTRE1 E5-IR');

    // C02_C1 (ligne 15) - Niveau 3
    s1.cell('E15').value('x');

    // C02_C2 (ligne 16) - Niveau 2
    s1.cell('D16').value('x');

    // C06_C1 (ligne 18) - Niveau 4
    s1.cell('F18').value('x');

    // Ajouter un commentaire
    s1.cell('C43').value('Très bon travail. L\'élève maîtrise bien les compétences évaluées.');

    console.log('💾 Sauvegarde du fichier...');
    await workbook.toFileAsync(outputPath);

    console.log('✅ Fichier créé avec succès:', outputPath);
    console.log('\n📝 Informations:');
    console.log('   - Nom: DUPONT');
    console.log('   - Prénom: Marie');
    console.log('   - Promotion: 2024-2026');
    console.log('   - N° Candidat: 2024999');
    console.log('   - Semestre 1: 3 évaluations pré-remplies');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

creerFichierPreRempli();

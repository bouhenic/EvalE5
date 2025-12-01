const excelService = require('./backend/services/excelService');
const dataService = require('./backend/services/dataService');

async function testerGenerationDirecte() {
  try {
    console.log('🔄 Test de génération directe...\n');

    // Récupérer tous les élèves
    const eleves = await dataService.getEleves();
    console.log('👥 Élèves disponibles:', eleves.length);

    // Prendre le premier élève
    const eleve = eleves[0];
    console.log('👤 Test avec:', eleve.nom, eleve.prenom);
    console.log('📝 Données:', JSON.stringify(eleve, null, 2));
    console.log('');

    // Générer le fichier
    console.log('⏳ Génération en cours...');
    const fileName = await excelService.genererFichierEleve(eleve);

    console.log('✅ Succès !');
    console.log('📄 Fichier généré:', fileName);

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    console.error('Stack:', error.stack);
  }
}

testerGenerationDirecte();

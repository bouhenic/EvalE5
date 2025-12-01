// Configuration API
const API_BASE = 'http://localhost:3000/api';

// Variables globales
let eleveId = null;
let eleveData = null;
let mapping = null;
let semestreActuel = null;
let evaluationData = null;

// Chargement initial
document.addEventListener('DOMContentLoaded', () => {
  // Récupérer l'ID de l'élève depuis l'URL
  const pathParts = window.location.pathname.split('/');
  eleveId = pathParts[pathParts.length - 1];

  if (!eleveId || isNaN(eleveId)) {
    afficherErreur('ID élève invalide');
    return;
  }

  initialiser();
});

/**
 * Initialise la page
 */
async function initialiser() {
  try {
    // Charger les données de l'élève
    await chargerEleve();

    // Charger la configuration du mapping
    await chargerMapping();

    // Afficher le conteneur
    document.getElementById('loading').style.display = 'none';
    document.getElementById('evaluation-container').style.display = 'block';

  } catch (err) {
    afficherErreur(err.message);
  }
}

/**
 * Charge les données de l'élève
 */
async function chargerEleve() {
  const response = await fetch(`${API_BASE}/eleves/${eleveId}`);
  if (!response.ok) {
    throw new Error('Impossible de charger les données de l\'élève');
  }

  eleveData = await response.json();

  // Afficher les infos de l'élève
  const promotion = eleveData.promotion || eleveData.classe;
  document.getElementById('eleve-info').textContent =
    `${eleveData.prenom} ${eleveData.nom} - ${promotion}`;
}

/**
 * Charge le mapping de configuration
 */
async function chargerMapping() {
  const response = await fetch(`${API_BASE}/config/mapping`);
  if (!response.ok) {
    throw new Error('Impossible de charger la configuration');
  }

  mapping = await response.json();
}

/**
 * Change le semestre sélectionné
 */
async function changerSemestre() {
  const selectSemestre = document.getElementById('select-semestre');
  semestreActuel = selectSemestre.value;

  if (!semestreActuel) {
    document.getElementById('form-evaluation').style.display = 'none';
    return;
  }

  // Charger l'évaluation de ce semestre
  await chargerEvaluation();

  // Afficher le formulaire
  document.getElementById('form-evaluation').style.display = 'block';

  // Mettre à jour le titre
  const semestreLabel = selectSemestre.options[selectSemestre.selectedIndex].text;
  document.getElementById('titre-semestre').textContent = semestreLabel;

  // Générer le formulaire
  genererFormulaire();
}

/**
 * Charge l'évaluation existante pour le semestre
 */
async function chargerEvaluation() {
  const response = await fetch(`${API_BASE}/eleves/${eleveId}/evaluations/${semestreActuel}`);
  if (!response.ok) {
    throw new Error('Impossible de charger l\'évaluation');
  }

  evaluationData = await response.json();

  // Afficher la date si elle existe
  const dateElem = document.getElementById('date-evaluation');
  if (evaluationData.date_evaluation) {
    const date = new Date(evaluationData.date_evaluation);
    dateElem.textContent = `Dernière modification : ${date.toLocaleString('fr-FR')}`;
  } else {
    dateElem.textContent = 'Nouvelle évaluation';
  }
}

/**
 * Génère le formulaire d'évaluation
 */
async function genererFormulaire() {
  const container = document.getElementById('competences-container');
  container.innerHTML = '';

  // Pour chaque compétence
  for (const [compCode, compData] of Object.entries(mapping.competences)) {
    const section = document.createElement('div');
    section.className = 'competence-section';

    // En-tête de la compétence
    const header = document.createElement('div');
    header.className = 'competence-header';
    header.innerHTML = `
      <h3>${compCode} : ${compData.nom}</h3>
      <span class="coefficient">Coefficient : ${compData.coefficient}</span>
    `;
    section.appendChild(header);

    // Table des critères
    const table = document.createElement('table');
    table.className = 'table-criteres';

    // En-tête du tableau
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Critère</th>
        <th>Coef.</th>
        <th class="niveau-col">Niveau 1<br><small>Non réalisé</small></th>
        <th class="niveau-col">Niveau 2<br><small>Partiel</small></th>
        <th class="niveau-col">Niveau 3<br><small>Satisfaisant</small></th>
        <th class="niveau-col">Niveau 4<br><small>Très satisfaisant</small></th>
      </tr>
    `;
    table.appendChild(thead);

    // Corps du tableau
    const tbody = document.createElement('tbody');

    for (const critere of compData.criteres) {
      const tr = document.createElement('tr');

      // Récupérer le niveau actuel
      const niveauActuel = evaluationData.competences?.[compCode]?.criteres?.[critere.id]?.niveau;

      // Ajouter une classe si le critère n'est pas évalué
      const nonEvalue = (niveauActuel === null || niveauActuel === undefined);
      const classeCritere = nonEvalue ? 'critere-non-evalue' : '';
      tr.className = classeCritere;

      // Badge pour indiquer si non évalué
      const badgeNonEvalue = nonEvalue ? '<span class="badge badge-warning-small">Non évalué</span>' : '';

      tr.innerHTML = `
        <td class="critere-nom">${critere.nom} ${badgeNonEvalue}</td>
        <td class="critere-coef">${critere.coefficient}</td>
        <td class="niveau-cell">
          <input type="radio" name="${critere.id}" value="0"
            ${niveauActuel === 0 ? 'checked' : ''}
            onchange="updateNiveau('${compCode}', '${critere.id}', 0)">
        </td>
        <td class="niveau-cell">
          <input type="radio" name="${critere.id}" value="1"
            ${niveauActuel === 1 ? 'checked' : ''}
            onchange="updateNiveau('${compCode}', '${critere.id}', 1)">
        </td>
        <td class="niveau-cell">
          <input type="radio" name="${critere.id}" value="2"
            ${niveauActuel === 2 ? 'checked' : ''}
            onchange="updateNiveau('${compCode}', '${critere.id}', 2)">
        </td>
        <td class="niveau-cell">
          <input type="radio" name="${critere.id}" value="3"
            ${niveauActuel === 3 ? 'checked' : ''}
            onchange="updateNiveau('${compCode}', '${critere.id}', 3)">
        </td>
      `;

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    section.appendChild(table);
    container.appendChild(section);
  }

  // Remplir le commentaire
  document.getElementById('commentaire-global').value = evaluationData.commentaire || '';

  // Charger et afficher les notes
  await afficherNotes();
}

/**
 * Charge et affiche les notes calculées
 */
async function afficherNotes() {
  try {
    const response = await fetch(`${API_BASE}/eleves/${eleveId}/notes`);
    if (!response.ok) {
      console.warn('Impossible de charger les notes');
      // Ne pas afficher le conteneur si erreur, mais ne pas bloquer non plus
      const notesContainer = document.getElementById('notes-container');
      if (notesContainer) {
        notesContainer.style.display = 'none';
      }
      return;
    }

    const notes = await response.json();

    // Vérifier si des données existent
    if (!notes || !notes.semestres) {
      console.warn('Aucune donnée de notes disponible');
      const notesContainer = document.getElementById('notes-container');
      if (notesContainer) {
        notesContainer.style.display = 'none';
      }
      return;
    }

    // Afficher le conteneur de notes
    const notesContainer = document.getElementById('notes-container');
    if (!notesContainer) return;

    notesContainer.style.display = 'block';

    // Note du semestre actuel
    const noteSemestreElem = document.getElementById('note-semestre');
    if (noteSemestreElem) {
      if (notes.semestres[semestreActuel] && notes.semestres[semestreActuel].note !== null && notes.semestres[semestreActuel].note !== undefined) {
        const note = notes.semestres[semestreActuel].note.toFixed(2);
        noteSemestreElem.textContent = `${note} / 20`;
        noteSemestreElem.className = 'note-value ' + getNoteClass(parseFloat(note));
      } else {
        noteSemestreElem.textContent = 'Non évalué';
        noteSemestreElem.className = 'note-value';
      }
    }

    // Moyenne générale
    const noteMoyenneElem = document.getElementById('note-moyenne');
    if (noteMoyenneElem) {
      if (notes.moyenne_generale !== null && notes.moyenne_generale !== undefined) {
        const moyenne = notes.moyenne_generale.toFixed(2);
        noteMoyenneElem.textContent = `${moyenne} / 20`;
        noteMoyenneElem.className = 'note-value ' + getNoteClass(parseFloat(moyenne));
      } else {
        noteMoyenneElem.textContent = 'Aucune évaluation';
        noteMoyenneElem.className = 'note-value';
      }
    }

    // Détails des compétences du semestre actuel
    const detailElem = document.getElementById('notes-detail');
    if (detailElem) {
      if (notes.semestres[semestreActuel] && notes.semestres[semestreActuel].competences && Object.keys(notes.semestres[semestreActuel].competences).length > 0) {
        const competences = notes.semestres[semestreActuel].competences;
        let detailHTML = '<div class="competences-notes">';

        for (const [compCode, compNote] of Object.entries(competences)) {
          const compData = mapping.competences[compCode];
          if (!compData) continue;

          const noteComp = (compNote.note / 3 * 20).toFixed(2);
          detailHTML += `
            <div class="competence-note">
              <span class="comp-label">${compCode} - ${compData.nom}</span>
              <span class="comp-note ${getNoteClass(parseFloat(noteComp))}">${noteComp}/20</span>
            </div>
          `;
        }

        detailHTML += '</div>';
        detailElem.innerHTML = detailHTML;
      } else {
        detailElem.innerHTML = '<p class="no-notes">Aucune évaluation pour ce semestre</p>';
      }
    }

  } catch (err) {
    console.error('Erreur lors du chargement des notes:', err);
    // Ne pas bloquer l'affichage si erreur - cacher simplement le conteneur de notes
    const notesContainer = document.getElementById('notes-container');
    if (notesContainer) {
      notesContainer.style.display = 'none';
    }
  }
}

/**
 * Retourne une classe CSS selon la note
 */
function getNoteClass(note) {
  if (note >= 16) return 'note-excellent';
  if (note >= 14) return 'note-tres-bien';
  if (note >= 12) return 'note-bien';
  if (note >= 10) return 'note-passable';
  return 'note-insuffisant';
}

/**
 * Met à jour le niveau d'un critère
 */
function updateNiveau(compCode, critereId, niveau) {
  if (!evaluationData.competences) {
    evaluationData.competences = {};
  }

  if (!evaluationData.competences[compCode]) {
    evaluationData.competences[compCode] = { criteres: {} };
  }

  if (!evaluationData.competences[compCode].criteres) {
    evaluationData.competences[compCode].criteres = {};
  }

  evaluationData.competences[compCode].criteres[critereId] = {
    niveau: parseInt(niveau)
  };

  // Retirer l'indicateur "Non évalué" en temps réel
  const radioInputs = document.getElementsByName(critereId);
  if (radioInputs.length > 0) {
    // Trouver la ligne parente
    const row = radioInputs[0].closest('tr');
    if (row) {
      // Retirer la classe de fond jaune
      row.classList.remove('critere-non-evalue');

      // Retirer le badge "Non évalué"
      const badge = row.querySelector('.badge-warning-small');
      if (badge) {
        badge.remove();
      }
    }
  }
}

/**
 * Sauvegarde en brouillon
 */
async function sauvegarderBrouillon() {
  if (!semestreActuel) {
    alert('Veuillez sélectionner un semestre');
    return;
  }

  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳ Enregistrement...';

  try {
    // Récupérer le commentaire
    evaluationData.commentaire = document.getElementById('commentaire-global').value;

    const response = await fetch(
      `${API_BASE}/eleves/${eleveId}/evaluations/${semestreActuel}/save`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluationData)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
    }

    const result = await response.json();
    alert(`✅ ${result.message}`);

    // Recharger l'évaluation et régénérer le formulaire
    await chargerEvaluation();
    await genererFormulaire();

  } catch (err) {
    console.error('Erreur:', err);
    alert(`❌ Erreur: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

/**
 * Finalise et remplit Excel
 */
async function finaliser() {
  if (!semestreActuel) {
    alert('Veuillez sélectionner un semestre');
    return;
  }

  if (!confirm('Finaliser cette évaluation et remplir le fichier Excel ?')) {
    return;
  }

  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳ Finalisation...';

  try {
    // Récupérer le commentaire
    evaluationData.commentaire = document.getElementById('commentaire-global').value;

    const response = await fetch(
      `${API_BASE}/eleves/${eleveId}/evaluations/${semestreActuel}/finaliser`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluationData)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la finalisation');
    }

    const result = await response.json();
    alert(`✅ ${result.message}\n\nVous pouvez télécharger le fichier Excel depuis la page d'accueil.`);

    // Recharger l'évaluation et régénérer le formulaire
    await chargerEvaluation();
    await genererFormulaire();

  } catch (err) {
    console.error('Erreur:', err);
    alert(`❌ Erreur: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

/**
 * Affiche une erreur
 */
function afficherErreur(message) {
  document.getElementById('loading').style.display = 'none';
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

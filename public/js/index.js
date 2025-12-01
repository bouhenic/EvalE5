// Configuration API
const API_BASE = 'https://localhost:3443/api';

// Variables globales
let tousLesEleves = [];
let promotionSelectionnee = '';

// Chargement initial
document.addEventListener('DOMContentLoaded', () => {
  verifierAuthentification();
  chargerEleves();
});

/**
 * Vérifie si l'utilisateur est authentifié
 */
async function verifierAuthentification() {
  try {
    const response = await fetch(`${API_BASE}/auth/check`);
    const data = await response.json();

    if (data.authenticated) {
      document.getElementById('username-display').textContent = `Connecté: ${data.username}`;
    } else {
      window.location.href = '/login.html';
    }
  } catch (error) {
    console.error('Erreur de vérification:', error);
    window.location.href = '/login.html';
  }
}

/**
 * Déconnexion
 */
async function deconnexion() {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
    window.location.href = '/login.html';
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
    window.location.href = '/login.html';
  }
}

/**
 * Charge les notes d'un élève
 */
async function chargerNotesEleve(eleveId) {
  try {
    const response = await fetch(`${API_BASE}/eleves/${eleveId}/notes`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error(`Erreur lors du chargement des notes pour élève ${eleveId}:`, err);
    return null;
  }
}

/**
 * Formate la cellule de moyenne avec le statut
 */
function formaterCelluleMoyenne(notes) {
  if (!notes || !notes.semestres) {
    return '<td class="moyenne-cell moyenne-incomplete">Non évalué</td>';
  }

  // Compter combien de semestres sont évalués
  const semestresEvalues = ['semestre_1', 'semestre_2', 'semestre_3', 'semestre_4']
    .filter(sem => notes.semestres[sem] && notes.semestres[sem].note !== null && notes.semestres[sem].note !== undefined)
    .length;

  const estComplet = semestresEvalues === 4;
  const classeStatut = estComplet ? 'moyenne-complete' : 'moyenne-incomplete';

  if (notes.moyenne_generale !== null && notes.moyenne_generale !== undefined) {
    const moyenne = notes.moyenne_generale.toFixed(2);
    return `<td class="moyenne-cell ${classeStatut}" title="${semestresEvalues}/4 semestres évalués">${moyenne}/20</td>`;
  } else {
    return `<td class="moyenne-cell moyenne-incomplete" title="${semestresEvalues}/4 semestres évalués">Non évalué</td>`;
  }
}

/**
 * Charge la liste des élèves depuis l'API
 */
async function chargerEleves() {
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');
  const table = document.getElementById('table-eleves');
  const countEleves = document.getElementById('count-eleves');

  try {
    loading.style.display = 'block';
    error.style.display = 'none';
    table.style.display = 'none';

    const response = await fetch(`${API_BASE}/eleves`);
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des élèves');
    }

    tousLesEleves = await response.json();

    // Mettre à jour le sélecteur de promotions
    await mettreAJourSelecteurPromotion();

    // Afficher les élèves filtrés
    await afficherElevesFiltre();

    loading.style.display = 'none';

  } catch (err) {
    console.error('Erreur:', err);
    loading.style.display = 'none';
    error.style.display = 'block';
    error.textContent = `Erreur: ${err.message}`;
  }
}

/**
 * Met à jour le sélecteur de promotion avec les promotions disponibles
 */
async function mettreAJourSelecteurPromotion() {
  const selectPromotion = document.getElementById('filtre-promotion');

  // Extraire les promotions uniques (en utilisant classe ou promotion)
  const promotions = [...new Set(tousLesEleves.map(e => e.promotion || e.classe))].sort().reverse();

  // Vider les options actuelles sauf "Toutes les promotions"
  selectPromotion.innerHTML = '<option value="">Toutes les promotions</option>';

  // Ajouter les promotions
  promotions.forEach(promo => {
    const option = document.createElement('option');
    option.value = promo;
    option.textContent = promo;
    selectPromotion.appendChild(option);
  });

  // Sélectionner automatiquement la première promotion (la plus récente)
  if (promotions.length > 0 && !promotionSelectionnee) {
    promotionSelectionnee = promotions[0];
    selectPromotion.value = promotionSelectionnee;
  }
}

/**
 * Affiche les élèves selon le filtre de promotion
 */
async function afficherElevesFiltre() {
  const tbody = document.getElementById('tbody-eleves');
  const table = document.getElementById('table-eleves');
  const countEleves = document.getElementById('count-eleves');

  // Filtrer les élèves
  const elevesFiltres = promotionSelectionnee
    ? tousLesEleves.filter(e => (e.promotion || e.classe) === promotionSelectionnee)
    : tousLesEleves;

  // Remplir le tableau
  tbody.innerHTML = '';

  for (const eleve of elevesFiltres) {
    const tr = document.createElement('tr');

    // Charger les notes de l'élève
    const notes = await chargerNotesEleve(eleve.id);
    const celluleMoyenne = formaterCelluleMoyenne(notes);

    // Statut du fichier Excel
    const statutExcel = eleve.fichierExiste
      ? '<span class="badge badge-success">✓ Généré</span>'
      : '<span class="badge badge-warning">⚠ Non généré</span>';

    // Utiliser promotion si disponible, sinon classe
    const promotion = eleve.promotion || eleve.classe;

    tr.innerHTML = `
      <td>${eleve.id}</td>
      <td>${eleve.nom}</td>
      <td>${eleve.prenom}</td>
      <td>${promotion}</td>
      ${celluleMoyenne}
      <td>${eleve.numero_candidat}</td>
      <td>${statutExcel}</td>
      <td class="actions">
        ${!eleve.fichierExiste
          ? `<button class="btn btn-primary btn-sm" onclick="genererExcel(${eleve.id}, '${eleve.nom}', '${eleve.prenom}')">
              📄 Générer Excel
            </button>`
          : `<button class="btn btn-info btn-sm" onclick="telechargerExcel(${eleve.id})">
              💾 Télécharger
            </button>`
        }
        <button class="btn btn-success btn-sm" onclick="evaluer(${eleve.id})">
          ✏️ Évaluer
        </button>
        <button class="btn btn-danger btn-sm" onclick="supprimerEleve(${eleve.id}, '${eleve.nom}', '${eleve.prenom}')">
          🗑️ Supprimer
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  }

  // Afficher le tableau et le compteur
  table.style.display = 'table';
  countEleves.textContent = `${elevesFiltres.length} élève(s)` +
    (promotionSelectionnee ? ` (promotion ${promotionSelectionnee})` : '');
}

/**
 * Filtre les élèves par promotion
 */
async function filtrerParPromotion() {
  const selectPromotion = document.getElementById('filtre-promotion');
  promotionSelectionnee = selectPromotion.value;
  await afficherElevesFiltre();
}

/**
 * Actualise la liste des élèves
 */
function refreshEleves() {
  chargerEleves();
}

/**
 * Génère le fichier Excel pour un élève
 */
async function genererExcel(id, nom, prenom) {
  if (!confirm(`Générer le fichier Excel pour ${prenom} ${nom} ?`)) {
    return;
  }

  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⏳ Génération...';

  try {
    const response = await fetch(`${API_BASE}/eleves/${id}/generer-excel`, {
      method: 'POST'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la génération');
    }

    const result = await response.json();
    alert(`✅ ${result.message}\nFichier: ${result.fileName}`);

    // Recharger la liste
    chargerEleves();

  } catch (err) {
    console.error('Erreur:', err);
    alert(`❌ Erreur: ${err.message}`);
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

/**
 * Télécharge le fichier Excel d'un élève
 */
function telechargerExcel(id) {
  window.location.href = `${API_BASE}/eleves/${id}/telecharger`;
}

/**
 * Ouvre la page d'évaluation pour un élève
 */
function evaluer(id) {
  window.location.href = `/evaluation/${id}`;
}

/**
 * Ouvre la modal d'ajout d'élève
 */
function ouvrirModalAjout() {
  document.getElementById('modal-ajout-eleve').style.display = 'flex';
  document.getElementById('form-ajout-eleve').reset();
}

/**
 * Ferme la modal d'ajout d'élève
 */
function fermerModalAjout() {
  document.getElementById('modal-ajout-eleve').style.display = 'none';
}

/**
 * Ajoute un nouvel élève
 */
async function ajouterEleve(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const eleveData = {};

  formData.forEach((value, key) => {
    eleveData[key] = value;
  });

  try {
    const response = await fetch(`${API_BASE}/eleves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eleveData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de l\'ajout');
    }

    const result = await response.json();
    alert(`✅ ${result.message}`);

    fermerModalAjout();
    chargerEleves();

  } catch (err) {
    console.error('Erreur:', err);
    alert(`❌ Erreur: ${err.message}`);
  }
}

/**
 * Supprime un élève
 */
async function supprimerEleve(id, nom, prenom) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer ${prenom} ${nom} ?\n\nCette action est irréversible et supprimera aussi toutes les évaluations.`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/eleves/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la suppression');
    }

    const result = await response.json();
    alert(`✅ ${result.message}`);

    chargerEleves();

  } catch (err) {
    console.error('Erreur:', err);
    alert(`❌ Erreur: ${err.message}`);
  }
}

// Configuration API dynamique (adapte automatiquement HTTP ou HTTPS)
const API_BASE = `${window.location.protocol}//${window.location.host}/api`;

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
 * Met à jour le filtre de promotion dans la colonne
 */
async function mettreAJourSelecteurPromotion() {
  const filterSelect = document.getElementById('filter-promotion-select');

  // Extraire les promotions uniques (en utilisant classe ou promotion)
  const promotions = [...new Set(tousLesEleves.map(e => e.promotion || e.classe))].sort().reverse();

  // Vider les options actuelles (garder "Toutes")
  filterSelect.innerHTML = '<option value="">Toutes les promotions</option>';

  // Ajouter les promotions
  promotions.forEach(promo => {
    const count = tousLesEleves.filter(e => (e.promotion || e.classe) === promo).length;
    const option = document.createElement('option');
    option.value = promo;
    option.textContent = `${promo} (${count})`;
    filterSelect.appendChild(option);
  });

  // Sélectionner automatiquement la première promotion si aucune sélection
  if (promotions.length > 0 && !promotionSelectionnee) {
    promotionSelectionnee = promotions[0];
    filterSelect.value = promotionSelectionnee;
  }

  // Écouteur de changement attaché une seule fois (onchange remplace
  // l'éventuel précédent -> pas d'accumulation de handlers / de rendus).
  filterSelect.onchange = function() {
    promotionSelectionnee = this.value;
    afficherElevesFiltre();
  };
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

  // Marqueur de rendu : si un nouveau rendu démarre pendant nos await,
  // celui-ci s'interrompt avant d'écrire le DOM (évite tout doublon d'affichage).
  const renduCourant = (afficherElevesFiltre._gen = (afficherElevesFiltre._gen || 0) + 1);

  // Charger toutes les notes en parallèle (un seul point d'await).
  const notesParEleve = await Promise.all(
    elevesFiltres.map(eleve => chargerNotesEleve(eleve.id))
  );
  if (renduCourant !== afficherElevesFiltre._gen) return;

  // Construire toutes les lignes puis écrire le tbody en une seule fois.
  const lignes = elevesFiltres.map((eleve, i) => {
    const celluleMoyenne = formaterCelluleMoyenne(notesParEleve[i]);
    const statutExcel = eleve.fichierExiste
      ? '<span class="badge badge-success">✓ Généré</span>'
      : '<span class="badge badge-warning">⚠ Non généré</span>';
    const promotion = eleve.promotion || eleve.classe;

    return `
      <tr>
        <td class="col-select"><input type="checkbox" class="row-check" value="${eleve.id}" onchange="onSelectionChange()"></td>
        <td>${eleve.id}</td>
        <td>${eleve.nom}</td>
        <td>${eleve.prenom}</td>
        <td>${promotion}</td>
        ${celluleMoyenne}
        <td>${statutExcel}</td>
        <td class="actions">
          <div class="dropdown" id="dropdown-${eleve.id}">
            <button class="dropdown-toggle" onclick="toggleDropdown(${eleve.id})">
              ⚙️ Actions
            </button>
            <div class="dropdown-menu" id="dropdown-menu-${eleve.id}">
              ${!eleve.fichierExiste
                ? `<button class="dropdown-item" onclick="genererExcel(${eleve.id}, '${eleve.nom}', '${eleve.prenom}')">
                    📄 Générer Excel
                  </button>`
                : `<button class="dropdown-item" onclick="telechargerExcel(${eleve.id})">
                    💾 Télécharger Excel
                  </button>`
              }
              <button class="dropdown-item" onclick="evaluer(${eleve.id})">
                ✏️ Évaluer
              </button>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item danger" onclick="supprimerEleve(${eleve.id}, '${eleve.nom}', '${eleve.prenom}')">
                🗑️ Supprimer
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = lignes.join('');

  // Afficher le tableau et le compteur
  table.style.display = 'table';
  countEleves.textContent = `${elevesFiltres.length} élève(s)` +
    (promotionSelectionnee ? ` (promotion ${promotionSelectionnee})` : '');

  // Réinitialiser la sélection après reconstruction du tableau
  const checkAll = document.getElementById('check-all');
  if (checkAll) checkAll.checked = false;
  onSelectionChange();
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
 * Ouvre la modal des paramètres
 */
function ouvrirModalParametres() {
  // Fermer le dropdown
  document.getElementById('dropdown-menu-gestion').classList.remove('show');

  // Charger les paramètres actuels depuis localStorage
  const academie = localStorage.getItem('academie') || 'Académie de Versailles';
  const etablissement = localStorage.getItem('etablissement') || 'Lycée Isaac Newton';

  document.getElementById('param-academie').value = academie;
  document.getElementById('param-etablissement').value = etablissement;

  document.getElementById('modal-parametres').style.display = 'flex';
}

/**
 * Ferme la modal des paramètres
 */
function fermerModalParametres() {
  document.getElementById('modal-parametres').style.display = 'none';
}

/**
 * Sauvegarde les paramètres d'établissement
 */
function sauvegarderParametres(event) {
  event.preventDefault();

  const academie = document.getElementById('param-academie').value;
  const etablissement = document.getElementById('param-etablissement').value;

  // Sauvegarder dans localStorage
  localStorage.setItem('academie', academie);
  localStorage.setItem('etablissement', etablissement);

  alert('✅ Paramètres sauvegardés avec succès !\n\nCes informations seront utilisées lors de l\'ajout de nouveaux élèves.');

  fermerModalParametres();

  // Mettre à jour les valeurs par défaut dans le formulaire d'ajout d'élève
  document.getElementById('academie').value = academie;
  document.getElementById('etablissement').value = etablissement;
}

/**
 * Ouvre la modal d'ajout d'élève
 */
function ouvrirModalAjout() {
  document.getElementById('modal-ajout-eleve').style.display = 'flex';
  document.getElementById('form-ajout-eleve').reset();

  // Pré-remplir avec les paramètres sauvegardés
  const academie = localStorage.getItem('academie') || 'Académie de Versailles';
  const etablissement = localStorage.getItem('etablissement') || 'Lycée Isaac Newton';

  document.getElementById('academie').value = academie;
  document.getElementById('etablissement').value = etablissement;
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
 * Ouvre la modal d'import PDF
 */
function ouvrirModalImport() {
  document.getElementById('form-import-pdf').reset();

  // Pré-remplir avec les paramètres sauvegardés
  document.getElementById('import-academie').value =
    localStorage.getItem('academie') || 'Académie de Versailles';
  document.getElementById('import-etablissement').value =
    localStorage.getItem('etablissement') || 'Lycée Isaac Newton';

  document.getElementById('modal-import-pdf').style.display = 'flex';
}

/**
 * Ferme la modal d'import PDF
 */
function fermerModalImport() {
  document.getElementById('modal-import-pdf').style.display = 'none';
}

/**
 * Lit un fichier et renvoie son contenu en data-URL base64
 */
function lireFichierBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.readAsDataURL(file);
  });
}

/**
 * Importe des élèves depuis un PDF
 */
async function importerPdf(event) {
  event.preventDefault();

  const fichier = document.getElementById('import-fichier').files[0];
  if (!fichier) {
    alert('❌ Veuillez sélectionner un fichier PDF.');
    return;
  }

  const submitBtn = document.getElementById('import-submit');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Import en cours...';

  try {
    const pdfBase64 = await lireFichierBase64(fichier);

    const response = await fetch(`${API_BASE}/eleves/import-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64,
        promotion: document.getElementById('import-promotion').value.trim(),
        academie: document.getElementById('import-academie').value.trim(),
        etablissement: document.getElementById('import-etablissement').value.trim(),
        replace: document.getElementById('import-replace').checked
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de l\'import');
    }

    const result = await response.json();
    let msg = `✅ ${result.ajoutes.length} élève(s) importé(s) sur ${result.lus} lus.`;
    if (result.ignores && result.ignores.length) {
      msg += `\n\n⏭️ Déjà présents (ignorés) : ${result.ignores.join(', ')}`;
    }
    alert(msg);

    fermerModalImport();
    chargerEleves();

  } catch (err) {
    console.error('Erreur:', err);
    alert(`❌ Erreur: ${err.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Coche/décoche toutes les lignes
 */
function toggleSelectAll(source) {
  document.querySelectorAll('.row-check').forEach(cb => { cb.checked = source.checked; });
  onSelectionChange();
}

/**
 * Renvoie les ids des élèves sélectionnés
 */
function getIdsSelectionnes() {
  return Array.from(document.querySelectorAll('.row-check:checked'))
    .map(cb => parseInt(cb.value));
}

/**
 * Met à jour le bouton de suppression groupée selon la sélection
 */
function onSelectionChange() {
  const ids = getIdsSelectionnes();
  const btn = document.getElementById('btn-supprimer-selection');
  const count = document.getElementById('count-selection');
  if (count) count.textContent = ids.length;
  if (btn) btn.disabled = ids.length === 0;

  // Synchroniser l'état de la case "tout sélectionner"
  const checkAll = document.getElementById('check-all');
  const total = document.querySelectorAll('.row-check').length;
  if (checkAll) checkAll.checked = total > 0 && ids.length === total;
}

/**
 * Supprime tous les élèves sélectionnés
 */
async function supprimerSelection() {
  const ids = getIdsSelectionnes();
  if (ids.length === 0) return;

  if (!confirm(`Supprimer les ${ids.length} élève(s) sélectionné(s) ?\n\nCette action est irréversible et supprimera aussi toutes leurs évaluations.`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/eleves/supprimer-multiple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
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

/**
 * Toggle le dropdown des actions
 */
function toggleDropdown(eleveId) {
  const menu = document.getElementById(`dropdown-menu-${eleveId}`);
  const allMenus = document.querySelectorAll('.dropdown-menu');

  // Fermer tous les autres dropdowns
  allMenus.forEach(m => {
    if (m.id !== `dropdown-menu-${eleveId}`) {
      m.classList.remove('show');
    }
  });

  // Toggle le dropdown courant
  menu.classList.toggle('show');

  // Arrêter la propagation pour éviter la fermeture immédiate
  event.stopPropagation();
}

// Fermer les dropdowns quand on clique ailleurs
document.addEventListener('click', (event) => {
  if (!event.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      menu.classList.remove('show');
    });
  }
});

/**
 * Toggle le dropdown de gestion
 */
function toggleDropdownGestion(event) {
  const menu = document.getElementById('dropdown-menu-gestion');
  const allMenus = document.querySelectorAll('.dropdown-menu');

  // Fermer tous les autres dropdowns
  allMenus.forEach(m => {
    if (m.id !== 'dropdown-menu-gestion') {
      m.classList.remove('show');
    }
  });

  // Toggle le dropdown courant
  menu.classList.toggle('show');

  // Arrêter la propagation pour éviter la fermeture immédiate
  event.stopPropagation();
}

/**
 * Imprime la synthèse des élèves (format portrait)
 */
async function imprimerSynthese() {
  // Fermer le dropdown
  document.getElementById('dropdown-menu-gestion').classList.remove('show');

  // Préparer les données pour l'impression (uniquement la promotion filtrée)
  const elevesAImprimer = promotionSelectionnee
    ? tousLesEleves.filter(e => (e.promotion || e.classe) === promotionSelectionnee)
    : tousLesEleves;

  const elevesPourImpression = [];

  for (const eleve of elevesAImprimer) {
    const notes = await chargerNotesEleve(eleve.id);
    const moyenne = notes && notes.moyenne_generale !== null && notes.moyenne_generale !== undefined
      ? notes.moyenne_generale.toFixed(2)
      : 'Non évalué';

    elevesPourImpression.push({
      nom: eleve.nom,
      prenom: eleve.prenom,
      promotion: eleve.promotion || eleve.classe,
      moyenne: moyenne
    });
  }

  // Trier par nom
  elevesPourImpression.sort((a, b) => {
    if (a.nom < b.nom) return -1;
    if (a.nom > b.nom) return 1;
    return 0;
  });

  // Créer une fenêtre d'impression
  const printWindow = window.open('', '_blank');

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Synthèse des évaluations E5</title>
      <style>
        @page {
          size: portrait;
          margin: 2cm;
        }

        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
        }

        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 10px;
          font-size: 24px;
        }

        h2 {
          text-align: center;
          color: #666;
          margin-bottom: 30px;
          font-size: 16px;
          font-weight: normal;
        }

        .info {
          text-align: right;
          margin-bottom: 20px;
          font-size: 12px;
          color: #666;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border: 1px solid #5568d3;
        }

        td {
          padding: 10px 12px;
          border: 1px solid #ddd;
        }

        tr:nth-child(even) {
          background-color: #f8f9fa;
        }

        tr:hover {
          background-color: #e9ecef;
        }

        .moyenne-cell {
          text-align: center;
          font-weight: 600;
        }

        .moyenne-complete {
          color: #28a745;
        }

        .moyenne-incomplete {
          color: #ffc107;
        }

        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 10px;
          color: #999;
        }

        @media print {
          body {
            padding: 0;
          }

          tr:hover {
            background-color: transparent !important;
          }
        }
      </style>
    </head>
    <body>
      <h1>🎓 Synthèse des évaluations</h1>
      <h2>BTS CIEL - Épreuve E5${promotionSelectionnee ? ' — Promotion ' + promotionSelectionnee : ''}</h2>

      <div class="info">
        Date d'impression : ${new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>

      <table>
        <thead>
          <tr>
            <th>NOM</th>
            <th>PRÉNOM</th>
            <th>PROMOTION</th>
            <th style="text-align: center;">MOYENNE E5</th>
          </tr>
        </thead>
        <tbody>
          ${elevesPourImpression.map(eleve => `
            <tr>
              <td>${eleve.nom}</td>
              <td>${eleve.prenom}</td>
              <td>${eleve.promotion}</td>
              <td class="moyenne-cell ${eleve.moyenne !== 'Non évalué' ? 'moyenne-complete' : 'moyenne-incomplete'}">
                ${eleve.moyenne !== 'Non évalué' ? eleve.moyenne + '/20' : eleve.moyenne}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>Document généré automatiquement - ${elevesPourImpression.length} élève(s)</p>
      </div>

      <script>
        window.onload = function() {
          window.print();
          // Fermer la fenêtre après l'impression (optionnel)
          // window.onafterprint = function() { window.close(); };
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

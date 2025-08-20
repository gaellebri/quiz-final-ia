// Configuration
const RESULTS_KEY = 'quiz-final-ia-results';
const PASSING_SCORE = 25; // Score minimum pour réussir (50%)

// État de l'application admin
let allResults = [];
let filteredResults = [];
let currentFilter = '';
let currentSort = 'date';

// Les 5 parties du quiz
const PARTIES = [
    "Histoire de l'IA",
    "Concepts clés",
    "Limites, biais et pièges",
    "Enjeux éthiques et sociétaux",
    "Usages et bonnes pratiques"
];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadResults();
    updateDisplay();
    populateFilters();
});

// Charger les résultats depuis le localStorage
function loadResults() {
    const stored = localStorage.getItem(RESULTS_KEY);
    allResults = stored ? JSON.parse(stored) : [];
    filteredResults = [...allResults];
}

// Actualiser l'affichage
function refreshResults() {
    loadResults();
    applyFilters();
    updateDisplay();
    showNotification('Résultats actualisés', 'success');
}

// Mettre à jour tout l'affichage
function updateDisplay() {
    updateStatistics();
    updatePartieStatistics();
    displayResultsTable();
}

// Calculer et afficher les statistiques
function updateStatistics() {
    const stats = calculateStatistics(filteredResults);
    
    document.getElementById('stat-participants').textContent = stats.participants;
    document.getElementById('stat-average').textContent = stats.average.toFixed(1);
    document.getElementById('stat-best').textContent = stats.best;
    document.getElementById('stat-completion').textContent = `${stats.completionRate}%`;
}

// Calculer et afficher les statistiques par partie
function updatePartieStatistics() {
    const container = document.getElementById('partie-stats');
    
    if (filteredResults.length === 0) {
        container.innerHTML = '<p>Aucune donnée disponible</p>';
        return;
    }
    
    // Calculer les moyennes par partie
    const partieStats = {};
    PARTIES.forEach(partie => {
        partieStats[partie] = { total: 0, count: 0 };
    });
    
    filteredResults.forEach(result => {
        if (result.partiesResults) {
            Object.entries(result.partiesResults).forEach(([partie, data]) => {
                if (partieStats[partie]) {
                    partieStats[partie].total += data.correct;
                    partieStats[partie].count++;
                }
            });
        }
    });
    
    // Afficher les statistiques
    container.innerHTML = Object.entries(partieStats)
        .map(([partie, stats]) => {
            const moyenne = stats.count > 0 ? (stats.total / stats.count).toFixed(1) : 0;
            const percentage = stats.count > 0 ? Math.round((stats.total / stats.count) * 10) : 0;
            return `
                <div class="partie-card">
                    <h4>${partie}</h4>
                    <p>${moyenne}/10</p>
                    <small>${percentage}%</small>
                </div>
            `;
        })
        .join('');
}

// Calculer les statistiques
function calculateStatistics(results) {
    if (results.length === 0) {
        return {
            participants: 0,
            average: 0,
            best: 0,
            completionRate: 0
        };
    }

    const scores = results.map(r => r.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    const passed = scores.filter(s => s >= PASSING_SCORE).length;

    return {
        participants: results.length,
        average: sum / results.length,
        best: Math.max(...scores),
        completionRate: Math.round((passed / results.length) * 100)
    };
}

// Afficher le tableau des résultats
function displayResultsTable() {
    const container = document.getElementById('results-container');
    
    if (filteredResults.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <h3>Aucun résultat</h3>
                <p>Aucune participation enregistrée pour le moment.</p>
            </div>
        `;
        return;
    }

    // Trier les résultats
    const sorted = sortResultsArray(filteredResults);

    // Créer le tableau
    const table = `
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Groupe</th>
                    <th>Date</th>
                    <th>Score</th>
                    <th>%</th>
                    <th>Temps</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map((result, index) => createResultRow(result, index + 1)).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = table;
}

// Créer une ligne de résultat
function createResultRow(result, position) {
    const percentage = Math.round((result.score / 50) * 100);
    const scoreClass = getScoreClass(percentage);
    const date = new Date(result.date);
    
    return `
        <tr>
            <td>${position}</td>
            <td>${escapeHtml(result.student.nom)}</td>
            <td>${escapeHtml(result.student.prenom)}</td>
            <td>${escapeHtml(result.student.groupe)}</td>
            <td>${date.toLocaleDateString('fr-FR')} ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
            <td class="score-cell ${scoreClass}">${result.score}/50</td>
            <td class="score-cell ${scoreClass}">${percentage}%</td>
            <td>${formatTime(result.timeElapsed)}</td>
            <td>
                <button class="btn btn-secondary" style="padding: 5px 15px; font-size: 0.9rem;" onclick="viewDetails('${result.date}')">
                    👁️ Détails
                </button>
            </td>
        </tr>
    `;
}

// Obtenir la classe CSS selon le score
function getScoreClass(percentage) {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'average';
    return 'poor';
}

// Échapper les caractères HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Formater le temps
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Peupler les filtres
function populateFilters() {
    const groups = [...new Set(allResults.map(r => r.student.groupe))].sort();
    const select = document.getElementById('filter-group');
    
    select.innerHTML = '<option value="">Tous les groupes</option>';
    groups.forEach(group => {
        select.innerHTML += `<option value="${group}">${group}</option>`;
    });
}

// Filtrer les résultats
function filterResults() {
    const filterValue = document.getElementById('filter-group').value;
    currentFilter = filterValue;
    applyFilters();
    updateDisplay();
}

// Appliquer les filtres
function applyFilters() {
    if (currentFilter) {
        filteredResults = allResults.filter(r => r.student.groupe === currentFilter);
    } else {
        filteredResults = [...allResults];
    }
}

// Trier les résultats
function sortResults() {
    currentSort = document.getElementById('sort-by').value;
    updateDisplay();
}

// Trier le tableau de résultats
function sortResultsArray(results) {
    const sorted = [...results];
    
    switch (currentSort) {
        case 'nom':
            sorted.sort((a, b) => a.student.nom.localeCompare(b.student.nom));
            break;
        case 'score':
            sorted.sort((a, b) => b.score - a.score);
            break;
        case 'temps':
            sorted.sort((a, b) => a.timeElapsed - b.timeElapsed);
            break;
        case 'date':
        default:
            sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    return sorted;
}

// Voir les détails d'un résultat
function viewDetails(date) {
    const result = allResults.find(r => r.date === date);
    if (!result) return;

    // Créer le détail par partie
    let partieDetailsHTML = '';
    if (result.partiesResults) {
        Object.entries(result.partiesResults).forEach(([partie, data]) => {
            const partiePercentage = Math.round((data.correct / data.total) * 100);
            
            // Trouver les questions de cette partie
            const partieQuestions = result.responses.filter(r => r.partie === partie);
            
            partieDetailsHTML += `
                <div class="partie-section">
                    <h4>${partie} - ${data.correct}/${data.total} (${partiePercentage}%)</h4>
                    <div class="questions-grid">
                        ${partieQuestions.map((resp, idx) => {
                            const qNum = result.responses.indexOf(resp) + 1;
                            return `
                                <div class="question-result ${resp.isCorrect ? 'correct' : 'incorrect'}">
                                    Q${qNum}<br>
                                    ${resp.isCorrect ? '✓' : '✗'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
    }

    // Créer une modale avec les détails
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
        overflow-y: auto;
    `;

    const content = `
        <div class="card details-modal" style="max-height: 90vh; overflow-y: auto; position: relative;">
            <button onclick="this.closest('div').parentElement.remove()" 
                    style="position: absolute; top: 10px; right: 10px; 
                           background: none; border: none; font-size: 1.5rem; 
                           cursor: pointer; color: var(--text-light);">✖</button>
            
            <h2>Détails de la participation</h2>
            
            <div class="mb-3">
                <p><strong>Étudiant :</strong> ${result.student.prenom} ${result.student.nom}</p>
                <p><strong>Groupe :</strong> ${result.student.groupe}</p>
                <p><strong>Date :</strong> ${new Date(result.date).toLocaleString('fr-FR')}</p>
                <p><strong>Score global :</strong> ${result.score}/50 (${Math.round((result.score / 50) * 100)}%)</p>
                <p><strong>Temps écoulé :</strong> ${formatTime(result.timeElapsed)}</p>
            </div>

            <h3>📊 Résultats par partie</h3>
            <div class="partie-details">
                ${partieDetailsHTML}
            </div>
            
            <h3 class="mt-3">📝 Détail des 50 questions</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 8px;">
                ${result.responses.map((resp, index) => `
                    <div class="question-result ${resp.isCorrect ? 'correct' : 'incorrect'}" 
                         title="${resp.partie}">
                        Q${index + 1}<br>
                        ${resp.isCorrect ? '✓' : '✗'}
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    modal.innerHTML = content;
    document.body.appendChild(modal);
    
    // Fermer en cliquant sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Exporter les résultats en CSV
function exportResults() {
    if (filteredResults.length === 0) {
        showNotification('Aucun résultat à exporter', 'error');
        return;
    }

    const headers = ['#', 'Nom', 'Prénom', 'Groupe', 'Date', 'Heure', 'Score', 'Pourcentage', 'Temps'];
    
    // Ajouter les colonnes pour les parties
    PARTIES.forEach(partie => {
        headers.push(partie);
    });
    
    // Ajouter les colonnes pour chaque question
    for (let i = 1; i <= 50; i++) {
        headers.push(`Q${i}`);
    }

    const rows = filteredResults.map((result, index) => {
        const date = new Date(result.date);
        const row = [
            index + 1,
            result.student.nom,
            result.student.prenom,
            result.student.groupe,
            date.toLocaleDateString('fr-FR'),
            date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            result.score,
            Math.round((result.score / 50) * 100) + '%',
            formatTime(result.timeElapsed)
        ];

        // Ajouter les scores par partie
        if (result.partiesResults) {
            PARTIES.forEach(partie => {
                const partieData = result.partiesResults[partie];
                if (partieData) {
                    row.push(`${partieData.correct}/${partieData.total}`);
                } else {
                    row.push('-');
                }
            });
        } else {
            PARTIES.forEach(() => row.push('-'));
        }

        // Ajouter les réponses
        for (let i = 0; i < 50; i++) {
            const response = result.responses[i];
            if (response) {
                row.push(response.isCorrect ? '✓' : '✗');
            } else {
                row.push('-');
            }
        }

        return row;
    });

    // Créer le CSV
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
        .join('\n');

    // Ajouter le BOM pour Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Télécharger
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `resultats_quiz_final_ia_${timestamp}.csv`;
    link.click();

    showNotification('Export réussi', 'success');
}

// Confirmer l'effacement des résultats
function confirmClearResults() {
    if (confirm('⚠️ ATTENTION ⚠️\n\nÊtes-vous sûr de vouloir effacer TOUS les résultats ?\nCette action est IRRÉVERSIBLE !')) {
        if (confirm('Confirmation finale : Effacer définitivement tous les résultats ?')) {
            clearAllResults();
        }
    }
}

// Effacer tous les résultats
function clearAllResults() {
    localStorage.removeItem(RESULTS_KEY);
    allResults = [];
    filteredResults = [];
    updateDisplay();
    showNotification('Tous les résultats ont été effacés', 'success');
}

// Afficher une notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 30px;
        background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
        color: white;
        border-radius: 50px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translate(-50%, -100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);
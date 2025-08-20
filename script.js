// Configuration globale
const QUIZ_CONFIG = {
    duration: 25 * 60, // 25 minutes en secondes
    questionsCount: 50,
    storageKey: 'quiz-final-ia-session',
    resultsKey: 'quiz-final-ia-results'
};

// État global de l'application
let quizState = {
    student: null,
    questions: [],
    currentQuestionIndex: 0,
    responses: [],
    startTime: null,
    endTime: null,
    timeRemaining: QUIZ_CONFIG.duration,
    timerInterval: null,
    isCompleted: false,
    // Nouveau : pour le suivi des parties
    partiesResults: {
        "Histoire de l'IA": { correct: 0, total: 10 },
        "Concepts clés": { correct: 0, total: 10 },
        "Limites, biais et pièges": { correct: 0, total: 10 },
        "Enjeux éthiques et sociétaux": { correct: 0, total: 10 },
        "Usages et bonnes pratiques": { correct: 0, total: 10 }
    }
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    checkExistingSession();
    loadQuestions();
});

// Vérifier si une session existe déjà 
function checkExistingSession() {
    const existingSession = localStorage.getItem(QUIZ_CONFIG.storageKey);
    if (existingSession) {
        const session = JSON.parse(existingSession);
        if (session.isCompleted) {
            showAlreadyCompletedMessage();
        } else {
            // Reprendre la session en cours
            quizState = session;
            if (quizState.student) {
                startQuiz();
            }
        }
    }
}

// Afficher le message si déjà complété
function showAlreadyCompletedMessage() {
    document.body.innerHTML = `
        <div class="container">
            <div class="card text-center">
                <h2>Session déjà complétée</h2>
                <p>Vous avez déjà participé à ce quiz final.</p>
                <p>Une seule tentative est autorisée.</p>
            </div>
        </div>
    `;
}

// Charger les questions depuis le fichier JSON
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        const data = await response.json();
        // IMPORTANT : On ne mélange PAS les questions pour garder l'ordre des parties
        quizState.questions = data.questions;
    } catch (error) {
        console.error('Erreur lors du chargement des questions:', error);
        alert('Erreur lors du chargement des questions. Veuillez rafraîchir la page.');
    }
}

// Gérer la soumission du formulaire de connexion
function handleLogin(event) {
    event.preventDefault();
    
    const nom = document.getElementById('nom').value.trim();
    const prenom = document.getElementById('prenom').value.trim();
    const groupe = document.getElementById('groupe').value.trim();
    
    if (!nom || !prenom || !groupe) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    quizState.student = { nom, prenom, groupe };
    quizState.startTime = new Date().toISOString();
    
    saveState();
    startQuiz();
}

// Démarrer le quiz
function startQuiz() {
    renderQuizInterface();
    startTimer();
    showQuestion();
}

// Afficher l'interface du quiz
function renderQuizInterface() {
    document.body.innerHTML = `
        <div class="timer-container">
            <span>⏱️</span>
            <span class="timer" id="timer">${formatTime(quizState.timeRemaining)}</span>
        </div>
        
        <div class="container">
            <div class="progress-container">
                <div class="progress-info">
                    <span>Question <span id="current-question">${quizState.currentQuestionIndex + 1}</span>/50</span>
                    <span id="current-partie">Partie : ${getCurrentPartie()}</span>
                    <span>Score: <span id="current-score">0</span>/50</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill" style="width: ${(quizState.currentQuestionIndex / QUIZ_CONFIG.questionsCount) * 100}%"></div>
                </div>
            </div>
            
            <div class="card" id="question-card">
                <!-- Le contenu de la question sera inséré ici -->
            </div>
        </div>
    `;
}

// Obtenir la partie courante
function getCurrentPartie() {
    const question = quizState.questions[quizState.currentQuestionIndex];
    return question ? question.partie : '';
}

// Démarrer le timer
function startTimer() {
    quizState.timerInterval = setInterval(() => {
        quizState.timeRemaining--;
        updateTimerDisplay();
        
        if (quizState.timeRemaining <= 0) {
            clearInterval(quizState.timerInterval);
            endQuiz();
        }
        
        saveState();
    }, 1000);
}

// Mettre à jour l'affichage du timer
function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = formatTime(quizState.timeRemaining);
    
    // Ajouter des classes pour le style
    if (quizState.timeRemaining <= 60) {
        timerElement.classList.add('danger');
    } else if (quizState.timeRemaining <= 300) {
        timerElement.classList.add('warning');
    }
}

// Formater le temps en MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Afficher une question
function showQuestion() {
    const question = quizState.questions[quizState.currentQuestionIndex];
    const questionCard = document.getElementById('question-card');
    
    // Mettre à jour l'affichage de la partie
    document.getElementById('current-partie').textContent = `Partie : ${question.partie}`;
    
    // Gérer l'affichage selon le type de question
    let optionsHTML = '';
    if (question.type === 'qcm-multiple') {
        optionsHTML = `
            <p class="mb-3"><em>⚠️ Plusieurs réponses possibles</em></p>
            <div class="options" id="options-container">
                ${question.options.map((option, index) => `
                    <div class="option" data-index="${index}" onclick="selectMultipleOption(this)">
                        <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                        <span>${option}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        optionsHTML = `
            <div class="options" id="options-container">
                ${question.options.map((option, index) => `
                    <div class="option" data-index="${index}" onclick="selectOption(this)">
                        <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                        <span>${option}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    questionCard.innerHTML = `
        <div class="question-header">
            <h2>Question ${quizState.currentQuestionIndex + 1}</h2>
            <span class="difficulty ${question.difficulty}">${question.difficulty}</span>
        </div>
        
        <p class="question-text">${question.question}</p>
        
        ${optionsHTML}
        
        <div class="text-center mt-3" id="button-container">
            <button class="btn btn-primary" id="validate-btn" onclick="validateAnswer()" disabled>
                ✔ Valider ma réponse
            </button>
        </div>
        
        <div id="feedback-container"></div>
    `;
}

// Sélectionner une option (QCM simple)
function selectOption(element) {
    // Si déjà validé, ne rien faire
    if (element.classList.contains('disabled')) return;
    
    // Désélectionner toutes les options
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // Sélectionner l'option cliquée
    element.classList.add('selected');
    
    // Activer le bouton de validation
    document.getElementById('validate-btn').disabled = false;
}

// Sélectionner plusieurs options (QCM multiple)
function selectMultipleOption(element) {
    // Si déjà validé, ne rien faire
    if (element.classList.contains('disabled')) return;
    
    // Toggle la sélection
    element.classList.toggle('selected');
    
    // Activer le bouton si au moins une option est sélectionnée
    const hasSelection = document.querySelectorAll('.option.selected').length > 0;
    document.getElementById('validate-btn').disabled = !hasSelection;
}

// Valider la réponse
function validateAnswer() {
    const question = quizState.questions[quizState.currentQuestionIndex];
    let isCorrect = false;
    let selectedIndices = [];
    
    if (question.type === 'qcm-multiple') {
        // Pour les QCM multiples
        const selectedOptions = document.querySelectorAll('.option.selected');
        selectedIndices = Array.from(selectedOptions).map(opt => parseInt(opt.dataset.index));
        
        // Vérifier si les réponses correspondent exactement
        isCorrect = selectedIndices.length === question.correct.length &&
                   selectedIndices.every(index => question.correct.includes(index)) &&
                   question.correct.every(index => selectedIndices.includes(index));
    } else {
        // Pour les QCM simples et vrai/faux
        const selectedOption = document.querySelector('.option.selected');
        if (!selectedOption) return;
        
        const selectedIndex = parseInt(selectedOption.dataset.index);
        selectedIndices = [selectedIndex];
        isCorrect = selectedIndex === question.correct;
    }
    
    // Enregistrer la réponse
    quizState.responses.push({
        questionId: question.id,
        partie: question.partie,
        answered: selectedIndices,
        correct: question.correct,
        isCorrect: isCorrect
    });
    
    // Mettre à jour les résultats par partie
    if (isCorrect) {
        quizState.partiesResults[question.partie].correct++;
    }
    
    // Afficher le feedback
    showFeedback(isCorrect, question);
    
    // Désactiver les options
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.add('disabled');
        opt.onclick = null;
    });
    
    // Marquer les bonnes/mauvaises réponses
    if (question.type === 'qcm-multiple') {
        document.querySelectorAll('.option').forEach(opt => {
            const index = parseInt(opt.dataset.index);
            if (question.correct.includes(index)) {
                opt.classList.add('correct');
            } else if (selectedIndices.includes(index) && !question.correct.includes(index)) {
                opt.classList.add('incorrect');
            }
        });
    } else {
        document.querySelectorAll('.option').forEach(opt => {
            if (parseInt(opt.dataset.index) === question.correct) {
                opt.classList.add('correct');
            } else if (opt.classList.contains('selected')) {
                opt.classList.add('incorrect');
            }
        });
    }
    
    // Mettre à jour le score
    updateScore();
    
    // Sauvegarder l'état
    saveState();
    
    // Remplacer le bouton de validation
    const buttonContainer = document.getElementById('button-container');
    if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
        buttonContainer.innerHTML = `
            <button class="btn btn-secondary" onclick="nextQuestion()">
                ➡️ Question suivante
            </button>
        `;
    } else {
        buttonContainer.innerHTML = `
            <button class="btn btn-primary" onclick="endQuiz()" style="background: linear-gradient(135deg, var(--success), var(--turquoise));">
                🏁 Terminer le quiz
            </button>
        `;
    }
}

// Afficher le feedback
function showFeedback(isCorrect, question) {
    const feedbackContainer = document.getElementById('feedback-container');
    feedbackContainer.innerHTML = `
        <div class="feedback ${isCorrect ? 'correct' : 'incorrect'} fade-in">
            <h3>
                <span class="feedback-icon">${isCorrect ? '✅' : '❌'}</span>
                ${isCorrect ? 'Correct !' : 'Incorrect'}
            </h3>
            <p>${question.explanation}</p>
        </div>
    `;
}

// Mettre à jour le score
function updateScore() {
    const correctAnswers = quizState.responses.filter(r => r.isCorrect).length;
    document.getElementById('current-score').textContent = correctAnswers;
}

// Passer à la question suivante
function nextQuestion() {
    quizState.currentQuestionIndex++;
    updateProgressBar();
    showQuestion();
}

// Mettre à jour la barre de progression
function updateProgressBar() {
    const progress = ((quizState.currentQuestionIndex + 1) / QUIZ_CONFIG.questionsCount) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('current-question').textContent = quizState.currentQuestionIndex + 1;
}

// Terminer le quiz
function endQuiz() {
    clearInterval(quizState.timerInterval);
    quizState.endTime = new Date().toISOString();
    quizState.isCompleted = true;
    
    const timeElapsed = QUIZ_CONFIG.duration - quizState.timeRemaining;
    const score = quizState.responses.filter(r => r.isCorrect).length;
    
    // Sauvegarder les résultats finaux
    saveState();
    saveResults();
    
    // Afficher les résultats avec le détail par partie
    showResults(score, timeElapsed);
}

// Afficher les résultats
function showResults(score, timeElapsed) {
    const percentage = Math.round((score / QUIZ_CONFIG.questionsCount) * 100);
    const grade = getGrade(percentage);
    
    // Créer le récapitulatif par partie
    let partiesRecap = '';
    for (const [partie, results] of Object.entries(quizState.partiesResults)) {
        const partiePercentage = Math.round((results.correct / results.total) * 100);
        partiesRecap += `
            <div class="score-card">
                <h3>${partie}</h3>
                <p>${results.correct}/${results.total}</p>
                <small>${partiePercentage}%</small>
            </div>
        `;
    }
    
    document.body.innerHTML = `
        <div class="container">
            <div class="card results-container">
                <h1>Quiz Final Terminé !</h1>
                
                <div class="score-display">${score}/50</div>
                
                <div class="score-details">
                    <div class="score-card">
                        <h3>Pourcentage global</h3>
                        <p>${percentage}%</p>
                    </div>
                    <div class="score-card">
                        <h3>Temps écoulé</h3>
                        <p>${formatTime(timeElapsed)}</p>
                    </div>
                    <div class="score-card">
                        <h3>Appréciation</h3>
                        <p>${grade}</p>
                    </div>
                </div>
                
                <h2 class="mt-3">📊 Détail par partie</h2>
                <div class="score-details">
                    ${partiesRecap}
                </div>
                
                <p class="mt-3">Vos résultats ont été enregistrés.</p>
                <p>Merci pour votre participation !</p>
            </div>
        </div>
    `;
}

// Obtenir l'appréciation selon le score
function getGrade(percentage) {
    if (percentage >= 90) return 'Excellent !';
    if (percentage >= 80) return 'Très bien !';
    if (percentage >= 70) return 'Bien';
    if (percentage >= 60) return 'Satisfaisant';
    if (percentage >= 50) return 'Passable';
    return 'À améliorer';
}

// Sauvegarder l'état actuel
function saveState() {
    localStorage.setItem(QUIZ_CONFIG.storageKey, JSON.stringify(quizState));
}

// Sauvegarder les résultats pour l'admin
function saveResults() {
    const results = {
        student: quizState.student,
        date: quizState.startTime,
        endTime: quizState.endTime,
        responses: quizState.responses,
        score: quizState.responses.filter(r => r.isCorrect).length,
        timeElapsed: QUIZ_CONFIG.duration - quizState.timeRemaining,
        partiesResults: quizState.partiesResults,
        questions: quizState.questions.map(q => ({
            id: q.id,
            question: q.question,
            partie: q.partie,
            correct: q.correct
        }))
    };
    
    // Récupérer les résultats existants
    let allResults = JSON.parse(localStorage.getItem(QUIZ_CONFIG.resultsKey) || '[]');
    allResults.push(results);
    localStorage.setItem(QUIZ_CONFIG.resultsKey, JSON.stringify(allResults));
}
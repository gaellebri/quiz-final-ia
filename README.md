# Quiz Final Intelligence Artificielle

Plateforme de quiz interactif pour le TD Intelligence Artificielle - IUT de Roanne

## Description

Ce quiz final évalue les connaissances acquises lors du module IA à travers 50 questions réparties en 5 parties thématiques.

## Fonctionnalités

### Pour les étudiants
- 50 questions réparties en 5 parties thématiques
- Questions dans l'ordre des parties (pas de mélange aléatoire)
- Support des QCM à réponses multiples
- Timer de 25 minutes
- Feedback immédiat après chaque réponse
- Sauvegarde automatique de la progression
- Résultats détaillés par partie à la fin
- Une seule tentative autorisée par session

### Pour l'administration
- Interface d'administration pour consulter tous les résultats
- Statistiques globales et par partie
- Export CSV enrichi avec détail par partie
- Filtrage par groupe TD
- Tri par date, nom, score ou temps
- Vue détaillée de chaque participation

## Structure du quiz

1. **Histoire de l'IA** (10 questions)
2. **Concepts clés** (10 questions)
3. **Limites, biais et pièges** (10 questions)
4. **Enjeux éthiques et sociétaux** (10 questions)
5. **Usages et bonnes pratiques** (10 questions)

## Types de questions

- QCM classique (une seule réponse)
- Vrai/Faux
- QCM multiple (plusieurs réponses possibles)
- Études de cas

## Accès

- **Quiz** : `index.html`
- **Administration** : `results.html`

## Installation

1. Cloner le repository
2. Ouvrir `index.html` dans un navigateur moderne
3. Aucune installation supplémentaire requise

## Technologies

- HTML5, CSS3, JavaScript (Vanilla)
- LocalStorage pour la persistance des données
- Design responsive
- Compatible avec tous les navigateurs modernes

## Structure des fichiers
quiz-final-ia/
├── index.html          # Page d'accueil du quiz
├── script.js           # Logique du quiz
├── questions.json      # Base de données des 50 questions
├── results.html        # Interface d'administration
├── admin.js           # Logique de l'administration
├── style.css          # Styles
└── README.md          # Ce fichier
## Données stockées

- Informations étudiant (nom, prénom, groupe)
- Réponses détaillées
- Score global et par partie
- Temps écoulé
- Date et heure de participation

## Auteur

Gaëlle Briantais - 2025  
Cheffe de Projet IA & Automatisation  
Consultante en Transformation Digitale & Formatrice IA

## Licence

Propriété de Gaëlle Briantais - Tous droits réservés

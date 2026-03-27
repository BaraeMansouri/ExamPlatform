📝 Online Exam Platform (Laravel + React)
📌 Description
Ce projet est une plateforme d’examen en ligne développée avec Laravel (backend) et React (frontend).
Il permet aux professeurs de créer des examens, aux étudiants de les passer en temps réel, et de gérer les copies soumises avec un tableau de bord de contrôle.

🚀 Fonctionnalités principales
Gestion des examens : création, activation/désactivation, durée, points totaux.

Types de questions supportés :

Texte libre

Choix unique (radio)

Choix multiple (checkbox)

Vrai/Faux

Code HTML/CSS/JS avec template

Interface étudiant :

Page de connexion à l’examen

Timer qui diminue automatiquement

Mode plein écran

Soumission des réponses

Interface professeur :

Suivi des copies soumises

Liste des étudiants ayant terminé

Alertes suspectes (changement d’onglet, sortie du plein écran)

Génération de rapports

🛠️ Technologies utilisées
Backend : Laravel 10, PHP 8+

Frontend : React 18, Vite

Base de données : MySQL / MariaDB

Realtime : Laravel Echo + Pusher (pour les alertes et le suivi en direct)

📂 Structure du projet
Backend (Laravel)
app/Models/Exam.php → modèle des examens

app/Models/Question.php → modèle des questions

app/Models/Answer.php → modèle des réponses

app/Http/Controllers/ExamSessionController.php → logique principale (join, takeExam, submit, logActivity)

database/migrations/ → migrations pour exams, exam_sessions, questions, answers

Frontend (React)
src/pages/Page5_StudentForm.jsx → formulaire étudiant pour rejoindre un examen

src/pages/Page6_TakeExam.jsx → interface de passage d’examen (timer, plein écran, réponses)

src/pages/Page3_Control.jsx → tableau de bord professeur (copies soumises, alertes, rapports)

⚙️ Installation
Backend
bash
git clone https://github.com/username/exam-platform.git
cd exam-platform/backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
Frontend
bash
cd exam-platform/frontend
npm install
npm run dev
🔗 API Endpoints
POST /api/exam/join → créer une session étudiant

GET /api/exam/{token}/take → récupérer l’examen et ses questions

POST /api/exam/submit → soumettre les réponses

POST /api/exam/log-activity → enregistrer une activité suspecte

📊 Exemple de flux étudiant
L’étudiant colle le lien d’examen → Page5_StudentForm.jsx

Le backend crée une session et renvoie un session_id

L’étudiant est redirigé vers Page6_TakeExam.jsx

Les questions s’affichent avec timer et plein écran

Les réponses sont envoyées à /api/exam/submit

Le professeur voit les copies dans Page3_Control.jsx

🧑‍🏫 Exemple de flux professeur
Crée un examen avec ses questions

Active l’examen et partage le lien aux étudiants

Surveille en temps réel les copies soumises et les alertes

Génère un rapport final avec les résultats

✅ Bonnes pratiques
Vérifier que q.choices est toujours un tableau avant .map() côté React.

Utiliser Array.isArray(q.choices) pour éviter les erreurs.

Toujours transformer les réponses en tableau avant envoi (Object.entries(answers).map(...)).

Ajouter une colonne choices en JSON dans la table questions pour les radios/checkbox.

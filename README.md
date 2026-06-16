
# 💊 PharmaPredict - Medication Demand Prediction & Restocking API

**Projet Master IT**
**Encadrant :** Abdelhak Mahmoudi

## 📖 Contexte du Projet

La gestion des stocks dans le secteur pharmaceutique est un défi majeur. Une mauvaise anticipation de la demande peut entraîner des ruptures de stock (pertes de ventes et risques sanitaires) ou un surstock (immobilisation de trésorerie et péremption des produits). 

**PharmaPredict** est un système d'aide à la décision basé sur le Machine Learning, capable d'analyser les données historiques de vente d'une pharmacie pour estimer la demande future et générer des recommandations de réapprovisionnement priorisées.

## ✨ Fonctionnalités Principales

- 📊 **Tableau de bord analytique** : Visualisation des KPIs, tendances de vente, et impact des saisons/jours fériés.
  <img width="1891" height="909" alt="image" src="https://github.com/user-attachments/assets/d3a2639a-8fda-4802-9ac0-092fb5c75f72" />

- 🧠 **Prédiction par Intelligence Artificielle** : Modèle Random Forest prédisant la demande en tenant compte du contexte temporel marocain.
<img width="1645" height="848" alt="image" src="https://github.com/user-attachments/assets/1f21c019-a5e4-4768-9ecf-197ad39edf4f" />

- ⚠️ **Recommandations de réapprovisionnement** : Génération automatique des seuils de sécurité, des priorités (HAUTE, MOYENNE, BASSE) et des quantités exactes à commander.
  <img width="1625" height="835" alt="image" src="https://github.com/user-attachments/assets/ac5685ee-4c6b-4809-9793-87e63dd38829" />

- 🧪 **Simulateur de prédiction** : Interface permettant de simuler un scénario futur (ex: "Que se passe-t-il si mon stock est de X la veille de l'Aïd ?").
  <img width="927" height="706" alt="image" src="https://github.com/user-attachments/assets/9cde62b7-4abd-400d-a6ff-6a542f698a7a" />

- 🔍 **Transparence du modèle** : Page dédiée affichant les métriques de performance (MAE, R²) et l'importance des variables (Feature Importance).
<img width="1625" height="834" alt="image" src="https://github.com/user-attachments/assets/b78b898d-7719-41d8-8fb4-de02ec2a2247" />

## 🏗️ Architecture du Système

Le projet suit une architecture découplée Client-Serveur basée sur le pattern REST :

1. **Data / ML Layer (Python)** : Pipeline de génération de données, Feature Engineering, et modèle Random Forest sérialisé.
2. **Service Layer (FastAPI)** : API RESTful exposant les prédictions et la logique métier de réapprovisionnement.
3. **Presentation Layer (React)** : Interface utilisateur moderne et réactive consommant l'API.

## 🛠️ Stack Technologique

**Backend & Data Science :**
- Python 3.x
- Pandas & NumPy (Manipulation des données)
- Scikit-Learn (Machine Learning - Random Forest)
- FastAPI & Uvicorn (API REST)
- Pickle (Sérialisation du modèle)

**Frontend :**
- React.js (via Vite)
- TailwindCSS (Design & Responsive)
- Recharts (Data Visualisation)
- Axios (Client HTTP)

## 📂 Arborescence du Projet

```text
PharmaPredict/
├── backend/                      # Couche Data Science & API
│   ├── model_artifacts/          # Artefacts du modèle générés (model.pkl, etc.)
│   ├── api.py                    # Serveur FastAPI
│   ├── model_training.py         # Pipeline d'entraînement du modèle ML
│   ├── generate_data.py          # Générateur de dataset (Maroc 2024-2025)
│   ├── run_pipeline.py           # Script d'exécution séquentielle complet
│   ├── requirements.txt          # Dépendances Python
│   └── ...
│
├── frontend/                     # Couche Présentation (React)
│   ├── src/
│   │   ├── api/                  # Configuration Axios
│   │   ├── components/           # Composants réutilisables (Layout, Cards)
│   │   ├── pages/                # Pages de l'application (Dashboard, etc.)
│   │   ├── App.jsx               # Routage
│   │   └── main.jsx
│   ├── package.json              # Dépendances Node.js
│   └── ...
│
└── DEMARRER_PROJET.bat           # Script Windows pour lancer Backend + Frontend
```

## 🚀 Installation et Lancement (Setup)

### Prérequis

Assurez-vous d'avoir installé sur votre machine :
- [Python 3.8+](https://www.python.org/downloads/) (Cochez "Add Python to PATH" lors de l'installation)
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)

### 1. Cloner le dépôt

```bash
git clone https://github.com/VotrePseudo/PharmaPredict.git
cd PharmaPredict
```

### 2. Configuration du Backend

Ouvrez un terminal dans le dossier `backend` :

```bash
cd backend

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows :
venv\Scripts\activate
# Sur Mac/Linux :
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

### 3. Configuration du Frontend

Ouvrez un **nouveau** terminal dans le dossier `frontend` :

```bash
cd frontend

# Installer les dépendances
npm install
```

### 4. Lancement de l'application

Vous avez deux options pour lancer le projet :

**Option A : Le Pipeline Automatisé (Recommandé pour la démo)**
Double-cliquez sur le fichier `DEMARRER_PROJET.bat` à la racine du projet. Il va générer les données, entraîner le modèle, lancer l'API et le Frontend automatiquement.

**Option B : Lancement Manuel (Pour le développement)**

*Terminal 1 (Backend) - Dans le dossier `backend` (avec venv activé) :*
```bash
# Générer les données et entraîner le modèle (à faire une seule fois)
python generate_data.py
python model_training.py

# Lancer l'API
uvicorn api:app --reload --port 8000
```

*Terminal 2 (Frontend) - Dans le dossier `frontend` :*
```bash
npm run dev
```

### 5. Accès à l'application

- **Interface Utilisateur (React) :** [http://localhost:5173](http://localhost:5173)
- **Documentation API (Swagger) :** [http://localhost:8000/docs](http://localhost:8000/docs)

## 🧠 Le Pipeline Machine Learning

1. **Génération des données** : Un dataset simulant 60 médicaments sur 2024-2025 est généré, intégrant les jours fériés marocains et la logique d'anticipation (ex: pic des ventes la veille de l'Aïd).
2. **Feature Engineering** : Création de variables temporelles (mois, saison), de mémoire (Lags J-1, J-7), de tendances (Moyennes mobiles) et d'événements (veille de férié, pont).
3. **Entraînement** : Un modèle `Random Forest Regressor` est entraîné avec un split chronologique strict (`shuffle=False`) pour éviter le Data Leakage.
4. **Inférence & Logique Métier** : L'API reçoit la prédiction brute de l'IA, calcule un Stock de Sécurité (30%), détermine le Seuil de Réapprovisionnement, et génère la Quantité Exacte à Commander.

## 📬 Endpoints API Principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/dashboard` | Statistiques globales pour le tableau de bord |
| `GET` | `/api/medicaments` | Liste de tous les médicaments |
| `GET` | `/api/recommendations` | Liste des recommandations de réapprovisionnement |
| `POST`| `/api/predict` | Prédiction à la demande (Simulateur) |
| `GET` | `/api/model/metrics` | Métriques du modèle (MAE, R²) |

## 👥 Auteurs

- **SOURASSI Bouchra** 
- **SAADANI Fatima**

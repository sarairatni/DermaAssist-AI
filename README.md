# DermAssist AI - Dermatology Assistant Platform

Platform intelligente pour assister les dermatologues en Algérie. Combine des modèles d'IA, des données environnementales en temps réel, et une interface médecin-patient intégrée.

## 🏗️ Architecture

### Stack Technique

| Couche               | Technologie               |
| -------------------- | ------------------------- |
| **Frontend Médecin** | React + Vite              |
| **Frontend Patient** | React Native (Expo)       |
| **Backend**          | FastAPI (Python)          |
| **Base de Données**  | PostgreSQL                |
| **Stockage Images**  | MinIO (S3-compatible)     |
| **Cache**            | Redis                     |
| **Modèle CNN**       | EfficientNet-B0 (PyTorch) |
| **LLM**              | Mistral / Gemini          |

### Structure du Projet

```
DermaAssist-AI/
├── backend/                 # FastAPI server
│   ├── app/
│   │   ├── api/            # Routes API REST
│   │   ├── models/         # SQLAlchemy ORM
│   │   ├── schemas/        # Pydantic validators
│   │   ├── services/       # Business logic
│   │   ├── core/           # Config, security
│   │   ├── db/             # Database setup
│   │   └── ai/             # Pipeline AI (CNN, NLP)
│   ├── main.py             # Entry point
│   └── requirements.txt     # Dependencies
│
├── doctor-web/              # Interface médecin (React)
│   ├── src/
│   │   ├── pages/          # Pages principales
│   │   ├── components/     # Composants réutilisables
│   │   └── services/       # API client, stores
│   ├── vite.config.js
│   └── package.json
│
├── patient-mobile/          # App patient (React Native)
│   ├── src/
│   │   ├── screens/        # Écrans de l'app
│   │   └── services/       # API client, stores
│   ├── App.js
│   ├── app.json
│   └── package.json
│
└── docs/                    # Documentation
```

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js** 18+
- **Python** 3.10+
- **PostgreSQL** 14+
- **Redis** 7+
- **MinIO** (optionnel, ou AWS S3)

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt

# Configuration
cp .env.example .env
# Éditer .env avec vos clés API

# Démarrer le serveur
python main.py
```

Le serveur tourne sur `http://localhost:8000`

- Documentation Swagger: `http://localhost:8000/docs`
- Documentation ReDoc: `http://localhost:8000/redoc`

### 2. Frontend Médecin (React)

```bash
cd doctor-web

npm install

# Développement
npm run dev

# Production
npm run build
```

L'app tourne sur `http://localhost:5173`

### 3. Frontend Patient (React Native)

```bash
cd patient-mobile

npm install

# Développement avec Expo
npm start

# Scanneur QR code avec Expo Go
# ou
npm run ios      # Simulator iOS
npm run android  # Émulateur Android
```

## 🔒 API Endpoints

### Authentification

- `POST /auth/register` - Créer un compte
- `POST /auth/login` - Obtenir JWT tokens
- `POST /auth/refresh` - Renouveler token

### Patients (Médecin)

- `GET /patients` - Liste mes patients
- `POST /patients` - Créer dossier patient
- `GET /patients/{id}` - Détails patient
- `PATCH /patients/{id}` - Mettre à jour patient

### Consultations

- `POST /consultations` - Créer consultation
- `GET /consultations/{id}` - Détails consultation
- `PATCH /consultations/{id}/notes` - Ajouter notes

### Images Cutanées

- `POST /consultations/{id}/images` - Upload photo (doctor)
- `GET /consultations/{id}/images` - Liste photos
- `POST /checkins/image` - Upload photo de suivi (patient)

### Pipeline AI

- `POST /ai/analyze/{consultation_id}` - Lancer analyse AI
- `GET /ai/result/{consultation_id}` - Résultat AI
- `GET /ai/env-snapshot` - Données env. temps réel

### Conseils Patient

- `POST /consultations/{id}/advice` - Créer conseil (doctor)
- `GET /advice/me` - Mes conseils (patient)
- `PATCH /advice/{id}` - Modifier conseil (doctor)

### Check-ins Patient

- `POST /checkins` - Soumettre check-in
- `GET /checkins/me` - Mon historique

## 🤖 Pipeline AI Complet

```
1. Image Loader    → Récupère images depuis MinIO
                    ↓
2. CNN Classifier  → EfficientNet-B0 prédit classe cutanée
                    ↓
3. Patient Context → Charge âge, phototype, antécédents
                    ↓
4. Env. Fetcher    → OpenWeatherMap, OpenUV, OpenAQ
                    ↓
5. NLP Engine      → LLM génère questions cliniques
                    ↓
6. Fusion          → Combine résultats en AI_RESULT
```

## 🗄️ Schéma Base de Données

8 entités principales :

- **USER** - Authentification (role: doctor/patient)
- **DOCTOR** - Profil médecin (speciality, clinic)
- **PATIENT** - Profil patient (Fitzpatrick, city)
- **CONSULTATION** - Séance médicale (status: open/ai_done/advice_sent)
- **SKIN_IMAGE** - Photos cutanées (source: doctor/patient)
- **AI_RESULT** - Résultats d'analyse (diagnosis, confidence)
- **PATIENT_ADVICE** - Conseils transmis (tips, reminders, products_to_avoid)
- **CHECKIN** - Suivi quotidien patient (skin_score, notes)

[Voir le schéma détaillé dans la documentation]

## 🔐 Sécurité

- **Authentification JWT** avec access token (30 min) + refresh token (7 jours)
- **Hachage bcrypt** des mots de passe
- **CORS** configuré pour les deux frontends
- **Rôles d'accès** (doctor/patient) vérifiés sur chaque endpoint
- **Chiffrement TLS/SSL** en production

## 📊 Données Environnementales

Intégrées en temps réel pour chaque consultation :

| Source             | Données                    | Usage               |
| ------------------ | -------------------------- | ------------------- |
| **OpenWeatherMap** | Temp, humidité, conditions | Contexte clinique   |
| **OpenUV**         | UV index                   | Alertes solaires    |
| **OpenAQ**         | AQI, pollution             | Facteurs aggravants |

Cache Redis: **30 minutes** par ville

## 🎯 Cas d'Usage

### Médecin

1. Crée/accède dossier patient
2. Prend photos cutanées haute résolution
3. Lance pipeline AI (CNN + NLP)
4. Reçoit diagnostic assisté + questions suggérées
5. Valide conseils personnalisés
6. Patient reçoit notification + conseils simplifiés

### Patient

1. Se connecte à l'app mobile
2. Voit conseils du médecin (langage simple)
3. Reçoit rappels de médicaments
4. Soumet check-in quotidien (skin_score)
5. Upload optionnellement photos de suivi
6. Reçoit alertes UV/pollution contextualisées

## 📱 Spécificités Algérie

- **Datasets** : HAM10000 + DermNet (psoriasis, eczéma)
- **Limitation** : Leishmaniose cutanée (2e foyer mondial) sans dataset open-source
- **Future** : Création dataset algérien en collaboration avec CHU

## 📚 Documentation

- [Backend API Docs](./backend/README.md)
- [Doctor Web App](./doctor-web/README.md)
- [Patient Mobile App](./patient-mobile/README.md)

## 🛠️ Contribution

Les contributions sont bienvenues ! Consultez les issues et proposez des améliorations.

## 📄 Licence

MIT License - Voir [LICENSE](./LICENSE)

## 👥 Équipe

Projet créé pour l'assistance médicale en dermatologie.

---

**Status**: Version initiale avec architecture complète et endpoints de base.
**Prochaines étapes**: Implémentation du pipeline AI, intégration images, tests.

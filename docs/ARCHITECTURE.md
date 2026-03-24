project_setup_guide.md - À compléter

# DermAssist AI - Guide Technique Complet

**Version**: 1.0.0
**Status**: Architecture initiale + Endpoints API de base

## Résumé Exécutif

DermAssist AI est une plateforme dermatologique intelligente conçue pour les médecins algériens. Elle combine:

- **Interface Médecin**: Web app React/Vite pour gestion des patients, analyse d'images cutanées, assistance AI
- **Interface Patient**: App mobile React Native pour suivi des conseils, check-ins quotidiens, upload de photos
- **Backend Unifié**: FastAPI servant les deux apps via API REST sécurisée par JWT
- **Pipeline AI**: CNN (EfficientNet-B0) + NLP (LLM) + Données environnementales temps réel

---

## Points Clés Implémentés ✅

### Backend FastAPI

- ✅ Modèles SQLAlchemy (8 entités)
- ✅ Schemas Pydantic (validation)
- ✅ Services métier (authentification, consultations)
- ✅ Endpoints API (auth, patients, consultations, images, conseils, check-ins)
- ✅ Authentification JWT (access + refresh tokens)
- ✅ Sécurité (bcrypt, CORS)
- ✅ Configuration via .env

### Frontend Médecin

- ✅ Setup React + Vite + Tailwind
- ✅ Routing (React Router)
- ✅ State management (Zustand)
- ✅ API client (Axios + interceptors)
- ✅ Pages: Login, Dashboard, Patients, Consultation
- ✅ Nav bar, authentification

### Frontend Patient

- ✅ Setup React Native + Expo
- ✅ Navigation bottom tabs
- ✅ State management (Zustand)
- ✅ API client
- ✅ Screens: Login, Advice, CheckIn, Profile

---

## À Faire (Priorités)

### 🔴 Urgent (Sprint 1)

1. **Pipeline AI**
   - Intégration EfficientNet-B0
   - Preprocessing images (MinIO)
   - Forward pass et post-processing
   - Tests avec HAM10000

2. **Stockage Images**
   - Intégration MinIO (upload/download)
   - Validation fichiers (format, taille)
   - Cleanup automatique

3. **Données Environnementales**
   - Intégration OpenWeatherMap, OpenUV, OpenAQ
   - Caching Redis
   - Tests d'appels API

### 🟠 Important (Sprint 2)

4. **Complétude Frontend Médecin**
   - Pages détaillées Patient, Consultation
   - Upload image + preview
   - Formulaire création conseil
   - Charts historique lésions

5. **Complétude Frontend Patient**
   - Écran détails conseil
   - Historique check-ins
   - Upload photo suivi
   - Notifications push

6. **Tests & Validation**
   - Tests unitaires backend
   - Tests d'intégration API
   - Tests e2e frontends

### 🟡 Normal (Sprint 3+)

7. **Optimisations**
   - Performance (pagination, lazy loading)
   - Caching Frontend
   - Compression images
   - Rate limiting API

8. **Déploiement**
   - Docker Compose (tout en un)
   - CI/CD (GitHub Actions)
   - Configurations prod (env, secrets)

---

## Prochaines Actions

1. **Test Backend**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python main.py
   # Visiter http://localhost:8000/docs
   ```

2. **Test Frontend Médecin**

   ```bash
   cd doctor-web
   npm install
   npm run dev
   # http://localhost:5173
   ```

3. **Test Frontend Patient**

   ```bash
   cd patient-mobile
   npm install
   npm start
   # Scanner QR avec Expo Go
   ```

4. **Configurer la base de données**
   - Créer PostgreSQL
   - Remplir .env
   - Tester endpoints

5. **Implémenter pipeline AI**
   - Charger modèle EfficientNet
   - Tests inférence
   - Intégrer dans endpoint /ai/analyze

---

## Notes Architecturales

- Backend centralise TOUTE la logique métier
- Frontends affichent uniquement ce que l'API retourne (pas de filtrage)
- Rôles JWT (doctor/patient) gèrent les accès
- PatientAdvice est l'objet pivot médecin → patient
- Données envir. cachées Redis (30 min par ville)

---

Voir fichiers README respectifs pour plus de détails.

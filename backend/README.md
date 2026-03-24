# Backend Documentation

## Architecture FastAPI

### Structure des Répertoires

```
app/
├── api/            # Routes API REST (endpoints)
├── core/           # Configuration, sécurité
├── db/             # Database connection
├── models/         # SQLAlchemy ORM
├── schemas/        # Pydantic validators
├── services/       # Business logic
└── ai/             # Pipeline AI (CNN, NLP)
```

### Endpoints Disponibles

#### Authentification

```
POST /auth/register
- Body: {email, password, full_name, role}
- Response: {id, email, full_name, role, created_at}

POST /auth/login
- Body: {email, password}
- Response: {access_token, refresh_token, expires_in}

POST /auth/refresh
- Body: {refresh_token}
- Response: {access_token, token_type, expires_in}
```

#### Patients (Médecin)

```
GET /patients
- Response: [Patient]

POST /patients
- Body: {birth_date?, fitzpatrick_type?, city?, medical_history?}
- Response: Patient

GET /patients/{id}
- Response: Patient (détail complet)

PATCH /patients/{id}
- Body: {birth_date?, city?, ...}
- Response: Patient

GET /patients/me
- Response: Patient (profil du patient courant)
```

## Configuration

### Variables d'Environnement

Créer un fichier `.env` basé sur `.env.example` :

```
DATABASE_URL=postgresql://user:pass@localhost/dermassist
SECRET_KEY=your-secret-key
MISTRAL_API_KEY=sk-...
OPENUV_API_KEY=...
OPENWEATHERMAP_API_KEY=...
```

### Base de Données

Initialiser PostgreSQL :

```bash
createdb dermassist_db
```

Les tables sont créées automatiquement au démarrage de l'app.

### Développement

```bash
# Démarrer le serveur
python main.py

# Server runs on http://localhost:8000
# Swagger docs: http://localhost:8000/docs
```

## Modèles de Données

- **User**: Authentification globale
- **Doctor**: Profil médecin
- **Patient**: Profil patient
- **Consultation**: Séance médicale
- **SkinImage**: Photos cutanées
- **AIResult**: Résultats analyse
- **PatientAdvice**: Conseils au patient
- **CheckIn**: Suivi quotidien

## Services Métier

### AuthService
- `register_user()` - Créer compte
- `login_user()` - Authentifier
- `refresh_access_token()` - Renouveler JWT

### PatientService
- `get_patient_by_user_id()` - Récupérer profil
- `get_doctor_patients()` - Liste des patients
- `create_patient()` - Créer dossier
- `update_patient()` - Mettre à jour

### ConsultationService
- `create_consultation()` - Créer seance
- `get_consultation()` - Détails
- `get_patient_consultations()` - Historique
- `update_consultation_notes()` - Ajouter notes

## Pipeline AI

Implémentation future dans `app/ai/` :

1. **Image Loader** - Récupère images MinIO
2. **CNN Classifier** - EfficientNet-B0
3. **Patient Context** - Données patient
4. **Env Fetcher** - OpenWeatherMap, OpenUV, OpenAQ
5. **NLP Engine** - LLM pour questions/conseils
6. **Fusion** - Combine résultats

## Tests

```bash
# Exécuter les tests (à implémenter)
pytest
```

## Performance

- Connexion persistante PostgreSQL avec pool
- Cache Redis (TTL: 30 min)
- Compression response JSON
- Rate limiting (à configurer)

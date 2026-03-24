# Implémentation du Pipeline AI - Guide

## 🎯 Objectif

Implémenter `/ai/analyze/{consultation_id}` une endpoint qui orchestre:

1. Chargement images depuis MinIO
2. Inférence CNN (EfficientNet-B0)
3. Récupération contexte patient
4. Appels APIs environnementales
5. Génération LLM (questions + conseils)
6. Sauvegarde résultat AI_RESULT

---

## 📋 Étapes d'Implémentation

### Phase 1: Préparation Modèle

```python
# app/ai/cnn_classifier.py
import torch
import torchvision.models as models
from PIL import Image
import numpy as np

class EfficientNetClassifier:
    def __init__(self):
        # Charger pré-trained EfficientNet-B0
        self.model = models.efficientnet_b0(pretrained=True)
        self.model.eval()
        self.classes = ['mel', 'nv', 'bkl', 'akiec', 'bcc', 'df', 'vasc']  # HAM10000

    def predict(self, image_path):
        """Inférer classe cutanée + confiance"""
        img = Image.open(image_path)
        # Preprocessing...
        with torch.no_grad():
            output = self.model(img_tensor)

        confidence = torch.softmax(output, dim=1)
        pred_class = self.classes[confidence.argmax()]

        return {
            'label': pred_class,
            'confidence': float(confidence.max()),
            'probabilities': {self.classes[i]: float(confidence[0][i])
                            for i in range(len(self.classes))}
        }
```

### Phase 2: Intégration MinIO

```python
# app/services/minio_service.py
from minio import Minio

class MinIOService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_URL,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket = settings.MINIO_BUCKET_IMAGES

    def upload_image(self, file_path, object_name):
        """Upload image à MinIO"""
        self.client.fput_object(
            self.bucket,
            object_name,
            file_path
        )
        return f"s3://{self.bucket}/{object_name}"

    def download_image(self, object_name):
        """Download image depuis MinIO"""
        response = self.client.get_object(self.bucket, object_name)
        return response.read()
```

### Phase 3: APIs Environnementales

```python
# app/services/env_service.py
import httpx
import redis

class EnvironmentService:
    def __init__(self):
        self.redis_client = redis.Redis.from_url(settings.REDIS_URL)

    async def get_environment_snapshot(self, city: str):
        """Récupérer données env pour une ville (cache 30 min)"""

        # Vérifier cache
        cache_key = f"env:{city}"
        cached = self.redis_client.get(cache_key)
        if cached:
            return json.loads(cached)

        # Appeler APIs
        async with httpx.AsyncClient() as client:
            weather = await client.get(
                f"{settings.OPENWEATHER_API_URL}/weather",
                params={"q": city, "appid": settings.OPENWEATHERMAP_API_KEY}
            )
            uv = await client.get(
                f"{settings.OPENUV_API_URL}/protection",
                params={"lat": ..., "lng": ..., "apikey": settings.OPENUV_API_KEY}
            )
            aqi = await client.get(
                f"{settings.OPENAQ_API_URL}/latest",
                params={"city": city}
            )

        snapshot = {
            'temperature': weather.json()['main']['temp'],
            'humidity': weather.json()['main']['humidity'],
            'uv_index': uv.json()['result']['uv'],
            'aqi': aqi.json()['results'][0]['measurements'][0]['value']
        }

        # Cache 30 minutes
        self.redis_client.setex(cache_key, 1800, json.dumps(snapshot))

        return snapshot
```

### Phase 4: LLM pour Conseils

```python
# app/services/llm_service.py
import anthropic  # ou mistralai

class LLMService:
    def __init__(self):
        if settings.LLM_PROVIDER == "mistral":
            self.client = MistralClient(api_key=settings.MISTRAL_API_KEY)
        else:
            self.client = anthropic.Anthropic(api_key=settings.GEMINI_API_KEY)

    async def generate_clinical_questions(self, diagnosis, patient_history, env_data):
        """Générer questions cliniques suggérées"""

        prompt = f"""
        Diagnostic: {diagnosis}
        Historique patient: {patient_history}
        Données environnementales: {env_data}

        Suggère 3-5 questions cliniques pertinentes pour approfondir le diagnostic.
        Réponds en JSON: {{"questions": ["q1", "q2", ...]}}
        """

        response = self.client.messages.create(
            model="claude-3-haiku",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        return json.loads(response.content[0].text)

    async def generate_patient_advice(self, diagnosis, treatment_options, env_data):
        """Générer conseils patient (langage simple)"""

        prompt = f"""
        Situation: {diagnosis}
        Traitement: {treatment_options}
        Contexte environnemental: {env_data}

        Crée des conseils journaliers SIMPLES pour le patient (pas de jargon médical).
        Réponds en JSON: {{
            "tips": ["conseil 1", ...],
            "reminders": [{{"time": "09:00", "dose": "...", "product": "..."}}],
            "products_to_avoid": ["produit 1", ...]
        }}
        """

        response = self.client.messages.create(...)
        return json.loads(response.content[0].text)
```

### Phase 5: Endpoint Principal

```python
# app/api/ai.py - UPDATE

@router.post("/analyze/{consultation_id}", response_model=Dict[str, Any],
             status_code=status.HTTP_202_ACCEPTED)
async def analyze_consultation(
    consultation_id: str,
    current_user: dict = Depends(get_doctor_role),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks
):
    """
    Pipeline AI complet :
    1. Image loader
    2. CNN classifier
    3. Patient context
    4. Environment fetcher
    5. NLP engine
    6. Fusion + save
    """

    # Vérifier consultation existe
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id,
        Consultation.doctor_id == current_user["user_id"]
    ).first()

    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    # Lancer en background (async)
    background_tasks.add_task(
        run_ai_pipeline,
        consultation_id,
        db
    )

    return {
        "status": "processing",
        "consultation_id": consultation_id,
        "message": "Analysis queued, will be processed asynchronously"
    }


async def run_ai_pipeline(consultation_id: str, db: Session):
    """Pipeline AI - exécuté en background"""

    try:
        # 1. LOAD IMAGES
        images = db.query(SkinImage).filter(
            SkinImage.consultation_id == consultation_id
        ).all()

        if not images:
            raise ValueError("No images found")

        # 2. CNN CLASSIFICATION
        classifier = EfficientNetClassifier()
        cnn_results = []

        for img in images:
            # Download from MinIO
            img_data = MinIOService().download_image(img.minio_url)

            # Infer
            result = classifier.predict(img_data)
            cnn_results.append(result)

            # Save to DB
            img.cnn_label = result['label']
            img.cnn_confidence = result['confidence']

        db.commit()

        # 3. PATIENT CONTEXT
        consultation = db.query(Consultation).get(consultation_id)
        patient = consultation.patient

        context = {
            'age': calculate_age(patient.birth_date),
            'fitzpatrick': patient.fitzpatrick_type,
            'history': patient.medical_history
        }

        # 4. ENV DATA
        env_service = EnvironmentService()
        env_snapshot = await env_service.get_environment_snapshot(patient.city)

        # 5. NLP - QUESTIONS
        llm = LLMService()

        diagnosis = cnn_results[0]['label']  # Main diagnosis

        questions = await llm.generate_clinical_questions(
            diagnosis,
            context['history'],
            env_snapshot
        )

        # 6. FUSION - SAVE
        ai_result = AIResult(
            consultation_id=consultation_id,
            diagnosis=diagnosis,
            confidence={
                'cnn': cnn_results[0]['confidence'],
                'probabilities': cnn_results[0]['probabilities']
            },
            suggested_questions=questions['questions'],
            treatment_options=[],  # TODO: from knowledge base
            env_snapshot=env_snapshot
        )

        db.add(ai_result)
        db.commit()

        # Update consultation status
        consultation.status = ConsultationStatus.AI_DONE
        db.commit()

    except Exception as e:
        logger.error(f"AI Pipeline failed: {str(e)}")
        # TODO: Set error status
```

---

## 📦 Dépendances à Ajouter

```bash
# requirements.txt additions
torch==2.0.1
torchvision==0.16.0
minio==7.2.0
redis==5.0.1
httpx==0.25.1
mistralai==0.0.X  # ou google-generativeai
```

---

## 🧪 Tests

```python
# test_ai_pipeline.py

async def test_analyze_consultation():
    # Create test consultation with images
    # Call /ai/analyze
    # Verify AI_RESULT created
    # Check fields populated
    pass

def test_cnn_inference():
    classifier = EfficientNetClassifier()
    result = classifier.predict(test_image)
    assert result['label'] in classifier.classes
    assert 0 <= result['confidence'] <= 1
```

---

## ⚙️ Configuration

Ajouter à `.env`:

```
# Model
CNN_MODEL_PATH=./models/efficientnet_b0_ham10000.pth

# MinIO
MINIO_URL=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# LLM
MISTRAL_API_KEY=sk-...
# ou
GEMINI_API_KEY=...
```

---

## 📅 Estimation

- Phase 1-2: 4h (modèle + MinIO)
- Phase 3: 3h (APIs + cache)
- Phase 4: 5h (LLM integration + prompts)
- Phase 5: 3h (endpoint + background tasks)
- Tests: 4h

**Total: ~19h = 2-3 jours de dev**

---

Bon coding! 🚀

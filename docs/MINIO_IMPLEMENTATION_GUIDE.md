# Implémentation MinIO & Image Storage - Guide

## 🎯 Objectif

Implémenter upload/download d'images cutanées via MinIO (S3-compatible).

---

## 📋 Architecture

```
Doctor Upload           Patient Upload
      ↓                      ↓
POST /consultations/{id}   POST /checkins/image
      ↓                      ↓
  Validate & Resize          Validate
      ↓                      ↓
   MinIO S3                MinIO S3
      ↓                      ↓
  Store metadata         Store metadata
   in Database             in Database
      ↓                      ↓
  Return URL            Return URL
```

---

## 1️⃣ Setup MinIO Local

### Option A: Docker

```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio:latest \
  minio server /data --console-address ":9001"

# AccessKey: minioadmin
# SecretKey: minioadmin
# Console: http://localhost:9001 (créer bucket "dermassist-images")
```

### Option B: Standalone

```bash
# Download de https://min.io/download
./minio minio server /data

# Admin panel: http://localhost:9000
```

### Créer le Bucket

```python
from minio import Minio

client = Minio(
    "localhost:9000",
    access_key="minioadmin",
    secret_key="minioadmin",
)

# Créer bucket s'il n'existe pas
if not client.bucket_exists("dermassist-images"):
    client.make_bucket("dermassist-images")
    print("Bucket 'dermassist-images' created")
```

---

## 2️⃣ Service MinIO

```python
# app/services/minio_service.py

from minio import Minio
from minio.error import S3Error
from app.core.config import settings
from PIL import Image
import io
import os

class MinIOService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_URL,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket = settings.MINIO_BUCKET_IMAGES

    def upload_image(
        self,
        file_bytes: bytes,
        filename: str,
        consultation_id: str,
        source: str = "doctor"
    ) -> str:
        """
        Upload image à MinIO avec validation et redimensionnement.

        Args:
            file_bytes: Contenu du fichier
            filename: Nom original du fichier
            consultation_id: ID de la consultation
            source: "doctor" ou "patient"

        Returns:
            URL MinIO du fichier uploadé
        """

        try:
            # 1. VALIDATE
            self._validate_image(file_bytes)

            # 2. RESIZE & OPTIMIZE
            img = Image.open(io.BytesIO(file_bytes))

            # Doctor: haute résolution (max 2048px)
            # Patient: compressé (max 1024px)
            max_size = 2048 if source == "doctor" else 1024

            if max(img.width, img.height) > max_size:
                img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

            # Compresser JPEG
            if img.mode == 'RGBA':
                img = img.convert('RGB')

            output = io.BytesIO()
            img.save(output, format='JPEG', quality=85, optimize=True)
            optimized_bytes = output.getvalue()

            # 3. GENERATE S3 PATH
            import uuid
            import datetime

            timestamp = datetime.datetime.utcnow().strftime("%Y%m%d")
            unique_id = str(uuid.uuid4())[:8]
            extension = os.path.splitext(filename)[1].lower() or '.jpg'

            s3_key = f"consultations/{consultation_id}/{timestamp}_{unique_id}{extension}"

            # 4. UPLOAD
            self.client.put_object(
                self.bucket,
                s3_key,
                io.BytesIO(optimized_bytes),
                len(optimized_bytes),
                content_type='image/jpeg'
            )

            # 5. RETURN URL
            url = f"s3://{self.bucket}/{s3_key}"
            return url

        except S3Error as e:
            raise Exception(f"MinIO upload failed: {str(e)}")

    def download_image(self, s3_path: str) -> bytes:
        """Download image depuis MinIO"""

        try:
            # Parse s3://bucket/key
            parts = s3_path.replace("s3://", "").split("/", 1)
            bucket = parts[0]
            key = parts[1]

            response = self.client.get_object(bucket, key)
            return response.read()

        except S3Error as e:
            raise Exception(f"MinIO download failed: {str(e)}")

    def delete_image(self, s3_path: str) -> bool:
        """Supprimer image depuis MinIO"""

        try:
            parts = s3_path.replace("s3://", "").split("/", 1)
            bucket = parts[0]
            key = parts[1]

            self.client.remove_object(bucket, key)
            return True

        except S3Error as e:
            raise Exception(f"MinIO delete failed: {str(e)}")

    @staticmethod
    def _validate_image(file_bytes: bytes):
        """Valider que c'est une image valide"""

        try:
            img = Image.open(io.BytesIO(file_bytes))

            # Check format
            if img.format not in ['JPEG', 'PNG', 'WEBP']:
                raise ValueError(f"Invalid format: {img.format}")

            # Check size (max 10MB)
            if len(file_bytes) > 10 * 1024 * 1024:
                raise ValueError("File too large (max 10MB)")

            # Check dimensions
            if img.width < 100 or img.height < 100:
                raise ValueError("Image too small (min 100x100)")

            if img.width > 4096 or img.height > 4096:
                raise ValueError("Image too large (max 4096x4096)")

        except Exception as e:
            raise ValueError(f"Invalid image: {str(e)}")


# Singleton instance
minio_service = MinIOService()
```

---

## 3️⃣ Endpoints Upload

```python
# app/api/images.py - UPDATE

from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_doctor_role, get_patient_role
from app.models.skin_image import SkinImage, ImageSource
from app.services.minio_service import minio_service
import uuid

router = APIRouter(tags=["Skin Images"])


@router.post("/consultations/{consultation_id}/images")
async def upload_consultation_image(
    consultation_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_doctor_role),
    db: Session = Depends(get_db)
):
    """Upload photo cutanée (doctor, haute résolution)"""

    try:
        # Vérifier consultation
        from app.models.consultation import Consultation
        consultation = db.query(Consultation).filter(
            Consultation.id == consultation_id,
            Consultation.doctor_id == current_user["user_id"]
        ).first()

        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation not found")

        # Read file
        contents = await file.read()

        # Upload to MinIO
        minio_url = minio_service.upload_image(
            contents,
            file.filename,
            consultation_id,
            source="doctor"
        )

        # Save metadata in DB
        skin_image = SkinImage(
            consultation_id=consultation_id,
            minio_url=minio_url,
            source=ImageSource.DOCTOR
        )

        db.add(skin_image)
        db.commit()
        db.refresh(skin_image)

        return {
            "id": str(skin_image.id),
            "consultation_id": str(skin_image.consultation_id),
            "minio_url": skin_image.minio_url,
            "source": skin_image.source.value,
            "cnn_label": skin_image.cnn_label,
            "cnn_confidence": skin_image.cnn_confidence,
            "uploaded_at": skin_image.uploaded_at
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Upload failed"
        )


@router.post("/checkins/image")
async def upload_checkin_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_patient_role),
    db: Session = Depends(get_db)
):
    """Upload photo de suivi (patient, compressée)"""

    try:
        from app.models.patient import Patient
        from app.models.checkin import CheckIn

        # Get patient
        patient = db.query(Patient).filter(
            Patient.user_id == current_user["user_id"]
        ).first()

        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Read & upload
        contents = await file.read()

        checkin_id = str(uuid.uuid4())
        minio_url = minio_service.upload_image(
            contents,
            file.filename,
            checkin_id,
            source="patient"
        )

        # Create CheckIn with image
        checkin = CheckIn(
            patient_id=str(patient.id),
            photo_url=minio_url
        )

        db.add(checkin)
        db.commit()
        db.refresh(checkin)

        return {
            "id": str(checkin.id),
            "patient_id": str(checkin.patient_id),
            "photo_url": checkin.photo_url,
            "skin_score": checkin.skin_score,
            "date": checkin.date
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Upload failed")


@router.get("/consultations/{consultation_id}/images")
def list_consultation_images(
    consultation_id: str,
    current_user: dict = Depends(get_doctor_role),
    db: Session = Depends(get_db)
):
    """Récupérer toutes les images d'une consultation"""

    from app.models.skin_image import SkinImage

    images = db.query(SkinImage).filter(
        SkinImage.consultation_id == consultation_id
    ).all()

    return [
        {
            "id": str(img.id),
            "consultation_id": str(img.consultation_id),
            "minio_url": img.minio_url,
            "source": img.source.value,
            "cnn_label": img.cnn_label,
            "cnn_confidence": img.cnn_confidence,
            "uploaded_at": img.uploaded_at
        }
        for img in images
    ]
```

---

## 4️⃣ Frontend Upload (Doctor Web)

```jsx
// doctor-web/src/components/ImageUpload.jsx

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { images } from "../services/api";
import toast from "react-hot-toast";

export default function ImageUpload({ consultationId }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);

  const onDrop = async (acceptedFiles) => {
    setUploading(true);

    for (const file of acceptedFiles) {
      try {
        const response = await images.upload(consultationId, file);
        setUploadedImages((prev) => [...prev, response.data]);
        toast.success(`Image uploaded: ${file.name}`);
      } catch (error) {
        toast.error(`Upload failed: ${file.name}`);
      }
    }

    setUploading(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png"] },
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed p-8 rounded-lg text-center cursor-pointer
          ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-600">Drop images here...</p>
        ) : (
          <p className="text-gray-600">Drag images here or click to select</p>
        )}
      </div>

      {uploadedImages.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          {uploadedImages.map((img) => (
            <div key={img.id} className="border rounded p-2">
              <img
                src={img.minio_url}
                alt="uploaded"
                className="w-full h-32 object-cover rounded"
              />
              {img.cnn_label && (
                <p className="text-sm mt-2">
                  Predicted: {img.cnn_label} (
                  {Math.round(img.cnn_confidence * 100)}%)
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 5️⃣ Configuration .env

```bash
# MinIO
MINIO_URL=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_IMAGES=dermassist-images
MINIO_SECURE=False

# Pour production (S3 AWS)
# MINIO_URL=s3.amazonaws.com
# MINIO_SECURE=True
```

---

## 📋 Checklist d'Implémentation

- [ ] MinIO service (`app/services/minio_service.py`)
- [ ] Endpoints upload (`app/api/images.py`)
- [ ] Image component frontend (`doctor-web/src/components/ImageUpload.jsx`)
- [ ] Validation & compression
- [ ] Tests upload
- [ ] Cleanup ancien images (cron job futur)
- [ ] Migration S3 (futur)

---

## 🧪 Test Manuel

```bash
# 1. Démarrer MinIO
docker run -d -p 9000:9000 -p 9001:9001 minio/minio:latest \
  minio server /data --console-address ":9001"

# 2. Create bucket via console http://localhost:9001

# 3. Tester API:
curl -F "file=@test_image.jpg" \
  -H "Authorization: Bearer <token>" \
  http://localhost:8000/consultations/abc123/images

# 4. Vérifier dans console MinIO
```

---

## 📊 Spec Images

| Aspect         | Doctor          | Patient         |
| -------------- | --------------- | --------------- |
| Max Size       | 10MB            | 10MB            |
| Max Dimensions | 4096×4096       | 4096×4096       |
| Resize Target  | 2048px          | 1024px          |
| Quality        | 85%             | 85%             |
| Formats        | JPEG, PNG, WEBP | JPEG, PNG, WEBP |

---

**Estimation**: 8-10h (implémentation + tests)

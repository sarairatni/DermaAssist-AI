from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_doctor_role, get_patient_role
from app.schemas.skin_image import SkinImageResponse, SkinImageDetail
from typing import List

router = APIRouter(prefix="/consultations", tags=["Skin Images"])


@router.post("/{consultation_id}/images", response_model=SkinImageResponse, status_code=status.HTTP_201_CREATED)
async def upload_consultation_image(
    consultation_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_doctor_role),
    db: Session = Depends(get_db)
):
    """
    Uploader une photo cutanée pour une consultation (source: doctor).
    La photo est stockée dans MinIO et son URL est sauvegardée.
    """
    # TODO: Implémenter l'upload MinIO
    # Pour l'instant, c'est un placeholder
    return {
        "id": "image-id",
        "consultation_id": consultation_id,
        "minio_url": "s3://bucket/path",
        "source": "doctor",
        "cnn_label": None,
        "cnn_confidence": None,
        "uploaded_at": "2024-01-01T00:00:00"
    }


@router.get("/{consultation_id}/images", response_model=List[SkinImageResponse])
def list_consultation_images(
    consultation_id: str,
    current_user: dict = Depends(get_doctor_role),
    db: Session = Depends(get_db)
):
    """Récupérer toutes les photos d'une consultation."""
    from app.models.skin_image import SkinImage
    
    images = db.query(SkinImage).filter(SkinImage.consultation_id == consultation_id).all()
    return images


@router.post("/checkins/image", response_model=SkinImageResponse, status_code=status.HTTP_201_CREATED)
async def upload_checkin_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_patient_role),
    db: Session = Depends(get_db)
):
    """
    Uploader une photo de suivi (source: patient, fiabilité moindre).
    Cette photo est associée à un check-in, pas directement à une consultation.
    """
    # TODO: Implémenter l'upload MinIO
    # Pour l'instant, c'est un placeholder
    return {
        "id": "image-id",
        "consultation_id": None,
        "minio_url": "s3://bucket/path",
        "source": "patient",
        "cnn_label": None,
        "cnn_confidence": None,
        "uploaded_at": "2024-01-01T00:00:00"
    }

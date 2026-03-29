from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ImageSource(str, Enum):
    DOCTOR = "doctor"
    PATIENT = "patient"


class SkinImageBase(BaseModel):
    source: ImageSource = ImageSource.DOCTOR
    patient_id: Optional[str] = None


class SkinImageCreate(SkinImageBase):
    pass


class SkinImageResponse(SkinImageBase):
    id: str
    patient_id: Optional[str] = None
    consultation_id: Optional[str] = None
    minio_url: Optional[str] = None
    cnn_label: Optional[str] = None
    cnn_confidence: Optional[float] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class SkinImageDetail(SkinImageResponse):
    """Réponse détaillée avec tous les résultats CNN."""
    pass

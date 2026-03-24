from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date, datetime


class PatientAdviceBase(BaseModel):
    tips: Optional[List[str]] = None
    reminders: Optional[List[Dict[str, Any]]] = None
    products_to_avoid: Optional[List[str]] = None
    valid_until: Optional[date] = None


class PatientAdviceCreate(PatientAdviceBase):
    pass


class PatientAdviceUpdate(PatientAdviceBase):
    is_active: Optional[bool] = None


class PatientAdviceResponse(PatientAdviceBase):
    """Réponse complète (pour le médecin)."""
    id: str
    consultation_id: str
    patient_id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PatientAdvicePatient(BaseModel):
    """Réponse filtrée pour le patient (sans données sensibles)."""
    id: str
    tips: Optional[List[str]] = None
    reminders: Optional[List[Dict[str, Any]]] = None
    products_to_avoid: Optional[List[str]] = None
    valid_until: Optional[date] = None

    class Config:
        from_attributes = True

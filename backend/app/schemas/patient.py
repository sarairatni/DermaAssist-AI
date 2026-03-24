from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from enum import Enum


class FitzpatrickType(str, Enum):
    TYPE_I = "I"
    TYPE_II = "II"
    TYPE_III = "III"
    TYPE_IV = "IV"
    TYPE_V = "V"
    TYPE_VI = "VI"


class PatientBase(BaseModel):
    birth_date: Optional[date] = None
    fitzpatrick_type: Optional[FitzpatrickType] = FitzpatrickType.TYPE_IV
    city: Optional[str] = None
    medical_history: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(PatientBase):
    pass


class PatientResponse(PatientBase):
    id: str
    user_id: str
    doctor_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PatientSelf(PatientResponse):
    """Réponse limitée pour GET /patients/me"""
    pass

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ConsultationStatus(str, Enum):
    OPEN = "open"
    AI_DONE = "ai_done"
    ADVICE_SENT = "advice_sent"


class ConsultationBase(BaseModel):
    notes: Optional[str] = None
    status: ConsultationStatus = ConsultationStatus.OPEN


class ConsultationCreate(BaseModel):
    patient_id: str


class ConsultationUpdate(ConsultationBase):
    pass


class ConsultationResponse(ConsultationBase):
    id: str
    patient_id: str
    doctor_id: str
    date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class ConsultationDetail(ConsultationResponse):
    """Consultation avec détails complets (pour le médecin)."""
    pass

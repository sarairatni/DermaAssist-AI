from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CheckInBase(BaseModel):
    skin_score: Optional[int] = None  # 1-10
    notes: Optional[str] = None


class CheckInCreate(CheckInBase):
    pass


class CheckInResponse(CheckInBase):
    id: str
    patient_id: str
    photo_url: Optional[str] = None
    date: datetime
    created_at: datetime

    class Config:
        from_attributes = True

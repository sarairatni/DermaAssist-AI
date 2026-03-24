from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class AIResultResponse(BaseModel):
    """Réponse du pipeline AI (accessible au médecin uniquement)."""
    id: str
    consultation_id: str
    diagnosis: Optional[str] = None
    confidence: Optional[Dict[str, Any]] = None
    suggested_questions: Optional[List[str]] = None
    treatment_options: Optional[List[Dict[str, Any]]] = None
    env_snapshot: Optional[Dict[str, Any]] = None
    generated_at: datetime

    class Config:
        from_attributes = True

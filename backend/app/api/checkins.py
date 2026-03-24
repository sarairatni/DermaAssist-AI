from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_patient_role
from app.schemas.checkin import CheckInResponse, CheckInCreate
from typing import List

router = APIRouter(prefix="/checkins", tags=["Check-ins"])


@router.post("", response_model=CheckInResponse, status_code=status.HTTP_201_CREATED)
def create_checkin(
    checkin_data: CheckInCreate,
    current_user: dict = Depends(get_patient_role),
    db: Session = Depends(get_db)
):
    """Soumettre un check-in quotidien."""
    from app.models.checkin import CheckIn
    from app.models.patient import Patient
    
    # Récupérer le patient
    patient = db.query(Patient).filter(Patient.user_id == current_user["user_id"]).first()
    
    if not patient:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    checkin = CheckIn(
        patient_id=patient.id,
        **checkin_data.dict()
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return checkin


@router.get("/me", response_model=List[CheckInResponse])
def get_my_checkins(
    current_user: dict = Depends(get_patient_role),
    db: Session = Depends(get_db)
):
    """Récupérer son historique de check-ins."""
    from app.models.checkin import CheckIn
    from app.models.patient import Patient
    
    patient = db.query(Patient).filter(Patient.user_id == current_user["user_id"]).first()
    
    if not patient:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    checkins = db.query(CheckIn).filter(CheckIn.patient_id == patient.id).order_by(CheckIn.date.desc()).all()
    return checkins


@router.get("/{patient_id}", response_model=List[CheckInResponse])
def get_patient_checkins(
    patient_id: str,
    current_user: dict = Depends(get_patient_role),
    db: Session = Depends(get_db)
):
    """Récupérer les check-ins d'un patient (médecin uniquement dans ce cas, mais ajouté pour la complétude)."""
    from app.models.checkin import CheckIn
    
    checkins = db.query(CheckIn).filter(CheckIn.patient_id == patient_id).order_by(CheckIn.date.desc()).all()
    return checkins

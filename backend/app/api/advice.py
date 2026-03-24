from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_doctor_role, get_patient_role
from app.schemas.patient_advice import PatientAdviceResponse, PatientAdviceCreate, PatientAdviceUpdate, PatientAdvicePatient
from typing import List

router = APIRouter(tags=["Patient Advice"])


@router.post("/consultations/{consultation_id}/advice", response_model=PatientAdviceResponse, status_code=status.HTTP_201_CREATED)
def create_patient_advice(
    consultation_id: str,
    advice_data: PatientAdviceCreate,
    current_user: dict = Depends(get_doctor_role),
    db: Session = Depends(get_db)
):
    """Créer et valider un conseil patient (médecin uniquement)."""
    from app.models.patient_advice import PatientAdvice
    from app.models.consultation import Consultation
    
    # Vérifier que la consultation existe et appartient au médecin
    consultation = db.query(Consultation).filter(
        Consultation.id == consultation_id,
        Consultation.doctor_id == current_user["user_id"]
    ).first()
    
    if not consultation:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    advice = PatientAdvice(
        consultation_id=consultation_id,
        patient_id=consultation.patient_id,
        **advice_data.dict()
    )
    db.add(advice)
    db.commit()
    db.refresh(advice)
    return advice


@router.get("/advice/{advice_id}", response_model=PatientAdviceResponse)
def get_patient_advice(
    advice_id: str,
    current_user: dict = Depends(get_doctor_role),
    db: Session = Depends(get_db)
):
    """Récupérer un conseil patient complet (médecin uniquement)."""
    from app.models.patient_advice import PatientAdvice
    from app.models.consultation import Consultation
    
    advice = db.query(PatientAdvice).filter(PatientAdvice.id == advice_id).first()
    
    if not advice:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Advice not found")
    
    # Vérifier que le médecin a accès à cette consultation
    consultation = db.query(Consultation).filter(
        Consultation.id == advice.consultation_id,
        Consultation.doctor_id == current_user["user_id"]
    ).first()
    
    if not consultation:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    
    return advice


@router.patch("/advice/{advice_id}", response_model=PatientAdviceResponse)
def update_patient_advice(
    advice_id: str,
    advice_data: PatientAdviceUpdate,
    current_user: dict = Depends(get_doctor_role),
    db: Session = Depends(get_db)
):
    """Modifier ou désactiver un conseil patient (médecin uniquement)."""
    from app.models.patient_advice import PatientAdvice
    from app.models.consultation import Consultation
    
    advice = db.query(PatientAdvice).filter(PatientAdvice.id == advice_id).first()
    
    if not advice:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Advice not found")
    
    # Vérifier l'accès
    consultation = db.query(Consultation).filter(
        Consultation.id == advice.consultation_id,
        Consultation.doctor_id == current_user["user_id"]
    ).first()
    
    if not consultation:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Access denied")
    
    for key, value in advice_data.dict(exclude_unset=True).items():
        setattr(advice, key, value)
    
    db.commit()
    db.refresh(advice)
    return advice


@router.get("/advice/me", response_model=List[PatientAdvicePatient])
def get_my_advice(
    current_user: dict = Depends(get_patient_role),
    db: Session = Depends(get_db)
):
    """Récupérer les conseils actifs du patient (interface patient)."""
    from app.models.patient_advice import PatientAdvice
    from app.models.patient import Patient
    
    # Récupérer l'ID du patient
    patient = db.query(Patient).filter(Patient.user_id == current_user["user_id"]).first()
    
    if not patient:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    # Récupérer les conseils actifs
    advice_list = db.query(PatientAdvice).filter(
        PatientAdvice.patient_id == patient.id,
        PatientAdvice.is_active == True
    ).all()
    
    return advice_list

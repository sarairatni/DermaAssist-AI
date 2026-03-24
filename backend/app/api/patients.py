from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_current_user, get_doctor_role, get_patient_role
from app.schemas.patient import PatientResponse, PatientCreate, PatientUpdate, PatientSelf
from app.services.patient_service import PatientService
from typing import List

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("", response_model=List[PatientResponse])
def list_patients(
    current_user: dict = Depends(get_doctor_role),
    db: Session = Depends(get_db)
):
    """Récupérer tous les patients d'un médecin."""
    doctor_id = current_user["user_id"]
    patients = PatientService.get_doctor_patients(db, doctor_id)
    return patients


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    patient_data: PatientCreate,
    current_user: dict = Depends(get_doctor_role),
    db: Session = Depends(get_db)
):
    """Créer un nouveau dossier patient."""
    doctor_id = current_user["user_id"]
    return PatientService.create_patient(db, doctor_id, patient_data.dict())


@router.get("/me", response_model=PatientSelf)
def get_current_patient(
    current_user: dict = Depends(get_patient_role),
    db: Session = Depends(get_db)
):
    """Récupérer son propre profil patient."""
    user_id = current_user["user_id"]
    return PatientService.get_patient_by_user_id(db, user_id)


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    current_user: dict = Depends(get_doctor_role),
    db: Session = Depends(get_db)
):
    """Récupérer le dossier complet d'un patient."""
    doctor_id = current_user["user_id"]
    return PatientService.get_patient_details(db, patient_id, doctor_id)


@router.patch("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    patient_data: PatientUpdate,
    current_user: dict = Depends(get_doctor_role),
    db: Session = Depends(get_db)
):
    """Mettre à jour les informations d'un patient."""
    # Vérifier l'accès
    PatientService.get_patient_details(db, patient_id, current_user["user_id"])
    return PatientService.update_patient(db, patient_id, patient_data.dict(exclude_unset=True))

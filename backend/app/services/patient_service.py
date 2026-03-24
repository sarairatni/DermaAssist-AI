from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.patient import Patient
from app.models.user import User
from fastapi import HTTPException, status
from uuid import UUID


class PatientService:
    """Service pour la gestion des dossiers patients."""

    @staticmethod
    def get_patient_by_user_id(db: Session, user_id: str) -> Patient:
        """Récupérer le profil patient d'un utilisateur."""
        patient = db.query(Patient).filter(Patient.user_id == user_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient profile not found"
            )
        return patient

    @staticmethod
    def get_doctor_patients(db: Session, doctor_id: str) -> list:
        """Récupérer tous les patients d'un médecin."""
        return db.query(Patient).filter(Patient.doctor_id == doctor_id).all()

    @staticmethod
    def get_patient_details(db: Session, patient_id: str, doctor_id: str) -> Patient:
        """Récupérer les détails complets d'un patient (le médecin doit être son médecin traitant)."""
        patient = db.query(Patient).filter(
            and_(
                Patient.id == patient_id,
                Patient.doctor_id == doctor_id
            )
        ).first()
        
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        return patient

    @staticmethod
    def create_patient(db: Session, doctor_id: str, patient_data: dict) -> Patient:
        """Créer un nouveau dossier patient (par un médecin)."""
        # Vérifier que le médecin existe
        from app.models.doctor import Doctor
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
        if not doctor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Doctor not found"
            )
        
        patient = Patient(
            doctor_id=doctor_id,
            **patient_data
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
        return patient

    @staticmethod
    def update_patient(db: Session, patient_id: str, patient_data: dict) -> Patient:
        """Mettre à jour les informations d'un patient."""
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found"
            )
        
        for key, value in patient_data.items():
            if value is not None:
                setattr(patient, key, value)
        
        db.commit()
        db.refresh(patient)
        return patient

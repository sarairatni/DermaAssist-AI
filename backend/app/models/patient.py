from sqlalchemy import Column, String, Date, Enum, ForeignKey, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
import enum


class FitzpatrickType(str, enum.Enum):
    """Types de peau selon l'échelle de Fitzpatrick."""
    TYPE_I = "I"
    TYPE_II = "II"
    TYPE_III = "III"
    TYPE_IV = "IV"
    TYPE_V = "V"
    TYPE_VI = "VI"


class Patient(Base):
    """Modèle pour les profils patients."""
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("doctors.id"), nullable=True)
    birth_date = Column(Date, nullable=True)
    fitzpatrick_type = Column(Enum(FitzpatrickType), nullable=True, default=FitzpatrickType.TYPE_IV)
    city = Column(String(100), nullable=True)  # Pour les données environnementales
    medical_history = Column(Text, nullable=True)  # Antécédents médicaux
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    doctor = relationship("Doctor", back_populates="patients")
    consultations = relationship("Consultation", back_populates="patient")
    check_ins = relationship("CheckIn", back_populates="patient")
    advice = relationship("PatientAdvice", back_populates="patient")

    def __repr__(self):
        return f"<Patient {self.id}>"

from sqlalchemy import Column, DateTime, ForeignKey, Text, Boolean, Date, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid


class PatientAdvice(Base):
    """Modèle pour les conseils transmis au patient (objet pivot)."""
    __tablename__ = "patient_advice"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consultation_id = Column(UUID(as_uuid=True), ForeignKey("consultations.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    tips = Column(JSON, nullable=True)  # Conseils quotidiens (langage simple)
    reminders = Column(JSON, nullable=True)  # Rappels médicaments (horaires, doses)
    products_to_avoid = Column(JSON, nullable=True)  # Produits et expositions à éviter
    is_active = Column(Boolean, default=True)  # Actif ou remplacé par un conseil plus récent
    valid_until = Column(Date, nullable=True)  # Date d'expiration
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    consultation = relationship("Consultation", back_populates="patient_advice")
    patient = relationship("Patient", back_populates="advice")

    def __repr__(self):
        return f"<PatientAdvice {self.id}>"

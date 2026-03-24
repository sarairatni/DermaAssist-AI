from sqlalchemy import Column, String, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid


class Doctor(Base):
    """Modèle pour les profils médecins."""
    __tablename__ = "doctors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    speciality = Column(String(255), nullable=True)  # Ex: Dermatologue
    clinic_name = Column(String(255), nullable=True)
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    patients = relationship("Patient", back_populates="doctor")
    consultations = relationship("Consultation", back_populates="doctor")

    def __repr__(self):
        return f"<Doctor {self.clinic_name}>"

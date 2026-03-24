from sqlalchemy import Column, Integer, DateTime, ForeignKey, Text, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid


class CheckIn(Base):
    """Modèle pour le suivi quotidien des patients."""
    __tablename__ = "check_ins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    skin_score = Column(Integer, nullable=True)  # Auto-évaluation (1-10)
    notes = Column(Text, nullable=True)  # Observations personnelles
    photo_url = Column(String(500), nullable=True)  # Photo optionnelle (MinIO)
    date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    patient = relationship("Patient", back_populates="check_ins")

    def __repr__(self):
        return f"<CheckIn {self.id}>"

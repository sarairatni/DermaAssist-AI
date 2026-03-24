from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.schemas.user import UserRegister, UserLogin
from fastapi import HTTPException, status
from datetime import timedelta


class AuthService:
    """Service pour l'authentification et la gestion des utilisateurs."""

    @staticmethod
    def register_user(db: Session, user_data: UserRegister) -> dict:
        """Enregistrer un nouvel utilisateur (médecin ou patient)."""
        
        # Vérifier si l'email existe déjà
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Créer l'utilisateur
        user = User(
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            full_name=user_data.full_name,
            role=user_data.role
        )
        db.add(user)
        db.flush()  # Flush pour obtenir l'ID sans committer
        
        # Créer le profil associé (Doctor ou Patient)
        if user_data.role == UserRole.DOCTOR:
            doctor = Doctor(user_id=user.id)
            db.add(doctor)
        else:
            patient = Patient(user_id=user.id)
            db.add(patient)
        
        db.commit()
        db.refresh(user)
        
        return {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value
        }

    @staticmethod
    def login_user(db: Session, login_data: UserLogin) -> dict:
        """Authentifier un utilisateur et retourner les tokens JWT."""
        
        user = db.query(User).filter(User.email == login_data.email).first()
        
        if not user or not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Créer les tokens
        access_token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value
        }
        access_token = create_access_token(access_token_data)
        refresh_token = create_refresh_token(access_token_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 30 * 60  # 30 minutes en secondes
        }

    @staticmethod
    def refresh_access_token(token: str) -> dict:
        """Renouveler un access token à partir d'un refresh token."""
        from app.core.security import decode_token
        
        payload = decode_token(token)
        
        # Vérifier que c'est un refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        # Créer un nouvel access token
        access_token_data = {
            "sub": payload["sub"],
            "email": payload["email"],
            "role": payload["role"]
        }
        access_token = create_access_token(access_token_data)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 30 * 60
        }

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user import UserRegister, UserLogin, TokenResponse, TokenRefresh, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Créer un nouveau compte (médecin ou patient)."""
    return AuthService.register_user(db, user_data)


@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authentifier un utilisateur et obtenir les tokens JWT."""
    return AuthService.login_user(db, login_data)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(refresh_data: TokenRefresh):
    """Renouveler un access token expiré avec un refresh token."""
    return AuthService.refresh_access_token(refresh_data.refresh_token)

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import Base, engine
from app.models import User
from app.schemas import UserCreate, UserOut, Token
from app.security import hash_password, verify_password, create_access_token
from app.deps import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.on_event("startup")
def on_startup():
	Base.metadata.create_all(bind=engine)


@router.post("/register", response_model=UserOut)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
	existing = db.query(User).filter(User.username == user_in.username).first()
	if existing:
		raise HTTPException(status_code=400, detail="Username already exists")
	user = User(username=user_in.username, password_hash=hash_password(user_in.password))
	db.add(user)
	db.commit()
	db.refresh(user)
	return user


@router.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
	user = db.query(User).filter(User.username == form_data.username).first()
	if not user or not verify_password(form_data.password, user.password_hash):
		raise HTTPException(status_code=400, detail="Incorrect username or password")
	token = create_access_token(subject=user.username)
	return Token(access_token=token)








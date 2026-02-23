from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.config import settings
from app.models import User


def get_db() -> Generator[Session, None, None]:
	b = SessionLocal()
	try:
		yield b
	finally:
		b.close()


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
	credentials_exception = HTTPException(
		status_code=status.HTTP_401_UNAUTHORIZED,
		detail="Could not validate credentials",
		headers={"WWW-Authenticate": "Bearer"},
	)
	try:
		payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
		username: str = payload.get("sub")  # type: ignore
		if username is None:
			raise credentials_exception
	except JWTError:
		raise credentials_exception
	user = db.query(User).filter(User.username == username).first()
	if not user:
		raise credentials_exception
	return user








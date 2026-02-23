import os
from pydantic import BaseModel


class Settings(BaseModel):
	DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./oj.db")
	JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me")
	JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
	ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
	REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
	RQ_QUEUE_NAME: str = os.getenv("RQ_QUEUE_NAME", "judging")
	TIME_LIMIT_MS: int = int(os.getenv("TIME_LIMIT_MS", "2000"))
	MEMORY_LIMIT_MB: int = int(os.getenv("MEMORY_LIMIT_MB", "256"))
	CPP_IMAGE: str = os.getenv("CPP_IMAGE", "gcc:13")
	JAVA_IMAGE: str = os.getenv("JAVA_IMAGE", "openjdk:21")
	LEADERBOARD_LIMIT: int = int(os.getenv("LEADERBOARD_LIMIT", "20"))


settings = Settings()

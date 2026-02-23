from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class VerdictEnum(str, enum.Enum):
	AC = "AC"
	WA = "WA"
	TLE = "TLE"
	RE = "RE"
	PD = "PD"  # Pending
	RJ = "RJ"  # Running / Judging


class User(Base):
	__tablename__ = "users"
	id = Column(Integer, primary_key=True, index=True)
	username = Column(String(64), unique=True, nullable=False, index=True)
	password_hash = Column(String(256), nullable=False)
	created_at = Column(DateTime, default=datetime.utcnow)
	submissions = relationship("Submission", back_populates="user")


class Problem(Base):
	__tablename__ = "problems"
	id = Column(Integer, primary_key=True, index=True)
	title = Column(String(200), nullable=False)
	description = Column(Text, nullable=False)
	input_format = Column(Text, nullable=True)
	output_format = Column(Text, nullable=True)
	time_limit_ms = Column(Integer, default=2000)
	memory_limit_mb = Column(Integer, default=256)
	created_at = Column(DateTime, default=datetime.utcnow)
	testcases = relationship("TestCase", back_populates="problem", cascade="all, delete-orphan")
	submissions = relationship("Submission", back_populates="problem")


class TestCase(Base):
	__tablename__ = "testcases"
	id = Column(Integer, primary_key=True, index=True)
	problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
	input_data = Column(Text, nullable=False)
	expected_output = Column(Text, nullable=False)
	is_hidden = Column(Integer, default=1)  # 1 true, 0 false
	problem = relationship("Problem", back_populates="testcases")


class Submission(Base):
	__tablename__ = "submissions"
	id = Column(Integer, primary_key=True, index=True)
	user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
	problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
	language = Column(String(16), nullable=False)  # cpp or java
	source_code = Column(Text, nullable=False)
	verdict = Column(Enum(VerdictEnum), default=VerdictEnum.PD, index=True)
	time_ms = Column(Integer, nullable=True)
	memory_kb = Column(Integer, nullable=True)
	stderr = Column(Text, nullable=True)
	failed_case_id = Column(Integer, ForeignKey("testcases.id"), nullable=True)
	created_at = Column(DateTime, default=datetime.utcnow)
	updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

	user = relationship("User", back_populates="submissions")
	problem = relationship("Problem", back_populates="submissions")
	failed_case = relationship("TestCase")

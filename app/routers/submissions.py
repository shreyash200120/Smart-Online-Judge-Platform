from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.models import Problem, Submission, User
from app.schemas import SubmissionCreate, SubmissionOut
from app.queue import enqueue_submission

router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("/", response_model=SubmissionOut)
def submit_code(payload: SubmissionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
	problem = db.query(Problem).filter(Problem.id == payload.problem_id).first()
	if not problem:
		raise HTTPException(status_code=404, detail="Problem not found")
	if payload.language not in ("cpp", "java"):
		raise HTTPException(status_code=400, detail="Unsupported language")
	sub = Submission(
		user_id=user.id,
		problem_id=problem.id,
		language=payload.language,
		source_code=payload.source_code,
	)
	db.add(sub)
	db.commit()
	db.refresh(sub)
	enqueue_submission(sub.id)
	return sub


@router.get("/", response_model=List[SubmissionOut])
def list_my_submissions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
	return db.query(Submission).filter(Submission.user_id == user.id).order_by(Submission.id.desc()).all()


@router.get("/{submission_id}", response_model=SubmissionOut)
def get_submission(submission_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
	sub = db.query(Submission).filter(Submission.id == submission_id, Submission.user_id == user.id).first()
	if not sub:
		raise HTTPException(status_code=404, detail="Submission not found")
	return sub








from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.models import Problem, TestCase, User
from app.schemas import ProblemCreate, ProblemOut

router = APIRouter(prefix="/problems", tags=["problems"])


@router.post("/", response_model=ProblemOut)
def create_problem(problem_in: ProblemCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
	problem = Problem(
		title=problem_in.title,
		description=problem_in.description,
		input_format=problem_in.input_format,
		output_format=problem_in.output_format,
		time_limit_ms=problem_in.time_limit_ms,
		memory_limit_mb=problem_in.memory_limit_mb,
	)
	db.add(problem)
	db.flush()
	for tc in problem_in.testcases:
		db.add(TestCase(problem_id=problem.id, input_data=tc.input_data, expected_output=tc.expected_output, is_hidden=1 if tc.is_hidden else 0))
	db.commit()
	db.refresh(problem)
	return problem


@router.get("/", response_model=List[ProblemOut])
def list_problems(db: Session = Depends(get_db)):
	return db.query(Problem).order_by(Problem.id.desc()).all()


@router.get("/{problem_id}", response_model=ProblemOut)
def get_problem(problem_id: int, db: Session = Depends(get_db)):
	problem = db.query(Problem).filter(Problem.id == problem_id).first()
	if not problem:
		raise HTTPException(status_code=404, detail="Problem not found")
	return problem


@router.delete("/{problem_id}")
def delete_problem(problem_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
	problem = db.query(Problem).filter(Problem.id == problem_id).first()
	if not problem:
		raise HTTPException(status_code=404, detail="Problem not found")
	db.delete(problem)
	db.commit()
	return {"ok": True}








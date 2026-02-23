from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.deps import get_db
from app.models import Submission, User, Problem, VerdictEnum
from app.config import settings

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
	q = (
		db.query(User.username, func.count(Submission.id).label("accepted"))
		.join(Submission, Submission.user_id == User.id)
		.filter(Submission.verdict == VerdictEnum.AC)
		.group_by(User.id)
		.order_by(func.count(Submission.id).desc())
		.limit(settings.LEADERBOARD_LIMIT)
	)
	return [{"username": u, "accepted": a} for (u, a) in q.all()]


@router.get("/problems")
def problem_stats(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
	# For each problem: total submissions, AC submissions
	q_total = (
		db.query(Problem.id, Problem.title, func.count(Submission.id))
		.outerjoin(Submission, Submission.problem_id == Problem.id)
		.group_by(Problem.id)
	)
	q_ac = (
		db.query(Submission.problem_id, func.count(Submission.id))
		.filter(Submission.verdict == VerdictEnum.AC)
		.group_by(Submission.problem_id)
	).all()
	ac_map = {pid: cnt for (pid, cnt) in q_ac}
	rows = []
	for pid, title, total in q_total.all():
		rows.append({"problem_id": pid, "title": title, "total": total, "accepted": ac_map.get(pid, 0)})
	return rows


@router.get("/users/{username}")
def user_stats(username: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
	user = db.query(User).filter(User.username == username).first()
	if not user:
		return {"username": username, "total": 0, "accepted": 0}
	q_total = db.query(func.count(Submission.id)).filter(Submission.user_id == user.id)
	q_ac = db.query(func.count(Submission.id)).filter(Submission.user_id == user.id, Submission.verdict == VerdictEnum.AC)
	return {"username": user.username, "total": q_total.scalar() or 0, "accepted": q_ac.scalar() or 0}








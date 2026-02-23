from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import SessionLocal
from app.models import Submission, Problem, TestCase, VerdictEnum
from app.config import settings
from worker.runner import compile_and_run_cpp, compile_and_run_java


def judge_submission(submission_id: int) -> None:
	b: Session = SessionLocal()
	try:
		sub = b.get(Submission, submission_id)
		if not sub:
			return
		problem = b.get(Problem, sub.problem_id)
		if not problem:
			return
		sub.verdict = VerdictEnum.RJ
		b.commit()

		time_limit = problem.time_limit_ms or settings.TIME_LIMIT_MS
		mem_limit = problem.memory_limit_mb or settings.MEMORY_LIMIT_MB

		cases = b.execute(select(TestCase).where(TestCase.problem_id == problem.id).order_by(TestCase.id)).scalars().all()
		for case in cases:
			if sub.language == "cpp":
				code, out, err = compile_and_run_cpp(sub.source_code, case.input_data, time_limit, mem_limit)
			elif sub.language == "java":
				code, out, err = compile_and_run_java(sub.source_code, case.input_data, time_limit, mem_limit)
			else:
				sub.verdict = VerdictEnum.RE
				sub.stderr = "Unsupported language"
				break

			if code == 124:
				sub.verdict = VerdictEnum.TLE
				sub.stderr = "Time Limit Exceeded"
				sub.failed_case_id = case.id
				b.commit()
				break
			elif code != 0:
				sub.verdict = VerdictEnum.RE
				sub.stderr = err[:5000]
				sub.failed_case_id = case.id
				b.commit()
				break

			expected = (case.expected_output or "").strip()
			actual = (out or "").strip()
			if expected != actual:
				sub.verdict = VerdictEnum.WA
				sub.stderr = make_diff(expected, actual)
				sub.failed_case_id = case.id
				b.commit()
				break
		else:
			sub.verdict = VerdictEnum.AC
			b.commit()
	finally:
		b.close()


def make_diff(expected: str, actual: str) -> str:
	# Simple line diff to explain mismatch
	ex_lines = expected.splitlines()
	ac_lines = actual.splitlines()
	lines = []
	for i in range(max(len(ex_lines), len(ac_lines))):
		e = ex_lines[i] if i < len(ex_lines) else "<no line>"
		a = ac_lines[i] if i < len(ac_lines) else "<no line>"
		if e != a:
			lines.append(f"Line {i+1}: expected=<{e}> actual=<{a}>")
	return "\n".join(lines)[:5000]

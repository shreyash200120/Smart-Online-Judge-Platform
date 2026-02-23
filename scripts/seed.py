import os
from app.database import SessionLocal, engine, Base
from app.models import Problem, TestCase

problems = [
	{
		"title": "A + B",
		"description": "Read two integers and output their sum.",
		"input_format": "Two integers a and b",
		"output_format": "Single integer a+b",
		"tests": [
			{"in": "1 2\n", "out": "3\n", "hidden": False},
			{"in": "-5 10\n", "out": "5\n", "hidden": True},
		],
	},
	{
		"title": "Factorial",
		"description": "Compute n! for 0 <= n <= 12.",
		"input_format": "Integer n",
		"output_format": "n!",
		"tests": [
			{"in": "5\n", "out": "120\n", "hidden": False},
			{"in": "0\n", "out": "1\n", "hidden": True},
		],
	},
	{
		"title": "Palindrome String",
		"description": "Check if a string is a palindrome (case-sensitive).",
		"input_format": "Single string s",
		"output_format": "YES or NO",
		"tests": [
			{"in": "aba\n", "out": "YES\n", "hidden": False},
			{"in": "abc\n", "out": "NO\n", "hidden": True},
		],
	},
	{
		"title": "Maximum of Array",
		"description": "Given n and an array of n integers, output the maximum.",
		"input_format": "n then n integers",
		"output_format": "max value",
		"tests": [
			{"in": "5\n1 3 2 9 4\n", "out": "9\n", "hidden": False},
			{"in": "3\n-5 -2 -9\n", "out": "-2\n", "hidden": True},
		],
	},
	{
		"title": "Fibonacci",
		"description": "Output the n-th Fibonacci number (0-indexed) for 0<=n<=30.",
		"input_format": "Integer n",
		"output_format": "F(n)",
		"tests": [
			{"in": "7\n", "out": "13\n", "hidden": False},
			{"in": "10\n", "out": "55\n", "hidden": True},
		],
	},
]


def run():
	Base.metadata.create_all(bind=engine)
	b = SessionLocal()
	try:
		for p in problems:
			prob = Problem(
				title=p["title"],
				description=p["description"],
				input_format=p["input_format"],
				output_format=p["output_format"],
			)
			b.add(prob)
			b.flush()
			for t in p["tests"]:
				b.add(TestCase(problem_id=prob.id, input_data=t["in"], expected_output=t["out"], is_hidden=1 if t["hidden"] else 0))
			b.commit()
	finally:
		b.close()


if __name__ == "__main__":
	run()








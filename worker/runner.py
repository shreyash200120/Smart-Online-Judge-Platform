import subprocess
import tempfile
from pathlib import Path
from typing import Tuple
from app.config import settings

# Returns (exit_code, stdout, stderr)
def run_docker(image: str, workdir: Path, cmd: list[str], time_limit_ms: int, memory_limit_mb: int) -> Tuple[int, str, str]:
	mem_limit = f"{memory_limit_mb}m"
	try:
		proc = subprocess.run(
			[
				"docker", "run", "--rm",
				"-m", mem_limit,
				"--cpus", "1.0",
				"-v", f"{workdir}:/work",
				"-w", "/work",
				image,
				*cmd,
			],
			stdout=subprocess.PIPE,
			stderr=subprocess.PIPE,
			text=True,
			timeout=max(1, int(time_limit_ms / 1000) + 1),
		)
		return proc.returncode, proc.stdout, proc.stderr
	except subprocess.TimeoutExpired:
		return 124, "", "Time Limit Exceeded"


def compile_and_run_cpp(source: str, input_data: str, time_limit_ms: int, memory_limit_mb: int) -> Tuple[int, str, str]:
	with tempfile.TemporaryDirectory() as tmpdir:
		workdir = Path(tmpdir)
		(workdir / "Main.cpp").write_text(source, encoding="utf-8")
		code, out, err = run_docker(settings.CPP_IMAGE, workdir, ["bash", "-lc", "g++ -O2 -std=c++17 Main.cpp -o Main"], time_limit_ms, memory_limit_mb)
		if code != 0:
			return code, out, err
		(workdir / "input.txt").write_text(input_data, encoding="utf-8")
		code, out, err = run_docker(settings.CPP_IMAGE, workdir, ["bash", "-lc", "./Main < input.txt"], time_limit_ms, memory_limit_mb)
		return code, out, err


def compile_and_run_java(source: str, input_data: str, time_limit_ms: int, memory_limit_mb: int) -> Tuple[int, str, str]:
	with tempfile.TemporaryDirectory() as tmpdir:
		workdir = Path(tmpdir)
		(workdir / "Main.java").write_text(source, encoding="utf-8")
		code, out, err = run_docker(settings.JAVA_IMAGE, workdir, ["bash", "-lc", "javac Main.java"], time_limit_ms, memory_limit_mb)
		if code != 0:
			return code, out, err
		(workdir / "input.txt").write_text(input_data, encoding="utf-8")
		code, out, err = run_docker(settings.JAVA_IMAGE, workdir, ["bash", "-lc", "java Main < input.txt"], time_limit_ms, memory_limit_mb)
		return code, out, err

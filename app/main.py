from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, problems, submissions
from app.routers import leaderboard as leaderboard_router

app = FastAPI(title="Online Judge")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
	Base.metadata.create_all(bind=engine)


app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(submissions.router)
app.include_router(leaderboard_router.router)


@app.get("/")
def root():
	return {"message": "OJ API running"}


@app.get("/health")
def health():
	return {"ok": True}

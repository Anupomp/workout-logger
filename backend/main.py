from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
import time

from db import engine, SessionLocal
from models import Base
from routers import auth, exercises, workouts, coach
from routers.exercises import seed_exercises

# Create all tables on startup (retry while Postgres finishes booting)
for attempt in range(10):
    try:
        Base.metadata.create_all(bind=engine)
        break
    except OperationalError:
        if attempt == 9:
            raise
        time.sleep(2)

app = FastAPI(
    title="Workout Logger + AI Coach",
    description="Log workouts, track PRs, and get AI-generated training plans.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(exercises.router)
app.include_router(workouts.router)
app.include_router(coach.router)


@app.on_event("startup")
def on_startup():
    db: Session = SessionLocal()
    try:
        seed_exercises(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}

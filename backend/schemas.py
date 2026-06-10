from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import MuscleGroup


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None


# ── Exercises ─────────────────────────────────────────────────────────────────

class ExerciseCreate(BaseModel):
    name: str
    muscle_group: MuscleGroup
    equipment: Optional[str] = None
    is_compound: bool = False
    tracks_weight: bool = True
    tracks_reps: bool = True
    tracks_time: bool = False
    tracks_rpe: bool = True

class ExerciseOut(BaseModel):
    id: int
    name: str
    muscle_group: MuscleGroup
    equipment: Optional[str]
    is_compound: bool
    instructions: Optional[str]
    tracks_weight: bool
    tracks_reps: bool
    tracks_time: bool
    tracks_rpe: bool
    created_by: Optional[int] = None
    class Config:
        from_attributes = True


# ── Workout Sets ──────────────────────────────────────────────────────────────

class SetCreate(BaseModel):
    exercise_id: int
    set_number: int
    reps: Optional[int] = None
    weight_lbs: Optional[float] = None
    duration_seconds: Optional[int] = None
    rpe: Optional[float] = None
    notes: Optional[str] = None

class SetOut(BaseModel):
    id: int
    exercise_id: int
    set_number: int
    reps: Optional[int]
    weight_lbs: Optional[float]
    duration_seconds: Optional[int]
    rpe: Optional[float]
    notes: Optional[str]
    exercise: ExerciseOut
    class Config:
        from_attributes = True


# ── Workouts ──────────────────────────────────────────────────────────────────

class WorkoutCreate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    duration_minutes: Optional[int] = None
    sets: List[SetCreate] = []

class WorkoutOut(BaseModel):
    id: int
    name: Optional[str]
    notes: Optional[str]
    date: datetime
    duration_minutes: Optional[int]
    sets: List[SetOut] = []
    class Config:
        from_attributes = True

class WorkoutSummary(BaseModel):
    id: int
    name: Optional[str]
    date: datetime
    duration_minutes: Optional[int]
    set_count: int
    class Config:
        from_attributes = True


# ── Personal Records ──────────────────────────────────────────────────────────

class PROut(BaseModel):
    id: int
    exercise_id: int
    weight_lbs: float
    reps: int
    achieved_at: datetime
    exercise: ExerciseOut
    class Config:
        from_attributes = True


# ── Progress ──────────────────────────────────────────────────────────────────

class ProgressPoint(BaseModel):
    date: datetime
    top_weight_lbs: float
    reps: int
    estimated_1rm: float


# ── AI Coach ──────────────────────────────────────────────────────────────────

class CoachRequest(BaseModel):
    goal: str                           # e.g. "build strength", "lose fat", "improve endurance"
    days_per_week: int = 4
    additional_notes: Optional[str] = None
    provider: str = "anthropic"         # "openai" | "anthropic" | "gemini"
    api_key: str                        # user-supplied key — used once, never stored or logged

class CoachResponse(BaseModel):
    plan: str
    generated_at: datetime


# ── Workout Update ─────────────────────────────────────────────────────────────

class WorkoutUpdate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    duration_minutes: Optional[int] = None
    sets: List[SetCreate] = []

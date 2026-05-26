from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from db import get_db
from models import Exercise, MuscleGroup
from schemas import ExerciseOut
from auth import get_current_user

router = APIRouter(prefix="/exercises", tags=["exercises"])

SEED_EXERCISES = [
    # Chest
    {"name": "Barbell Bench Press", "muscle_group": MuscleGroup.chest, "equipment": "barbell", "is_compound": True},
    {"name": "Dumbbell Bench Press", "muscle_group": MuscleGroup.chest, "equipment": "dumbbell", "is_compound": True},
    {"name": "Incline Barbell Press", "muscle_group": MuscleGroup.chest, "equipment": "barbell", "is_compound": True},
    {"name": "Cable Fly", "muscle_group": MuscleGroup.chest, "equipment": "cable", "is_compound": False},
    {"name": "Push-Up", "muscle_group": MuscleGroup.chest, "equipment": "bodyweight", "is_compound": True},
    # Back
    {"name": "Deadlift", "muscle_group": MuscleGroup.back, "equipment": "barbell", "is_compound": True},
    {"name": "Pull-Up", "muscle_group": MuscleGroup.back, "equipment": "bodyweight", "is_compound": True},
    {"name": "Barbell Row", "muscle_group": MuscleGroup.back, "equipment": "barbell", "is_compound": True},
    {"name": "Lat Pulldown", "muscle_group": MuscleGroup.back, "equipment": "cable", "is_compound": False},
    {"name": "Seated Cable Row", "muscle_group": MuscleGroup.back, "equipment": "cable", "is_compound": False},
    {"name": "Face Pull", "muscle_group": MuscleGroup.back, "equipment": "cable", "is_compound": False},
    # Shoulders
    {"name": "Overhead Press", "muscle_group": MuscleGroup.shoulders, "equipment": "barbell", "is_compound": True},
    {"name": "Dumbbell Lateral Raise", "muscle_group": MuscleGroup.shoulders, "equipment": "dumbbell", "is_compound": False},
    {"name": "Dumbbell Shoulder Press", "muscle_group": MuscleGroup.shoulders, "equipment": "dumbbell", "is_compound": True},
    {"name": "Arnold Press", "muscle_group": MuscleGroup.shoulders, "equipment": "dumbbell", "is_compound": True},
    # Legs
    {"name": "Barbell Squat", "muscle_group": MuscleGroup.legs, "equipment": "barbell", "is_compound": True},
    {"name": "Romanian Deadlift", "muscle_group": MuscleGroup.legs, "equipment": "barbell", "is_compound": True},
    {"name": "Leg Press", "muscle_group": MuscleGroup.legs, "equipment": "machine", "is_compound": True},
    {"name": "Leg Extension", "muscle_group": MuscleGroup.legs, "equipment": "machine", "is_compound": False},
    {"name": "Leg Curl", "muscle_group": MuscleGroup.legs, "equipment": "machine", "is_compound": False},
    {"name": "Calf Raise", "muscle_group": MuscleGroup.legs, "equipment": "machine", "is_compound": False},
    {"name": "Bulgarian Split Squat", "muscle_group": MuscleGroup.legs, "equipment": "dumbbell", "is_compound": True},
    # Glutes
    {"name": "Hip Thrust", "muscle_group": MuscleGroup.glutes, "equipment": "barbell", "is_compound": True},
    {"name": "Cable Kickback", "muscle_group": MuscleGroup.glutes, "equipment": "cable", "is_compound": False},
    # Biceps
    {"name": "Barbell Curl", "muscle_group": MuscleGroup.biceps, "equipment": "barbell", "is_compound": False},
    {"name": "Dumbbell Curl", "muscle_group": MuscleGroup.biceps, "equipment": "dumbbell", "is_compound": False},
    {"name": "Hammer Curl", "muscle_group": MuscleGroup.biceps, "equipment": "dumbbell", "is_compound": False},
    {"name": "Cable Curl", "muscle_group": MuscleGroup.biceps, "equipment": "cable", "is_compound": False},
    # Triceps
    {"name": "Tricep Pushdown", "muscle_group": MuscleGroup.triceps, "equipment": "cable", "is_compound": False},
    {"name": "Skull Crusher", "muscle_group": MuscleGroup.triceps, "equipment": "barbell", "is_compound": False},
    {"name": "Overhead Tricep Extension", "muscle_group": MuscleGroup.triceps, "equipment": "dumbbell", "is_compound": False},
    {"name": "Close-Grip Bench Press", "muscle_group": MuscleGroup.triceps, "equipment": "barbell", "is_compound": True},
    # Core
    {"name": "Plank", "muscle_group": MuscleGroup.core, "equipment": "bodyweight", "is_compound": False},
    {"name": "Ab Wheel Rollout", "muscle_group": MuscleGroup.core, "equipment": "bodyweight", "is_compound": False},
    {"name": "Cable Crunch", "muscle_group": MuscleGroup.core, "equipment": "cable", "is_compound": False},
    # Cardio
    {"name": "Treadmill Run", "muscle_group": MuscleGroup.cardio, "equipment": "machine", "is_compound": False},
    {"name": "Stationary Bike", "muscle_group": MuscleGroup.cardio, "equipment": "machine", "is_compound": False},
    {"name": "Jump Rope", "muscle_group": MuscleGroup.cardio, "equipment": "bodyweight", "is_compound": False},
]


def seed_exercises(db: Session):
    """Call on startup to populate the exercise library if empty."""
    if db.query(Exercise).count() == 0:
        for ex in SEED_EXERCISES:
            db.add(Exercise(**ex))
        db.commit()


@router.get("/", response_model=List[ExerciseOut])
def list_exercises(
    muscle_group: Optional[MuscleGroup] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Exercise)
    if muscle_group:
        q = q.filter(Exercise.muscle_group == muscle_group)
    if search:
        q = q.filter(Exercise.name.ilike(f"%{search}%"))
    return q.order_by(Exercise.name).all()


@router.get("/{exercise_id}", response_model=ExerciseOut)
def get_exercise(exercise_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Exercise not found")
    return ex

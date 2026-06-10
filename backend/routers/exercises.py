from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional

from db import get_db
from models import Exercise, MuscleGroup, User, WorkoutSet
from schemas import ExerciseOut, ExerciseCreate
from auth import get_current_user

router = APIRouter(prefix="/exercises", tags=["exercises"])

# Tracking profiles:
#   default          -> weight + reps + RPE (standard lifting)
#   REPS_ONLY        -> reps + RPE (bodyweight: push-ups, pull-ups, ab wheel)
#   TIME_ONLY        -> time + RPE (cardio, planks)
REPS_ONLY = {"tracks_weight": False, "tracks_reps": True, "tracks_time": False, "tracks_rpe": True}
TIME_ONLY = {"tracks_weight": False, "tracks_reps": False, "tracks_time": True, "tracks_rpe": True}

SEED_EXERCISES = [
    # Chest
    {"name": "Barbell Bench Press", "muscle_group": MuscleGroup.chest, "equipment": "barbell", "is_compound": True},
    {"name": "Dumbbell Bench Press", "muscle_group": MuscleGroup.chest, "equipment": "dumbbell", "is_compound": True},
    {"name": "Incline Barbell Press", "muscle_group": MuscleGroup.chest, "equipment": "barbell", "is_compound": True},
    {"name": "Cable Fly", "muscle_group": MuscleGroup.chest, "equipment": "cable", "is_compound": False},
    {"name": "Push-Up", "muscle_group": MuscleGroup.chest, "equipment": "bodyweight", "is_compound": True, **REPS_ONLY},
    # Back
    {"name": "Deadlift", "muscle_group": MuscleGroup.back, "equipment": "barbell", "is_compound": True},
    {"name": "Pull-Up", "muscle_group": MuscleGroup.back, "equipment": "bodyweight", "is_compound": True, **REPS_ONLY},
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
    {"name": "Plank", "muscle_group": MuscleGroup.core, "equipment": "bodyweight", "is_compound": False, **TIME_ONLY},
    {"name": "Ab Wheel Rollout", "muscle_group": MuscleGroup.core, "equipment": "bodyweight", "is_compound": False, **REPS_ONLY},
    {"name": "Cable Crunch", "muscle_group": MuscleGroup.core, "equipment": "cable", "is_compound": False},
    # Cardio
    {"name": "Treadmill Run", "muscle_group": MuscleGroup.cardio, "equipment": "machine", "is_compound": False, **TIME_ONLY},
    {"name": "Stationary Bike", "muscle_group": MuscleGroup.cardio, "equipment": "machine", "is_compound": False, **TIME_ONLY},
    {"name": "Jump Rope", "muscle_group": MuscleGroup.cardio, "equipment": "bodyweight", "is_compound": False, **TIME_ONLY},
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
    current_user: User = Depends(get_current_user),
):
    # Built-in library + this user's custom exercises only
    q = db.query(Exercise).filter(
        or_(Exercise.created_by.is_(None), Exercise.created_by == current_user.id)
    )
    if muscle_group:
        q = q.filter(Exercise.muscle_group == muscle_group)
    if search:
        q = q.filter(Exercise.name.ilike(f"%{search}%"))
    return q.order_by(Exercise.name).all()


@router.post("/", response_model=ExerciseOut, status_code=status.HTTP_201_CREATED)
def create_exercise(
    exercise_in: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    name = exercise_in.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Exercise name is required.")
    if not (exercise_in.tracks_weight or exercise_in.tracks_reps or exercise_in.tracks_time):
        raise HTTPException(status_code=400, detail="Track at least one of: weight, reps, or time.")
    if exercise_in.tracks_weight and not exercise_in.tracks_reps:
        raise HTTPException(status_code=400, detail="Weight tracking requires reps tracking (for PR detection).")

    # Unique among built-ins + this user's customs (case-insensitive)
    existing = (
        db.query(Exercise)
        .filter(
            func.lower(Exercise.name) == name.lower(),
            or_(Exercise.created_by.is_(None), Exercise.created_by == current_user.id),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="An exercise with that name already exists.")

    ex = Exercise(
        name=name,
        muscle_group=exercise_in.muscle_group,
        equipment=exercise_in.equipment,
        is_compound=exercise_in.is_compound,
        tracks_weight=exercise_in.tracks_weight,
        tracks_reps=exercise_in.tracks_reps,
        tracks_time=exercise_in.tracks_time,
        tracks_rpe=exercise_in.tracks_rpe,
        created_by=current_user.id,
    )
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return ex


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Exercise not found")
    if ex.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own custom exercises.")
    in_use = db.query(WorkoutSet).filter(WorkoutSet.exercise_id == exercise_id).first()
    if in_use:
        raise HTTPException(status_code=400, detail="This exercise has logged sets. Delete those workouts first.")
    db.delete(ex)
    db.commit()


@router.get("/{exercise_id}", response_model=ExerciseOut)
def get_exercise(exercise_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return ex

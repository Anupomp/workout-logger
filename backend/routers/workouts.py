from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from db import get_db
from models import User, Workout, WorkoutSet, PersonalRecord
from schemas import WorkoutCreate, WorkoutOut, WorkoutSummary, PROut
from auth import get_current_user

router = APIRouter(prefix="/workouts", tags=["workouts"])


def check_and_update_prs(db: Session, user_id: int, new_sets: List[WorkoutSet]) -> List[PersonalRecord]:
    """After logging, auto-detect any new personal records."""
    new_prs = []
    for s in new_sets:
        if s.weight_lbs is None or s.reps is None:
            continue
        existing = (
            db.query(PersonalRecord)
            .filter(PersonalRecord.user_id == user_id, PersonalRecord.exercise_id == s.exercise_id)
            .order_by(PersonalRecord.weight_lbs.desc())
            .first()
        )
        if existing is None or s.weight_lbs > existing.weight_lbs:
            pr = PersonalRecord(
                user_id=user_id,
                exercise_id=s.exercise_id,
                weight_lbs=s.weight_lbs,
                reps=s.reps,
                workout_set_id=s.id,
            )
            db.add(pr)
            new_prs.append(pr)
    db.commit()
    return new_prs


@router.post("/", response_model=WorkoutOut, status_code=status.HTTP_201_CREATED)
def create_workout(
    workout_in: WorkoutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workout = Workout(
        user_id=current_user.id,
        name=workout_in.name,
        notes=workout_in.notes,
        duration_minutes=workout_in.duration_minutes,
    )
    db.add(workout)
    db.flush()  # get workout.id before adding sets

    sets = []
    for s in workout_in.sets:
        ws = WorkoutSet(
            workout_id=workout.id,
            exercise_id=s.exercise_id,
            set_number=s.set_number,
            reps=s.reps,
            weight_lbs=s.weight_lbs,
            rpe=s.rpe,
            notes=s.notes,
        )
        db.add(ws)
        sets.append(ws)

    db.commit()
    db.refresh(workout)

    # PR detection runs after commit so IDs are assigned
    check_and_update_prs(db, current_user.id, sets)

    return db.query(Workout).options(
        joinedload(Workout.sets).joinedload(WorkoutSet.exercise)
    ).filter(Workout.id == workout.id).first()


@router.get("/", response_model=List[WorkoutSummary])
def list_workouts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workouts = (
        db.query(Workout)
        .filter(Workout.user_id == current_user.id)
        .order_by(Workout.date.desc())
        .all()
    )
    return [
        WorkoutSummary(
            id=w.id,
            name=w.name,
            date=w.date,
            duration_minutes=w.duration_minutes,
            set_count=len(w.sets),
        )
        for w in workouts
    ]


@router.get("/{workout_id}", response_model=WorkoutOut)
def get_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workout = (
        db.query(Workout)
        .options(joinedload(Workout.sets).joinedload(WorkoutSet.exercise))
        .filter(Workout.id == workout_id, Workout.user_id == current_user.id)
        .first()
    )
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout


@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workout = db.query(Workout).filter(
        Workout.id == workout_id, Workout.user_id == current_user.id
    ).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    db.delete(workout)
    db.commit()


@router.get("/prs/all", response_model=List[PROut])
def get_personal_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(PersonalRecord)
        .options(joinedload(PersonalRecord.exercise))
        .filter(PersonalRecord.user_id == current_user.id)
        .order_by(PersonalRecord.achieved_at.desc())
        .all()
    )

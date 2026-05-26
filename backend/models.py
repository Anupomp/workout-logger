from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from db import Base


class MuscleGroup(str, enum.Enum):
    chest = "chest"
    back = "back"
    shoulders = "shoulders"
    biceps = "biceps"
    triceps = "triceps"
    legs = "legs"
    glutes = "glutes"
    core = "core"
    full_body = "full_body"
    cardio = "cardio"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    workouts = relationship("Workout", back_populates="user", cascade="all, delete")
    personal_records = relationship("PersonalRecord", back_populates="user", cascade="all, delete")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    muscle_group = Column(Enum(MuscleGroup), nullable=False)
    equipment = Column(String, nullable=True)        # barbell, dumbbell, cable, bodyweight, etc.
    is_compound = Column(Boolean, default=False)
    instructions = Column(Text, nullable=True)

    sets = relationship("WorkoutSet", back_populates="exercise")
    personal_records = relationship("PersonalRecord", back_populates="exercise")


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=True)             # e.g. "Push Day", "Leg Day"
    notes = Column(Text, nullable=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    duration_minutes = Column(Integer, nullable=True)

    user = relationship("User", back_populates="workouts")
    sets = relationship("WorkoutSet", back_populates="workout", cascade="all, delete")


class WorkoutSet(Base):
    __tablename__ = "workout_sets"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    set_number = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=True)
    weight_lbs = Column(Float, nullable=True)        # None = bodyweight
    rpe = Column(Float, nullable=True)               # Rate of Perceived Exertion (1-10)
    notes = Column(String, nullable=True)

    workout = relationship("Workout", back_populates="sets")
    exercise = relationship("Exercise", back_populates="sets")


class PersonalRecord(Base):
    __tablename__ = "personal_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    weight_lbs = Column(Float, nullable=False)
    reps = Column(Integer, nullable=False)
    achieved_at = Column(DateTime(timezone=True), server_default=func.now())
    workout_set_id = Column(Integer, ForeignKey("workout_sets.id", ondelete="SET NULL"), nullable=True)

    user = relationship("User", back_populates="personal_records")
    exercise = relationship("Exercise", back_populates="personal_records")

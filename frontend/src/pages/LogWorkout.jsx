import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getExercises, createWorkout, createExercise, deleteExercise } from "../api/client";
import { useAuth } from "../components/AuthContext";

const MUSCLE_GROUPS = ["chest", "back", "shoulders", "biceps", "triceps", "legs", "glutes", "core", "full_body", "cardio"];

export default function LogWorkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState("");
  const [workoutName, setWorkoutName] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [sets, setSets] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Custom exercise form
  const [showCreate, setShowCreate] = useState(false);
  const [newEx, setNewEx] = useState({
    name: "", muscle_group: "chest", equipment: "",
    tracks_weight: true, tracks_reps: true, tracks_time: false, tracks_rpe: true,
  });
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const loadExercises = () => getExercises({ search: search || undefined }).then((r) => setExercises(r.data));
  useEffect(() => { loadExercises(); }, [search]);

  const addSet = (exercise) => {
    setSets((prev) => [
      ...prev,
      {
        exercise, exercise_id: exercise.id,
        set_number: prev.filter((s) => s.exercise_id === exercise.id).length + 1,
        reps: "", weight_lbs: "", time_min: "", rpe: "",
      },
    ]);
  };

  const updateSet = (idx, field, value) => {
    setSets((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const removeSet = (idx) => setSets((prev) => prev.filter((_, i) => i !== idx));

  const handleCreateExercise = async () => {
    if (!newEx.name.trim()) { setCreateError("Name is required."); return; }
    if (!newEx.tracks_weight && !newEx.tracks_reps && !newEx.tracks_time) {
      setCreateError("Track at least one of: weight, reps, or time."); return;
    }
    if (newEx.tracks_weight && !newEx.tracks_reps) {
      setCreateError("Weight tracking requires reps (for PR detection)."); return;
    }
    setCreating(true); setCreateError("");
    try {
      await createExercise({ ...newEx, equipment: newEx.equipment || null });
      setNewEx({ name: "", muscle_group: "chest", equipment: "", tracks_weight: true, tracks_reps: true, tracks_time: false, tracks_rpe: true });
      setShowCreate(false);
      loadExercises();
    } catch (err) {
      setCreateError(err.response?.data?.detail || "Failed to create exercise.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteExercise = async (ex) => {
    try {
      await deleteExercise(ex.id);
      loadExercises();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete exercise.");
    }
  };

  const handleSave = async () => {
    if (sets.length === 0) { setError("Add at least one set."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        name: workoutName || null,
        notes: notes || null,
        duration_minutes: duration ? parseInt(duration) : null,
        sets: sets.map((s) => ({
          exercise_id: s.exercise_id,
          set_number: s.set_number,
          reps: s.reps !== "" ? parseInt(s.reps) : null,
          weight_lbs: s.weight_lbs !== "" ? parseFloat(s.weight_lbs) : null,
          duration_seconds: s.time_min !== "" ? Math.round(parseFloat(s.time_min) * 60) : null,
          rpe: s.rpe !== "" ? parseFloat(s.rpe) : null,
        })),
      };
      await createWorkout(payload);
      navigate("/");
    } catch {
      setError("Failed to save workout. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const checkbox = (field, label) => (
    <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--color-text-primary)", cursor: "pointer" }}>
      <input
        type="checkbox"
        checked={newEx[field]}
        onChange={(e) => setNewEx((p) => ({ ...p, [field]: e.target.checked }))}
      />
      {label}
    </label>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: "1.5rem" }}>Log workout</h1>

      {/* Workout meta */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div>
          <label style={labelStyle}>Session name (optional)</label>
          <input value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} placeholder="Push day, Leg day..." style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Duration (min)</label>
          <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="60" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Felt great..." style={inputStyle} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem" }}>
        {/* Exercise picker */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Exercise library</h2>
            <button onClick={() => { setShowCreate(!showCreate); setCreateError(""); }} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, border: "1px solid var(--color-border-secondary)", background: "none", cursor: "pointer", color: "var(--color-text-info)" }}>
              {showCreate ? "Close" : "+ Custom"}
            </button>
          </div>

          {/* Custom exercise creator */}
          {showCreate && (
            <div style={{ border: "1px solid var(--color-border-info)", background: "var(--color-background-info)", borderRadius: 8, padding: "0.75rem", marginBottom: "0.75rem" }}>
              <input
                value={newEx.name}
                onChange={(e) => setNewEx((p) => ({ ...p, name: e.target.value }))}
                placeholder="Exercise name (e.g. Weighted Pull-Up)"
                style={{ ...inputStyle, marginBottom: "0.5rem" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.6rem" }}>
                <select
                  value={newEx.muscle_group}
                  onChange={(e) => setNewEx((p) => ({ ...p, muscle_group: e.target.value }))}
                  style={{ ...inputStyle, textTransform: "capitalize" }}
                >
                  {MUSCLE_GROUPS.map((mg) => (
                    <option key={mg} value={mg}>{mg.replace("_", " ")}</option>
                  ))}
                </select>
                <input
                  value={newEx.equipment}
                  onChange={(e) => setNewEx((p) => ({ ...p, equipment: e.target.value }))}
                  placeholder="Equipment (optional)"
                  style={inputStyle}
                />
              </div>
              <p style={{ margin: "0 0 0.35rem", fontSize: 11, color: "var(--color-text-secondary)" }}>What do you want to log?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.6rem" }}>
                {checkbox("tracks_weight", "Weight")}
                {checkbox("tracks_reps", "Reps")}
                {checkbox("tracks_time", "Time")}
                {checkbox("tracks_rpe", "RPE")}
              </div>
              {createError && <p style={{ color: "var(--color-text-danger)", fontSize: 12, margin: "0 0 0.5rem" }}>{createError}</p>}
              <button onClick={handleCreateExercise} disabled={creating} style={{ padding: "0.45rem 1rem", borderRadius: 6, border: "none", background: "var(--color-text-info)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                {creating ? "Creating..." : "Create exercise"}
              </button>
            </div>
          )}

          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises..." style={{ ...inputStyle, marginBottom: "0.75rem" }} />
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {exercises.map((ex) => {
              const isCustom = ex.created_by != null;
              const metrics = [
                ex.tracks_weight && "weight",
                ex.tracks_reps && "reps",
                ex.tracks_time && "time",
                ex.tracks_rpe && "RPE",
              ].filter(Boolean).join(" · ");
              return (
                <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--color-border-tertiary)" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
                      {ex.name}
                      {isCustom && <span style={{ marginLeft: 6, fontSize: 10, padding: "1px 6px", borderRadius: 8, background: "var(--color-background-info)", color: "var(--color-text-info)", border: "1px solid var(--color-border-info)" }}>custom</span>}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>
                      {ex.muscle_group.replace("_", " ")}{ex.equipment ? ` · ${ex.equipment}` : ""}
                      <span style={{ textTransform: "none" }}> · logs: {metrics}</span>
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                    {isCustom && ex.created_by === user?.id && (
                      <button onClick={() => handleDeleteExercise(ex)} title="Delete custom exercise" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--color-text-danger)", padding: "0 2px" }}>×</button>
                    )}
                    <button onClick={() => addSet(ex)} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid var(--color-border-secondary)", background: "none", cursor: "pointer", fontSize: 13, color: "var(--color-text-primary)" }}>+ Add</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Set builder */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: "0.75rem" }}>Sets logged ({sets.length})</h2>
          {sets.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Click "+ Add" on an exercise to get started.</p>
          ) : (
            sets.map((s, idx) => (
              <div key={idx} style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <p style={{ flex: 1, margin: 0, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.exercise.name} <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>#{s.set_number}</span>
                </p>
                {s.exercise.tracks_weight && (
                  <input type="number" placeholder="lbs" value={s.weight_lbs} onChange={(e) => updateSet(idx, "weight_lbs", e.target.value)} style={{ ...miniInput, width: 70 }} />
                )}
                {s.exercise.tracks_reps && (
                  <input type="number" placeholder="Reps" value={s.reps} onChange={(e) => updateSet(idx, "reps", e.target.value)} style={{ ...miniInput, width: 65 }} />
                )}
                {s.exercise.tracks_time && (
                  <input type="number" placeholder="Min" step="0.5" min="0" value={s.time_min} onChange={(e) => updateSet(idx, "time_min", e.target.value)} style={{ ...miniInput, width: 60 }} />
                )}
                {s.exercise.tracks_rpe && (
                  <input type="number" placeholder="RPE" step="0.5" min="1" max="10" value={s.rpe} onChange={(e) => updateSet(idx, "rpe", e.target.value)} style={{ ...miniInput, width: 55 }} />
                )}
                <button onClick={() => removeSet(idx)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--color-text-danger)", padding: 0 }}>×</button>
              </div>
            ))
          )}
        </div>
      </div>

      {error && <p style={{ color: "var(--color-text-danger)", fontSize: 13, marginTop: "0.75rem" }}>{error}</p>}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: "0.65rem 1.5rem", borderRadius: 8, border: "none", background: "var(--color-text-primary)", color: "var(--color-background-primary)", fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
          {saving ? "Saving..." : "Save workout"}
        </button>
        <button onClick={() => navigate("/")} style={{ padding: "0.65rem 1.5rem", borderRadius: 8, border: "1px solid var(--color-border-secondary)", background: "none", cursor: "pointer", fontSize: 14, color: "var(--color-text-primary)" }}>Cancel</button>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 3 };
const inputStyle = { width: "100%", padding: "0.55rem 0.75rem", borderRadius: 8, border: "1px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", fontSize: 13, color: "var(--color-text-primary)", boxSizing: "border-box" };
const miniInput = { padding: "0.4rem 0.4rem", borderRadius: 6, border: "1px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", fontSize: 12, color: "var(--color-text-primary)", boxSizing: "border-box" };
const cardStyle = { background: "var(--color-background-secondary)", borderRadius: 12, padding: "1.25rem", border: "1px solid var(--color-border-tertiary)" };

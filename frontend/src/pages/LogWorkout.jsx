import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getExercises, createWorkout } from "../api/client";

export default function LogWorkout() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState("");
  const [workoutName, setWorkoutName] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [sets, setSets] = useState([]);   // [{ exercise, set_number, reps, weight_lbs, rpe }]
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getExercises({ search: search || undefined }).then((r) => setExercises(r.data));
  }, [search]);

  const addSet = (exercise) => {
    setSets((prev) => [
      ...prev,
      { exercise, exercise_id: exercise.id, set_number: prev.filter((s) => s.exercise_id === exercise.id).length + 1, reps: "", weight_lbs: "", rpe: "" },
    ]);
  };

  const updateSet = (idx, field, value) => {
    setSets((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const removeSet = (idx) => setSets((prev) => prev.filter((_, i) => i !== idx));

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
          reps: s.reps ? parseInt(s.reps) : null,
          weight_lbs: s.weight_lbs ? parseFloat(s.weight_lbs) : null,
          rpe: s.rpe ? parseFloat(s.rpe) : null,
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
          <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: "0.75rem" }}>Exercise library</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises..." style={{ ...inputStyle, marginBottom: "0.75rem" }} />
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {exercises.map((ex) => (
              <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--color-border-tertiary)" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{ex.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{ex.muscle_group} · {ex.equipment}</p>
                </div>
                <button onClick={() => addSet(ex)} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid var(--color-border-secondary)", background: "none", cursor: "pointer", fontSize: 13, color: "var(--color-text-primary)" }}>+ Add</button>
              </div>
            ))}
          </div>
        </div>

        {/* Set builder */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: "0.75rem" }}>Sets logged ({sets.length})</h2>
          {sets.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Click "+ Add" on an exercise to get started.</p>
          ) : (
            sets.map((s, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 60px 28px", gap: "0.4rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.exercise.name} <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>#{s.set_number}</span>
                </p>
                <input type="number" placeholder="Reps" value={s.reps} onChange={(e) => updateSet(idx, "reps", e.target.value)} style={{ ...miniInput }} />
                <input type="number" placeholder="lbs" value={s.weight_lbs} onChange={(e) => updateSet(idx, "weight_lbs", e.target.value)} style={{ ...miniInput }} />
                <input type="number" placeholder="RPE" step="0.5" min="1" max="10" value={s.rpe} onChange={(e) => updateSet(idx, "rpe", e.target.value)} style={{ ...miniInput }} />
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
const miniInput = { padding: "0.4rem 0.4rem", borderRadius: 6, border: "1px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", fontSize: 12, color: "var(--color-text-primary)", width: "100%", boxSizing: "border-box" };
const cardStyle = { background: "var(--color-background-secondary)", borderRadius: 12, padding: "1.25rem", border: "1px solid var(--color-border-tertiary)" };

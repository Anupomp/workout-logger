import { Fragment, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getWorkout, updateWorkout, deleteWorkout, getExercises } from "../api/client";

function formatTime(seconds) {
  if (seconds == null) return "\u2014";
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec === 0 ? `${m} min` : `${m}:${String(sec).padStart(2, "0")} min`;
}

export default function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  // Edit state
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSets, setEditSets] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [exSearch, setExSearch] = useState("");

  useEffect(() => {
    getWorkout(id)
      .then((r) => setWorkout(r.data))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    getExercises({ search: exSearch || undefined }).then((r) => setExercises(r.data));
  }, [exSearch]);

  const enterEdit = () => {
    setEditName(workout.name || "");
    setEditDuration(workout.duration_minutes || "");
    setEditNotes(workout.notes || "");
    setEditSets(
      [...workout.sets]
        .sort((a, b) => a.set_number - b.set_number)
        .map((s) => ({
          exercise: s.exercise,
          exercise_id: s.exercise_id,
          set_number: s.set_number,
          reps: s.reps ?? "",
          weight_lbs: s.weight_lbs ?? "",
          time_min: s.duration_seconds != null ? s.duration_seconds / 60 : "",
          rpe: s.rpe ?? "",
        }))
    );
    setEditing(true);
  };

  const addSet = (exercise) => {
    setEditSets((prev) => [
      ...prev,
      {
        exercise,
        exercise_id: exercise.id,
        set_number: prev.filter((s) => s.exercise_id === exercise.id).length + 1,
        reps: "", weight_lbs: "", time_min: "", rpe: "",
      },
    ]);
  };

  const updateSet = (idx, field, value) => {
    setEditSets((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const removeSet = (idx) => setEditSets((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const payload = {
        name: editName || null,
        notes: editNotes || null,
        duration_minutes: editDuration ? parseInt(editDuration) : null,
        sets: editSets.map((s) => ({
          exercise_id: s.exercise_id,
          set_number: s.set_number,
          reps: s.reps !== "" ? parseInt(s.reps) : null,
          weight_lbs: s.weight_lbs !== "" ? parseFloat(s.weight_lbs) : null,
          duration_seconds: s.time_min !== "" ? Math.round(parseFloat(s.time_min) * 60) : null,
          rpe: s.rpe !== "" ? parseFloat(s.rpe) : null,
        })),
      };
      const res = await updateWorkout(id, payload);
      setWorkout(res.data);
      setEditing(false);
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    await deleteWorkout(id);
    navigate("/");
  };

  if (loading) return <Shell><p style={{ color: "var(--color-text-secondary)" }}>Loading...</p></Shell>;
  if (!workout) return null;

  // ── VIEW MODE ──────────────────────────────────────────────────────────────
  if (!editing) {
    const byExercise = workout.sets.reduce((acc, s) => {
      const key = s.exercise.name;
      if (!acc[key]) acc[key] = { exercise: s.exercise, sets: [] };
      acc[key].sets.push(s);
      return acc;
    }, {});

    const totalVolume = workout.sets.reduce((sum, s) => sum + (s.weight_lbs || 0) * (s.reps || 0), 0);

    return (
      <Shell>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <Link to="/" style={{ fontSize: 13, color: "var(--color-text-secondary)", textDecoration: "none", display: "block", marginBottom: 6 }}>← Back</Link>
            <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>{workout.name || "Unnamed session"}</h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: "4px 0 0" }}>
              {new Date(workout.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              {workout.duration_minutes ? ` · ${workout.duration_minutes} min` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={enterEdit} style={outlineBtn}>Edit</button>
            <button onClick={handleDelete} disabled={deleting} style={{
              ...outlineBtn,
              borderColor: confirmDelete ? "var(--color-text-danger, #dc2626)" : undefined,
              background: confirmDelete ? "var(--color-text-danger, #dc2626)" : "none",
              color: confirmDelete ? "#fff" : "var(--color-text-secondary)",
            }}>
              {deleting ? "Deleting..." : confirmDelete ? "Confirm?" : "Delete"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Exercises", value: Object.keys(byExercise).length },
            { label: "Total sets", value: workout.sets.length },
            { label: "Total volume", value: totalVolume > 0 ? `${totalVolume.toLocaleString()} lbs` : "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ ...cardStyle, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{value}</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{label}</p>
            </div>
          ))}
        </div>

        {workout.notes && (
          <div style={{ ...cardStyle, marginBottom: "1.5rem" }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", fontStyle: "italic" }}>"{workout.notes}"</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {Object.values(byExercise).map(({ exercise, sets }) => (
            <div key={exercise.id} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 15 }}>{exercise.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{exercise.muscle_group} · {exercise.equipment}</p>
                </div>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{sets.length} set{sets.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr", gap: "0.4rem", fontSize: 12 }}>
                {["Set", "Weight", "Reps", "RPE"].map((h) => <span key={h} style={{ color: "var(--color-text-secondary)" }}>{h}</span>)}
                {[...sets].sort((a, b) => a.set_number - b.set_number).map((s) => (
                  <Fragment key={s.id}>
                    <span style={{ fontWeight: 500 }}>#{s.set_number}</span>
                    <span>{s.weight_lbs != null ? `${s.weight_lbs} lbs` : "BW"}</span>
                    <span>{s.reps ?? "—"}</span>
                    <span>{s.rpe ?? "—"}</span>
                  </Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Shell>
    );
  }

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Edit workout</h1>
        <button onClick={() => setEditing(false)} style={outlineBtn}>Cancel</button>
      </div>

      {/* Meta fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div>
          <label style={labelStyle}>Session name</label>
          <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Push day..." style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Duration (min)</label>
          <input type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} placeholder="60" style={inputStyle} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Notes</label>
          <input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="How did it feel?" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem" }}>
        {/* Exercise picker */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 500, marginBottom: "0.75rem" }}>Add exercises</h2>
          <input value={exSearch} onChange={(e) => setExSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, marginBottom: "0.75rem" }} />
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {exercises.map((ex) => (
              <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.45rem 0", borderBottom: "1px solid var(--color-border-tertiary)" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 500 }}>{ex.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{ex.muscle_group}</p>
                </div>
                <button onClick={() => addSet(ex)} style={{ padding: "2px 8px", borderRadius: 5, border: "1px solid var(--color-border-secondary)", background: "none", cursor: "pointer", fontSize: 12 }}>+ Add</button>
              </div>
            ))}
          </div>
        </div>

        {/* Sets editor */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 14, fontWeight: 500, marginBottom: "0.75rem" }}>Sets ({editSets.length})</h2>
          {editSets.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>No sets yet. Add an exercise on the left.</p>
          ) : (
            editSets.map((s, idx) => (
              <div key={idx} style={{ display: "flex", gap: "0.35rem", alignItems: "center", marginBottom: "0.45rem" }}>
                <p style={{ flex: 1, margin: 0, fontSize: 11, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.exercise.name} <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>#{s.set_number}</span>
                </p>
                {s.exercise.tracks_weight && <input type="number" placeholder="lbs" value={s.weight_lbs} onChange={(e) => updateSet(idx, "weight_lbs", e.target.value)} style={{ ...miniInput, width: 65 }} />}
                {s.exercise.tracks_reps && <input type="number" placeholder="Reps" value={s.reps} onChange={(e) => updateSet(idx, "reps", e.target.value)} style={{ ...miniInput, width: 65 }} />}
                {s.exercise.tracks_time && <input type="number" placeholder="Min" step="0.5" min="0" value={s.time_min} onChange={(e) => updateSet(idx, "time_min", e.target.value)} style={{ ...miniInput, width: 60 }} />}
                {s.exercise.tracks_rpe && <input type="number" placeholder="RPE" step="0.5" min="1" max="10" value={s.rpe} onChange={(e) => updateSet(idx, "rpe", e.target.value)} style={{ ...miniInput, width: 55 }} />}
                <button onClick={() => removeSet(idx)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "var(--color-text-danger, #dc2626)", padding: 0 }}>×</button>
              </div>
            ))
          )}
        </div>
      </div>

      {error && <p style={{ color: "var(--color-text-danger, #dc2626)", fontSize: 13, marginTop: "0.75rem" }}>{error}</p>}

      <button onClick={handleSave} disabled={saving} style={{ marginTop: "1.5rem", padding: "0.65rem 1.5rem", borderRadius: 8, border: "none", background: "var(--color-text-primary)", color: "var(--color-background-primary)", fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
        {saving ? "Saving..." : "Save changes"}
      </button>
    </Shell>
  );
}

function Shell({ children }) {
  return <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>{children}</div>;
}

const cardStyle = { background: "var(--color-background-secondary)", borderRadius: 12, padding: "1.25rem", border: "1px solid var(--color-border-tertiary)" };
const inputStyle = { width: "100%", padding: "0.55rem 0.75rem", borderRadius: 8, border: "1px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", fontSize: 13, color: "var(--color-text-primary)", boxSizing: "border-box" };
const miniInput = { padding: "0.38rem 0.4rem", borderRadius: 6, border: "1px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", fontSize: 12, color: "var(--color-text-primary)", boxSizing: "border-box" };
const labelStyle = { fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 3 };
const outlineBtn = { padding: "0.45rem 0.9rem", borderRadius: 8, border: "1px solid var(--color-border-secondary)", background: "none", cursor: "pointer", fontSize: 13, color: "var(--color-text-secondary)" };

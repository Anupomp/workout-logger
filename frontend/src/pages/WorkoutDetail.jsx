import { Fragment, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { getWorkout, updateWorkout, deleteWorkout, getExercises } from "../api/client";
import { PageShell, Card, Button, Input, Label, StatNumber } from "../components/ui";

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

  if (loading) return <PageShell><p style={{ color: "var(--color-text-secondary)" }}>Loading...</p></PageShell>;
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
      <PageShell>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <Link to="/" style={{ fontSize: 13, color: "var(--color-text-secondary)", textDecoration: "none", display: "block", marginBottom: 8 }}>← Back</Link>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 400, margin: 0, lineHeight: 1 }}>{workout.name || "Unnamed session"}</h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: "8px 0 0" }}>
              {new Date(workout.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              {workout.duration_minutes ? ` · ${workout.duration_minutes} min` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="outline" onClick={enterEdit}>Edit</Button>
            <Button variant={confirmDelete ? "danger" : "outline"} onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : confirmDelete ? "Confirm?" : "Delete"}
            </Button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Exercises", value: Object.keys(byExercise).length },
            { label: "Total sets", value: workout.sets.length },
            { label: "Total volume", value: totalVolume, suffix: totalVolume > 0 ? " lbs" : "" },
          ].map(({ label, value, suffix }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}>
              <Card style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
                  {label === "Total volume" && totalVolume === 0 ? "—" : <StatNumber value={value} suffix={suffix} />}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>{label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {workout.notes && (
          <Card style={{ marginBottom: "1.5rem" }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", fontStyle: "italic" }}>"{workout.notes}"</p>
          </Card>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {Object.values(byExercise).map(({ exercise, sets }, i) => (
            <motion.div key={exercise.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{exercise.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{exercise.muscle_group} · {exercise.equipment}</p>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{sets.length} set{sets.length !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr", gap: "0.4rem", fontSize: 12 }}>
                  {["Set", "Weight", "Reps", "RPE"].map((h) => <span key={h} style={{ color: "var(--color-text-secondary)", textTransform: "uppercase", fontSize: 10.5, letterSpacing: "0.04em", fontWeight: 600 }}>{h}</span>)}
                  {[...sets].sort((a, b) => a.set_number - b.set_number).map((s) => (
                    <Fragment key={s.id}>
                      <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>#{s.set_number}</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>{s.weight_lbs != null ? `${s.weight_lbs} lbs` : "BW"}</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>{s.reps ?? "—"}</span>
                      <span style={{ fontFamily: "var(--font-mono)" }}>{s.rpe ?? "—"}</span>
                    </Fragment>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </PageShell>
    );
  }

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  return (
    <PageShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 400, margin: 0 }}>Edit workout</h1>
        <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
      </div>

      {/* Meta fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div>
          <Label>Session name</Label>
          <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Push day..." />
        </div>
        <div>
          <Label>Duration (min)</Label>
          <Input type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} placeholder="60" />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <Label>Notes</Label>
          <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="How did it feel?" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem" }}>
        {/* Exercise picker */}
        <Card>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: "0.75rem" }}>Add exercises</h2>
          <Input value={exSearch} onChange={(e) => setExSearch(e.target.value)} placeholder="Search..." style={{ marginBottom: "0.75rem" }} />
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {exercises.map((ex) => (
              <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.45rem 0", borderBottom: "1px solid var(--color-border-tertiary)" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{ex.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>{ex.muscle_group}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => addSet(ex)}>+ Add</Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Sets editor */}
        <Card>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: "0.75rem" }}>Sets ({editSets.length})</h2>
          {editSets.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>No sets yet. Add an exercise on the left.</p>
          ) : (
            <AnimatePresence initial={false}>
              {editSets.map((s, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", marginBottom: "0.45rem" }}>
                    <p style={{ flex: 1, margin: 0, fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.exercise.name} <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>#{s.set_number}</span>
                    </p>
                    {s.exercise.tracks_weight && <Input type="number" placeholder="lbs" value={s.weight_lbs} onChange={(e) => updateSet(idx, "weight_lbs", e.target.value)} style={{ width: 65, padding: "0.38rem 0.5rem", fontSize: 12 }} />}
                    {s.exercise.tracks_reps && <Input type="number" placeholder="Reps" value={s.reps} onChange={(e) => updateSet(idx, "reps", e.target.value)} style={{ width: 65, padding: "0.38rem 0.5rem", fontSize: 12 }} />}
                    {s.exercise.tracks_time && <Input type="number" placeholder="Min" step="0.5" min="0" value={s.time_min} onChange={(e) => updateSet(idx, "time_min", e.target.value)} style={{ width: 60, padding: "0.38rem 0.5rem", fontSize: 12 }} />}
                    {s.exercise.tracks_rpe && <Input type="number" placeholder="RPE" step="0.5" min="1" max="10" value={s.rpe} onChange={(e) => updateSet(idx, "rpe", e.target.value)} style={{ width: 55, padding: "0.38rem 0.5rem", fontSize: 12 }} />}
                    <button onClick={() => removeSet(idx)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "var(--color-text-danger)", padding: "0 2px" }}>×</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </Card>
      </div>

      {error && <p style={{ color: "var(--color-text-danger)", fontSize: 13, marginTop: "0.75rem" }}>{error}</p>}

      <Button onClick={handleSave} disabled={saving} style={{ marginTop: "1.5rem" }} size="lg">
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </PageShell>
  );
}

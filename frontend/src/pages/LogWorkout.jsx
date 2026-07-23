import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { getExercises, createWorkout, createExercise, deleteExercise } from "../api/client";
import { useAuth } from "../components/AuthContext";
import { PageShell, PageHeader, Card, Button, Input, Select, Label, Badge } from "../components/ui";

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
    <PageShell>
      <PageHeader eyebrow="New session" title="Log workout" />

      {/* Workout meta */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div>
          <Label>Session name (optional)</Label>
          <Input value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} placeholder="Push day, Leg day..." />
        </div>
        <div>
          <Label>Duration (min)</Label>
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="60" />
        </div>
        <div>
          <Label>Notes</Label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Felt great..." />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem" }}>
        {/* Exercise picker */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Exercise library</h2>
            <Button size="sm" variant="outline" onClick={() => { setShowCreate(!showCreate); setCreateError(""); }}>
              {showCreate ? "Close" : "+ Custom"}
            </Button>
          </div>

          {/* Custom exercise creator */}
          <AnimatePresence initial={false}>
            {showCreate && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                animate={{ height: "auto", opacity: 1, marginBottom: "0.75rem" }}
                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ border: "1px solid var(--color-border-info)", background: "var(--color-background-info)", borderRadius: 10, padding: "0.85rem" }}>
                  <Input
                    value={newEx.name}
                    onChange={(e) => setNewEx((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Exercise name (e.g. Weighted Pull-Up)"
                    style={{ marginBottom: "0.5rem" }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.6rem" }}>
                    <Select
                      value={newEx.muscle_group}
                      onChange={(e) => setNewEx((p) => ({ ...p, muscle_group: e.target.value }))}
                      style={{ textTransform: "capitalize" }}
                    >
                      {MUSCLE_GROUPS.map((mg) => (
                        <option key={mg} value={mg}>{mg.replace("_", " ")}</option>
                      ))}
                    </Select>
                    <Input
                      value={newEx.equipment}
                      onChange={(e) => setNewEx((p) => ({ ...p, equipment: e.target.value }))}
                      placeholder="Equipment (optional)"
                    />
                  </div>
                  <p style={{ margin: "0 0 0.4rem", fontSize: 11, color: "var(--color-text-secondary)" }}>What do you want to log?</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.65rem" }}>
                    {checkbox("tracks_weight", "Weight")}
                    {checkbox("tracks_reps", "Reps")}
                    {checkbox("tracks_time", "Time")}
                    {checkbox("tracks_rpe", "RPE")}
                  </div>
                  {createError && <p style={{ color: "var(--color-text-danger)", fontSize: 12, margin: "0 0 0.5rem" }}>{createError}</p>}
                  <Button size="sm" onClick={handleCreateExercise} disabled={creating}>
                    {creating ? "Creating..." : "Create exercise"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exercises..." style={{ marginBottom: "0.75rem" }} />
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
                <div key={ex.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0", borderBottom: "1px solid var(--color-border-tertiary)" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                      {ex.name}
                      {isCustom && <Badge tone="info" style={{ marginLeft: 6 }}>custom</Badge>}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>
                      {ex.muscle_group.replace("_", " ")}{ex.equipment ? ` · ${ex.equipment}` : ""}
                      <span style={{ textTransform: "none" }}> · logs: {metrics}</span>
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                    {isCustom && ex.created_by === user?.id && (
                      <button onClick={() => handleDeleteExercise(ex)} title="Delete custom exercise" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "var(--color-text-danger)", padding: "0 2px" }}>×</button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => addSet(ex)}>+ Add</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Set builder */}
        <Card>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: "0.75rem" }}>Sets logged ({sets.length})</h2>
          {sets.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>Click "+ Add" on an exercise to get started.</p>
          ) : (
            <AnimatePresence initial={false}>
              {sets.map((s, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.5rem" }}>
                    <p style={{ flex: 1, margin: 0, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.exercise.name} <span style={{ color: "var(--color-text-secondary)", fontWeight: 400 }}>#{s.set_number}</span>
                    </p>
                    {s.exercise.tracks_weight && (
                      <Input type="number" placeholder="lbs" value={s.weight_lbs} onChange={(e) => updateSet(idx, "weight_lbs", e.target.value)} style={{ width: 70, padding: "0.4rem 0.5rem", fontSize: 12 }} />
                    )}
                    {s.exercise.tracks_reps && (
                      <Input type="number" placeholder="Reps" value={s.reps} onChange={(e) => updateSet(idx, "reps", e.target.value)} style={{ width: 65, padding: "0.4rem 0.5rem", fontSize: 12 }} />
                    )}
                    {s.exercise.tracks_time && (
                      <Input type="number" placeholder="Min" step="0.5" min="0" value={s.time_min} onChange={(e) => updateSet(idx, "time_min", e.target.value)} style={{ width: 60, padding: "0.4rem 0.5rem", fontSize: 12 }} />
                    )}
                    {s.exercise.tracks_rpe && (
                      <Input type="number" placeholder="RPE" step="0.5" min="1" max="10" value={s.rpe} onChange={(e) => updateSet(idx, "rpe", e.target.value)} style={{ width: 55, padding: "0.4rem 0.5rem", fontSize: 12 }} />
                    )}
                    <button onClick={() => removeSet(idx)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--color-text-danger)", padding: 0 }}>×</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </Card>
      </div>

      {error && <p style={{ color: "var(--color-text-danger)", fontSize: 13, marginTop: "0.75rem" }}>{error}</p>}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? "Saving..." : "Save workout"}
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate("/")}>Cancel</Button>
      </div>
    </PageShell>
  );
}

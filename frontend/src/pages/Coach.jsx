import { useState } from "react";
import { generatePlan } from "../api/client";

const GOALS = ["Build strength", "Lose fat", "Improve endurance", "Build muscle", "Improve athleticism"];

export default function Coach() {
  const [goal, setGoal] = useState("");
  const [days, setDays] = useState(4);
  const [extraNotes, setExtraNotes] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!goal) { setError("Please select a goal."); return; }
    setLoading(true); setError(""); setPlan("");
    try {
      const res = await generatePlan({ goal, days_per_week: days, additional_notes: extraNotes || null });
      setPlan(res.data.plan);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate plan. Make sure you have logged at least one workout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: "0.25rem" }}>✨ AI Coach</h1>
      <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: "2rem" }}>
        Your training plan is generated from your actual workout history — not a generic template.
      </p>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 15, fontWeight: 500, marginBottom: "1rem" }}>What's your goal?</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {GOALS.map((g) => (
            <button key={g} onClick={() => setGoal(g)} style={{
              padding: "0.45rem 1rem", borderRadius: 20, fontSize: 13, cursor: "pointer",
              border: goal === g ? "1.5px solid var(--color-text-primary)" : "1px solid var(--color-border-secondary)",
              background: goal === g ? "var(--color-text-primary)" : "none",
              color: goal === g ? "var(--color-background-primary)" : "var(--color-text-primary)",
              fontWeight: goal === g ? 500 : 400,
            }}>{g}</button>
          ))}
        </div>

        <label style={labelStyle}>Days per week</label>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {[2, 3, 4, 5, 6].map((d) => (
            <button key={d} onClick={() => setDays(d)} style={{
              width: 40, height: 40, borderRadius: 8, fontSize: 14, cursor: "pointer",
              border: days === d ? "1.5px solid var(--color-text-primary)" : "1px solid var(--color-border-secondary)",
              background: days === d ? "var(--color-text-primary)" : "none",
              color: days === d ? "var(--color-background-primary)" : "var(--color-text-primary)",
              fontWeight: days === d ? 500 : 400,
            }}>{d}</button>
          ))}
        </div>

        <label style={labelStyle}>Any other notes? (injuries, equipment limits, etc.)</label>
        <textarea value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} rows={2} placeholder="e.g. No overhead pressing due to shoulder pain" style={{ ...inputStyle, resize: "vertical", marginBottom: "1.25rem" }} />

        {error && <p style={{ color: "var(--color-text-danger)", fontSize: 13, marginBottom: "0.75rem" }}>{error}</p>}

        <button onClick={handleGenerate} disabled={loading} style={{ padding: "0.65rem 1.5rem", borderRadius: 8, border: "none", background: "var(--color-text-primary)", color: "var(--color-background-primary)", fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
          {loading ? "Generating your plan..." : "Generate my plan"}
        </button>
      </div>

      {loading && (
        <div style={{ ...cardStyle, marginTop: "1.5rem", color: "var(--color-text-secondary)", fontSize: 14 }}>
          🤔 Analyzing your workout history...
        </div>
      )}

      {plan && (
        <div style={{ ...cardStyle, marginTop: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>Your personalized plan</h2>
            <button onClick={() => navigator.clipboard.writeText(plan)} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "1px solid var(--color-border-secondary)", background: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}>Copy</button>
          </div>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14, lineHeight: 1.7, margin: 0, color: "var(--color-text-primary)" }}>{plan}</pre>
        </div>
      )}
    </div>
  );
}

const labelStyle = { fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "0.55rem 0.75rem", borderRadius: 8, border: "1px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", fontSize: 13, color: "var(--color-text-primary)", boxSizing: "border-box" };
const cardStyle = { background: "var(--color-background-secondary)", borderRadius: 12, padding: "1.5rem", border: "1px solid var(--color-border-tertiary)" };

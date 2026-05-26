import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWorkouts, getPRs } from "../api/client";
import { useAuth } from "../components/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [prs, setPRs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getWorkouts(), getPRs()])
      .then(([wRes, prRes]) => {
        setWorkouts(wRes.data.slice(0, 5));
        setPRs(prRes.data.slice(0, 6));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageShell><p style={{ color: "var(--color-text-secondary)" }}>Loading...</p></PageShell>;

  return (
    <PageShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Hey, {user?.username} 👋</h1>
          <p style={{ color: "var(--color-text-secondary)", margin: "4px 0 0", fontSize: 14 }}>Here's your fitness snapshot</p>
        </div>
        <Link to="/log" style={btnStyle}>+ Log workout</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Recent Workouts */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Recent workouts</h2>
            <Link to="/history" style={{ fontSize: 13, color: "var(--color-text-info)" }}>View all</Link>
          </div>
          {workouts.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>No workouts yet. <Link to="/log" style={{ color: "var(--color-text-info)" }}>Log your first one</Link>.</p>
          ) : (
            workouts.map((w) => (
              <Link key={w.id} to={`/workout/${w.id}`} style={{ display: "block", textDecoration: "none" }}>
                <div style={rowStyle}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: "var(--color-text-primary)" }}>{w.name || "Unnamed session"}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
                      {new Date(w.date).toLocaleDateString()} · {w.set_count} sets
                      {w.duration_minutes ? ` · ${w.duration_minutes}min` : ""}
                    </p>
                  </div>
                  <span style={{ color: "var(--color-text-tertiary)", fontSize: 18 }}>›</span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* PRs */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: "1rem" }}>Personal records</h2>
          {prs.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>PRs are auto-tracked when you log a new max weight.</p>
          ) : (
            prs.map((pr) => (
              <div key={pr.id} style={rowStyle}>
                <div>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: 14 }}>{pr.exercise.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{new Date(pr.achieved_at).toLocaleDateString()}</p>
                </div>
                <span style={{ fontWeight: 500, fontSize: 14, color: "var(--color-text-success)" }}>
                  {pr.weight_lbs} lbs × {pr.reps}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Coach CTA */}
      <div style={{ ...cardStyle, marginTop: "1.5rem", background: "var(--color-background-info)", borderColor: "var(--color-border-info)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 500, fontSize: 15, color: "var(--color-text-info)" }}>✨ AI Coach</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>Generate a personalized weekly plan based on your history</p>
        </div>
        <Link to="/coach" style={{ ...btnStyle, background: "var(--color-text-info)", color: "#fff", whiteSpace: "nowrap" }}>Get my plan</Link>
      </div>
    </PageShell>
  );
}

function PageShell({ children }) {
  return <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>{children}</div>;
}

const cardStyle = {
  background: "var(--color-background-secondary)", borderRadius: 12,
  padding: "1.25rem", border: "1px solid var(--color-border-tertiary)",
};
const rowStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "0.6rem 0", borderBottom: "1px solid var(--color-border-tertiary)",
};
const btnStyle = {
  padding: "0.5rem 1rem", borderRadius: 8, border: "none",
  background: "var(--color-text-primary)", color: "var(--color-background-primary)",
  fontWeight: 500, fontSize: 13, cursor: "pointer", textDecoration: "none",
  display: "inline-block",
};

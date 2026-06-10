import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWorkouts } from "../api/client";

export default function History() {
  const [workouts, setWorkouts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkouts()
      .then((r) => setWorkouts(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = workouts.filter((w) =>
    (w.name || "Unnamed session").toLowerCase().includes(search.toLowerCase())
  );

  // Group by month for nicer scanning
  const byMonth = filtered.reduce((acc, w) => {
    const key = new Date(w.date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Workout history</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: "4px 0 0" }}>
            {workouts.length} session{workouts.length !== 1 ? "s" : ""} logged
          </p>
        </div>
        <Link to="/log" style={btnStyle}>+ Log workout</Link>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by session name..."
        style={{ ...inputStyle, marginBottom: "1.5rem" }}
      />

      {loading ? (
        <p style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: 0 }}>
            {workouts.length === 0 ? (
              <>No workouts yet. <Link to="/log" style={{ color: "var(--color-text-info)" }}>Log your first one</Link>.</>
            ) : (
              "No sessions match your search."
            )}
          </p>
        </div>
      ) : (
        Object.entries(byMonth).map(([month, items]) => (
          <div key={month} style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              {month}
            </h2>
            <div style={cardStyle}>
              {items.map((w) => (
                <Link key={w.id} to={`/workout/${w.id}`} style={{ display: "block", textDecoration: "none" }}>
                  <div style={rowStyle}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: "var(--color-text-primary)" }}>
                        {w.name || "Unnamed session"}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
                        {new Date(w.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {" · "}{w.set_count} sets
                        {w.duration_minutes ? ` · ${w.duration_minutes} min` : ""}
                      </p>
                    </div>
                    <span style={{ color: "var(--color-text-tertiary)", fontSize: 18 }}>›</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const cardStyle = { background: "var(--color-background-secondary)", borderRadius: 12, padding: "0.5rem 1.25rem", border: "1px solid var(--color-border-tertiary)" };
const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--color-border-tertiary)" };
const inputStyle = { width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "1px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", fontSize: 14, color: "var(--color-text-primary)", boxSizing: "border-box" };
const btnStyle = { padding: "0.5rem 1rem", borderRadius: 8, border: "none", background: "var(--color-text-primary)", color: "var(--color-background-primary)", fontWeight: 500, fontSize: 13, cursor: "pointer", textDecoration: "none", display: "inline-block" };

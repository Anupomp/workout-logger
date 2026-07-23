import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { getWorkouts, getPRs } from "../api/client";
import { useAuth } from "../components/AuthContext";
import { PageShell, PageHeader, Card, Row, Button } from "../components/ui";
import { staggerContainer, staggerItem } from "../lib/motion";

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
      <PageHeader
        eyebrow="Dashboard"
        title={<>Hey, {user?.username}</>}
        subtitle="Here's your fitness snapshot"
        action={<Button to="/log">+ Log workout</Button>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Recent Workouts */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Recent workouts</h2>
            <Link to="/history" style={{ fontSize: 13, color: "var(--color-accent)", fontWeight: 600, textDecoration: "none" }}>View all</Link>
          </div>
          {workouts.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>No workouts yet. <Link to="/log" style={{ color: "var(--color-accent)" }}>Log your first one</Link>.</p>
          ) : (
            <motion.div initial="hidden" animate="show" variants={staggerContainer.variants}>
              {workouts.map((w) => (
                <motion.div key={w.id} variants={staggerItem.variants}>
                  <Link to={`/workout/${w.id}`} style={{ display: "block", textDecoration: "none" }}>
                    <Row>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>{w.name || "Unnamed session"}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
                          {new Date(w.date).toLocaleDateString()} · {w.set_count} sets
                          {w.duration_minutes ? ` · ${w.duration_minutes}min` : ""}
                        </p>
                      </div>
                      <span style={{ color: "var(--color-text-tertiary)", fontSize: 18 }}>›</span>
                    </Row>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </Card>

        {/* PRs */}
        <Card>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: "1rem" }}>Personal records</h2>
          {prs.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>PRs are auto-tracked when you log a new max weight.</p>
          ) : (
            <motion.div initial="hidden" animate="show" variants={staggerContainer.variants}>
              {prs.map((pr) => (
                <motion.div key={pr.id} variants={staggerItem.variants}>
                  <Row>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{pr.exercise.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{new Date(pr.achieved_at).toLocaleDateString()}</p>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 14, color: "var(--color-text-success)" }}>
                      {pr.weight_lbs} lbs × {pr.reps}
                    </span>
                  </Row>
                </motion.div>
              ))}
            </motion.div>
          )}
        </Card>
      </div>

      {/* AI Coach CTA */}
      <Card glow style={{ marginTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "var(--color-accent)" }}>✨ AI Coach</p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>Generate a personalized weekly plan based on your history</p>
        </div>
        <Button to="/coach" style={{ whiteSpace: "nowrap" }}>Get my plan</Button>
      </Card>
    </PageShell>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { getWorkouts } from "../api/client";
import { PageShell, PageHeader, Card, Row, Button, Input, EmptyState, SectionLabel, StatNumber } from "../components/ui";
import { staggerContainer, staggerItem } from "../lib/motion";

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
    <PageShell>
      <PageHeader
        eyebrow="Log"
        title="History"
        subtitle={
          <>
            <StatNumber value={workouts.length} style={{ fontFamily: "inherit", color: "var(--color-text-primary)", fontWeight: 600 }} />{" "}
            session{workouts.length !== 1 ? "s" : ""} logged
          </>
        }
        action={<Button to="/log">+ Log workout</Button>}
      />

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by session name..."
        style={{ marginBottom: "1.75rem" }}
      />

      {loading ? (
        <p style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <EmptyState>
          {workouts.length === 0 ? (
            <>No workouts yet. <Link to="/log" style={{ color: "var(--color-accent)" }}>Log your first one</Link>.</>
          ) : (
            "No sessions match your search."
          )}
        </EmptyState>
      ) : (
        Object.entries(byMonth).map(([month, items], groupIdx) => (
          <motion.div
            key={month}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: groupIdx * 0.05 }}
            style={{ marginBottom: "1.75rem" }}
          >
            <SectionLabel>{month}</SectionLabel>
            <Card style={{ padding: "0 1.25rem" }}>
              <motion.div initial="hidden" animate="show" variants={staggerContainer.variants}>
                {items.map((w) => (
                  <motion.div key={w.id} variants={staggerItem.variants}>
                    <Link to={`/workout/${w.id}`} style={{ display: "block", textDecoration: "none" }}>
                      <Row>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>
                            {w.name || "Unnamed session"}
                          </p>
                          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>
                            {new Date(w.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            {" · "}{w.set_count} sets
                            {w.duration_minutes ? ` · ${w.duration_minutes} min` : ""}
                          </p>
                        </div>
                        <span style={{ color: "var(--color-text-tertiary)", fontSize: 18 }}>›</span>
                      </Row>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </Card>
          </motion.div>
        ))
      )}
    </PageShell>
  );
}

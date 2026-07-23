import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { motion } from "motion/react";
import { getExercises, getProgress } from "../api/client";
import { PageShell, PageHeader, Card, Select, Label, EmptyState, StatNumber } from "../components/ui";

export default function Progress() {
  const [exercises, setExercises] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getExercises().then((r) => setExercises(r.data.filter((e) => e.tracks_weight)));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    getProgress(selectedId)
      .then((r) =>
        setData(
          r.data.map((p) => ({
            ...p,
            label: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          }))
        )
      )
      .finally(() => setLoading(false));
  }, [selectedId]);

  const selected = exercises.find((e) => e.id === parseInt(selectedId));

  return (
    <PageShell>
      <PageHeader eyebrow="Strength" title="Progress" subtitle="Track your top set and estimated 1RM over time for any exercise." />

      <div style={{ marginBottom: "1.75rem" }}>
        <Label>Exercise</Label>
        <Select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={{ maxWidth: 320 }}>
          <option value="">Select an exercise...</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </Select>
      </div>

      {!selectedId ? (
        <EmptyState>Pick an exercise above to see your strength curve.</EmptyState>
      ) : loading ? (
        <EmptyState>Loading...</EmptyState>
      ) : data.length === 0 ? (
        <EmptyState>No logged sets with weight for {selected?.name} yet. Log a workout with this exercise to start tracking.</EmptyState>
      ) : (
        <>
          <Card style={{ paddingBottom: "0.5rem" }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 1rem" }}>{selected?.name}</h2>
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }} />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  label={{ value: "lbs", angle: -90, position: "insideLeft", fontSize: 12, fill: "var(--color-text-secondary)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-background-elevated)",
                    border: "1px solid var(--color-border-secondary)",
                    borderRadius: 8, fontSize: 13,
                  }}
                  labelStyle={{ color: "var(--color-text-primary)" }}
                  formatter={(value, name) => [
                    `${value} lbs`,
                    name === "top_weight_lbs" ? "Top set" : "Est. 1RM",
                  ]}
                />
                <Legend
                  formatter={(value) => (value === "top_weight_lbs" ? "Top set weight" : "Estimated 1RM")}
                  wrapperStyle={{ fontSize: 13 }}
                />
                <Line type="monotone" dataKey="top_weight_lbs" stroke="#ffc629" strokeWidth={2.5} dot={{ r: 3, fill: "#ffc629" }} />
                <Line type="monotone" dataKey="estimated_1rm" stroke="#33e894" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: "#33e894" }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "1.5rem" }}>
            {[
              { label: "Sessions tracked", value: data.length },
              { label: "Best top set", value: Math.max(...data.map((d) => d.top_weight_lbs)), suffix: " lbs" },
              { label: "Best est. 1RM", value: Math.max(...data.map((d) => d.estimated_1rm)), suffix: " lbs" },
            ].map(({ label, value, suffix = "" }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <Card style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
                    <StatNumber value={value} suffix={suffix} />
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-secondary)" }}>{label}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}

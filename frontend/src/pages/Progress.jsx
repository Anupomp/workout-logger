import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { getExercises, getProgress } from "../api/client";

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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: "0.25rem" }}>📈 Progress</h1>
      <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: "2rem" }}>
        Track your top set and estimated 1RM over time for any exercise.
      </p>

      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>
          Exercise
        </label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          style={{
            padding: "0.6rem 0.75rem", borderRadius: 8, fontSize: 14, minWidth: 260,
            border: "1px solid var(--color-border-secondary)",
            background: "var(--color-background-secondary)",
            color: "var(--color-text-primary)",
          }}
        >
          <option value="">Select an exercise...</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
      </div>

      {!selectedId ? (
        <div style={cardStyle}>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: 0 }}>
            Pick an exercise above to see your strength curve.
          </p>
        </div>
      ) : loading ? (
        <div style={cardStyle}>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: 0 }}>Loading...</p>
        </div>
      ) : data.length === 0 ? (
        <div style={cardStyle}>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: 0 }}>
            No logged sets with weight for {selected?.name} yet. Log a workout with this exercise to start tracking.
          </p>
        </div>
      ) : (
        <>
          <div style={{ ...cardStyle, paddingBottom: "0.5rem" }}>
            <h2 style={{ fontSize: 15, fontWeight: 500, margin: "0 0 1rem" }}>{selected?.name}</h2>
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
                    background: "var(--color-background-primary)",
                    border: "1px solid var(--color-border-secondary)",
                    borderRadius: 8, fontSize: 13,
                  }}
                  formatter={(value, name) => [
                    `${value} lbs`,
                    name === "top_weight_lbs" ? "Top set" : "Est. 1RM",
                  ]}
                />
                <Legend
                  formatter={(value) => (value === "top_weight_lbs" ? "Top set weight" : "Estimated 1RM")}
                  wrapperStyle={{ fontSize: 13 }}
                />
                <Line type="monotone" dataKey="top_weight_lbs" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="estimated_1rm" stroke="#16a34a" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "1.5rem" }}>
            {[
              { label: "Sessions tracked", value: data.length },
              { label: "Best top set", value: `${Math.max(...data.map((d) => d.top_weight_lbs))} lbs` },
              { label: "Best est. 1RM", value: `${Math.max(...data.map((d) => d.estimated_1rm))} lbs` },
            ].map(({ label, value }) => (
              <div key={label} style={{ ...cardStyle, textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{value}</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-secondary)" }}>{label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const cardStyle = {
  background: "var(--color-background-secondary)", borderRadius: 12,
  padding: "1.25rem", border: "1px solid var(--color-border-tertiary)",
};

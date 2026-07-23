import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { generatePlan } from "../api/client";
import { PageShell, PageHeader, Card, Button, Input, Select, TextArea, Label } from "../components/ui";

const GOALS = ["Build strength", "Lose fat", "Improve endurance", "Build muscle", "Improve athleticism"];

const PROVIDERS = [
  { id: "anthropic", label: "Anthropic (Claude)", placeholder: "sk-ant-...", keyUrl: "console.anthropic.com" },
  { id: "openai", label: "OpenAI (GPT-4o)", placeholder: "sk-...", keyUrl: "platform.openai.com" },
  { id: "gemini", label: "Google (Gemini)", placeholder: "AIza...", keyUrl: "aistudio.google.com" },
];

export default function Coach() {
  const [goal, setGoal] = useState("");
  const [days, setDays] = useState(4);
  const [extraNotes, setExtraNotes] = useState("");
  const [provider, setProvider] = useState(localStorage.getItem("ai_provider") || "anthropic");
  const [apiKey, setApiKey] = useState(localStorage.getItem("ai_api_key") || "");
  const [rememberKey, setRememberKey] = useState(!!localStorage.getItem("ai_api_key"));
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedProvider = PROVIDERS.find((p) => p.id === provider) || PROVIDERS[0];

  const handleGenerate = async () => {
    if (!goal) { setError("Please select a goal."); return; }
    if (!apiKey.trim()) { setError("Paste your API key to generate a plan."); return; }

    if (rememberKey) {
      localStorage.setItem("ai_api_key", apiKey.trim());
      localStorage.setItem("ai_provider", provider);
    } else {
      localStorage.removeItem("ai_api_key");
      localStorage.removeItem("ai_provider");
    }

    setLoading(true); setError(""); setPlan("");
    try {
      const res = await generatePlan({
        goal,
        days_per_week: days,
        additional_notes: extraNotes || null,
        provider,
        api_key: apiKey.trim(),
      });
      setPlan(res.data.plan);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate plan. Make sure you have logged at least one workout.");
    } finally {
      setLoading(false);
    }
  };

  const pillStyle = (active) => ({
    padding: "0.5rem 1.1rem",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: active ? 600 : 500,
    cursor: "pointer",
    border: active ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border-secondary)",
    background: active ? "var(--color-accent)" : "transparent",
    color: active ? "#141410" : "var(--color-text-primary)",
  });

  return (
    <PageShell maxWidth={780}>
      <PageHeader eyebrow="AI Coach" title="Build a plan" subtitle="Your training plan is generated from your actual workout history — not a generic template." />

      <Card>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: "1rem" }}>What's your goal?</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {GOALS.map((g) => (
            <motion.button key={g} onClick={() => setGoal(g)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} style={pillStyle(goal === g)}>
              {g}
            </motion.button>
          ))}
        </div>

        <Label>Days per week</Label>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {[2, 3, 4, 5, 6].map((d) => (
            <motion.button
              key={d}
              onClick={() => setDays(d)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              style={{ ...pillStyle(days === d), width: 42, height: 42, borderRadius: 10, padding: 0, fontFamily: "var(--font-mono)" }}
            >
              {d}
            </motion.button>
          ))}
        </div>

        <Label>AI provider & your API key</Label>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <Select value={provider} onChange={(e) => setProvider(e.target.value)} style={{ width: 190, flexShrink: 0 }}>
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </Select>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={selectedProvider.placeholder}
            autoComplete="off"
          />
        </div>
        <p style={{ margin: "0 0 0.5rem", fontSize: 11, color: "var(--color-text-secondary)" }}>
          Get a key at {selectedProvider.keyUrl}. Your key is sent only with this request and never stored on the server.
        </p>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-secondary)", marginBottom: "1.25rem", cursor: "pointer" }}>
          <input type="checkbox" checked={rememberKey} onChange={(e) => setRememberKey(e.target.checked)} />
          Remember key in this browser only
        </label>

        <Label>Any other notes? (injuries, equipment limits, etc.)</Label>
        <TextArea value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} rows={2} placeholder="e.g. No overhead pressing due to shoulder pain" style={{ resize: "vertical", marginBottom: "1.25rem" }} />

        {error && <p style={{ color: "var(--color-text-danger)", fontSize: 13, marginBottom: "0.75rem" }}>{error}</p>}

        <Button onClick={handleGenerate} disabled={loading} size="lg">
          {loading ? "Generating your plan..." : "Generate my plan"}
        </Button>
      </Card>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <Card style={{ marginTop: "1.5rem", color: "var(--color-text-secondary)", fontSize: 14 }}>
              🤔 Analyzing your workout history...
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {plan && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
            <Card style={{ marginTop: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Your personalized plan</h2>
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(plan)}>Copy</Button>
              </div>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14, lineHeight: 1.7, margin: 0, color: "var(--color-text-primary)" }}>{plan}</pre>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

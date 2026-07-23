import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { login, register, getMe } from "../api/client";
import { useAuth } from "../components/AuthContext";
import { Button, Input, Label } from "../components/ui";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    // Client-side validation
    if (!form.username.trim()) { setError("Username is required."); return; }
    if (!form.password.trim()) { setError("Password is required."); return; }
    if (mode === "register" && !form.email.trim()) { setError("Email is required."); return; }

    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await login(form.username, form.password);
        localStorage.setItem("token", res.data.access_token);
      } else {
        await register({ email: form.email, username: form.username, password: form.password });
        const res = await login(form.username, form.password);
        localStorage.setItem("token", res.data.access_token);
      }
      const me = await getMe();
      setUser(me.data);
      navigate("/");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(", "));
      } else {
        setError(detail || "Incorrect username or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-background-tertiary)",
        backgroundImage:
          "radial-gradient(ellipse 700px 500px at 50% 0%, rgba(255,198,41,0.09), transparent 60%)",
        padding: "1.5rem",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: "var(--color-background-primary)",
          borderRadius: 18,
          padding: "2.75rem",
          width: "100%",
          maxWidth: 400,
          border: "1px solid var(--color-border-tertiary)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: "0.35rem" }}>
          <span style={{ color: "var(--color-accent)", fontSize: 20, lineHeight: 1 }}>●</span>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 30,
              letterSpacing: "0.02em",
              margin: 0,
            }}
          >
            WORKOUT LOG
          </h1>
        </div>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "2rem", fontSize: 14 }}>
          {mode === "login" ? "Welcome back. Let's lift." : "Create your account and start tracking."}
        </p>

        <AnimatePresence initial={false}>
          {mode === "register" && (
            <motion.div
              key="email-field"
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: "auto", opacity: 1, marginBottom: "1rem" }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{ overflow: "hidden" }}
            >
              <Label>Email</Label>
              <Input name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" />
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginBottom: "1rem" }}>
          <Label>Username</Label>
          <Input name="username" value={form.username} onChange={update} placeholder="username" />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <Label>Password</Label>
          <Input
            name="password"
            type="password"
            value={form.password}
            onChange={update}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                background: "var(--color-background-error)",
                border: "1px solid var(--color-border-error)",
                borderRadius: 9,
                padding: "0.65rem 0.8rem",
                marginBottom: "1rem",
                overflow: "hidden",
              }}
            >
              <p style={{ color: "var(--color-text-danger)", fontSize: 13, margin: 0 }}>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <Button onClick={handleSubmit} disabled={loading} style={{ width: "100%" }} size="lg">
          {loading ? "Loading..." : mode === "login" ? "Sign in" : "Create account"}
        </Button>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: 13, color: "var(--color-text-secondary)" }}>
          {mode === "login" ? "Don't have an account? " : "Already have one? "}
          <span
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            style={{ color: "var(--color-accent)", cursor: "pointer", fontWeight: 600 }}
          >
            {mode === "login" ? "Register" : "Sign in"}
          </span>
        </p>
      </motion.div>
    </div>
  );
}

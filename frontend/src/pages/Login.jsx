import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api/client";
import { useAuth } from "../components/AuthContext";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
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
      const { getMe } = await import("../api/client");
      const me = await getMe();
      setUser(me.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-background-tertiary)" }}>
      <div style={{ background: "var(--color-background-primary)", borderRadius: 16, padding: "2.5rem", width: "100%", maxWidth: 400, border: "1px solid var(--color-border-tertiary)" }}>
        <h1 style={{ marginBottom: "0.25rem", fontSize: 22, fontWeight: 500 }}>💪 Workout Logger</h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "2rem", fontSize: 14 }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </p>

        {mode === "register" && (
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Email</label>
            <input name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" style={inputStyle} />
          </div>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Username</label>
          <input name="username" value={form.username} onChange={update} placeholder="username" style={inputStyle} />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Password</label>
          <input name="password" type="password" value={form.password} onChange={update} placeholder="••••••••" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        </div>

        {error && <p style={{ color: "var(--color-text-danger)", fontSize: 13, marginBottom: "1rem" }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading} style={btnStyle}>
          {loading ? "Loading..." : mode === "login" ? "Sign in" : "Create account"}
        </button>

        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: 13, color: "var(--color-text-secondary)" }}>
          {mode === "login" ? "Don't have an account? " : "Already have one? "}
          <span onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ color: "var(--color-text-info)", cursor: "pointer" }}>
            {mode === "login" ? "Register" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  display: "block", width: "100%", marginTop: 4, padding: "0.6rem 0.75rem",
  borderRadius: 8, border: "1px solid var(--color-border-secondary)",
  background: "var(--color-background-secondary)", fontSize: 14,
  color: "var(--color-text-primary)", boxSizing: "border-box",
};

const btnStyle = {
  width: "100%", padding: "0.75rem", borderRadius: 8, border: "none",
  background: "var(--color-text-primary)", color: "var(--color-background-primary)",
  fontWeight: 500, fontSize: 15, cursor: "pointer",
};

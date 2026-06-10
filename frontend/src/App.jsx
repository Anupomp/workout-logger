import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LogWorkout from "./pages/LogWorkout";
import WorkoutDetail from "./pages/WorkoutDetail";
import History from "./pages/History";
import Progress from "./pages/Progress";
import Coach from "./pages/Coach";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function Nav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const navLink = (to, label) => (
    <Link to={to} style={{
      textDecoration: "none", fontSize: 14, padding: "0.4rem 0.75rem", borderRadius: 6,
      color: location.pathname === to ? "var(--color-text-primary)" : "var(--color-text-secondary)",
      background: location.pathname === to ? "var(--color-background-secondary)" : "none",
      fontWeight: location.pathname === to ? 500 : 400,
    }}>{label}</Link>
  );

  return (
    <nav style={{ borderBottom: "1px solid var(--color-border-tertiary)", padding: "0.75rem 1.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
      <span style={{ fontWeight: 500, fontSize: 15, marginRight: "1rem" }}>💪 WL</span>
      {navLink("/", "Dashboard")}
      {navLink("/log", "Log")}
      {navLink("/history", "History")}
      {navLink("/progress", "Progress")}
      {navLink("/coach", "AI Coach")}
      <button onClick={logout} style={{ marginLeft: "auto", fontSize: 13, padding: "0.4rem 0.75rem", borderRadius: 6, border: "1px solid var(--color-border-secondary)", background: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}>Sign out</button>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/log" element={<ProtectedRoute><LogWorkout /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
          <Route path="/workout/:id" element={<ProtectedRoute><WorkoutDetail /></ProtectedRoute>} />
          <Route path="/coach" element={<ProtectedRoute><Coach /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

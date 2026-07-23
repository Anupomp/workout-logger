import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
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

const NAV_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/log", label: "Log" },
  { to: "/history", label: "History" },
  { to: "/progress", label: "Progress" },
  { to: "/coach", label: "AI Coach" },
];

function Nav() {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (!user) return null;

  return (
    <nav
      style={{
        borderBottom: "1px solid var(--color-border-tertiary)",
        padding: "0.85rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.15rem",
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(10, 10, 12, 0.82)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 24,
          letterSpacing: "0.02em",
          marginRight: "1.5rem",
          color: "var(--color-text-primary)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ color: "var(--color-accent)" }}>●</span>WORKOUT LOG
      </span>
      {NAV_LINKS.map(({ to, label }) => {
        const active = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            style={{
              position: "relative",
              textDecoration: "none",
              fontSize: 13.5,
              fontWeight: active ? 600 : 500,
              padding: "0.5rem 0.9rem",
              borderRadius: 7,
              color: active ? "var(--color-background-primary)" : "var(--color-text-secondary)",
            }}
          >
            {active && (
              <motion.span
                layoutId="nav-pill"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "var(--color-accent)",
                  borderRadius: 7,
                  zIndex: -1,
                }}
              />
            )}
            {label}
          </Link>
        );
      })}
      <motion.button
        onClick={logout}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        style={{
          marginLeft: "auto",
          fontSize: 12.5,
          fontWeight: 600,
          padding: "0.45rem 0.9rem",
          borderRadius: 7,
          border: "1px solid var(--color-border-secondary)",
          background: "none",
          cursor: "pointer",
          color: "var(--color-text-secondary)",
        }}
      >
        Sign out
      </motion.button>
    </nav>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/log" element={<ProtectedRoute><LogWorkout /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
        <Route path="/workout/:id" element={<ProtectedRoute><WorkoutDetail /></ProtectedRoute>} />
        <Route path="/coach" element={<ProtectedRoute><Coach /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (username, password) => {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  return api.post("/auth/login", form);
};
export const register = (data) => api.post("/auth/register", data);
export const getMe = () => api.get("/auth/me");

// ── Exercises ─────────────────────────────────────────────────────────────────
export const getExercises = (params) => api.get("/exercises/", { params });

// ── Workouts ──────────────────────────────────────────────────────────────────
export const getWorkouts = () => api.get("/workouts/");
export const getWorkout = (id) => api.get(`/workouts/${id}`);
export const createWorkout = (data) => api.post("/workouts/", data);
export const deleteWorkout = (id) => api.delete(`/workouts/${id}`);
export const getPRs = () => api.get("/workouts/prs/all");

// ── AI Coach ──────────────────────────────────────────────────────────────────
export const generatePlan = (data) => api.post("/coach/generate", data);

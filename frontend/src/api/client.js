import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes("/login")) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

export const login = (username, password) => {
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);
  return api.post("/auth/login", form);
};
export const register = (data) => api.post("/auth/register", data);
export const getMe = () => api.get("/auth/me");

export const getExercises = (params) => api.get("/exercises/", { params });
export const createExercise = (data) => api.post("/exercises/", data);
export const deleteExercise = (id) => api.delete(`/exercises/${id}`);

export const getWorkouts = () => api.get("/workouts/");
export const getWorkout = (id) => api.get(`/workouts/${id}`);
export const createWorkout = (data) => api.post("/workouts/", data);
export const updateWorkout = (id, data) => api.put(`/workouts/${id}`, data);
export const deleteWorkout = (id) => api.delete(`/workouts/${id}`);
export const getPRs = () => api.get("/workouts/prs/all");
export const getProgress = (exerciseId) => api.get(`/workouts/progress/${exerciseId}`);

export const generatePlan = (data) => api.post("/coach/generate", data);

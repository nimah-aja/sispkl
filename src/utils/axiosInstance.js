import axios from "axios";
import { getAccessToken, refreshAccessToken, setTokens, removeTokens } from "./authHelper";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 90000,
});

// Pas request: tambah Authorization header
instance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Pas response: refresh token otomatis kalau 401
instance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Hindari loop
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();

      if (newToken) {
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return instance(originalRequest);
      } else {
        removeTokens();
        import.meta.env.MODE === "development"
          ? console.log("Redirect ke login (no reload)")
          : null;

        // Gunakan navigation SPA (React Router) kalau ada
        if (window.reactNavigate) {
          window.reactNavigate("/"); // nanti kita inject
        } else {
          // fallback kalau belum siap
          console.warn("navigate belum tersedia, fallback reload");
          window.location.assign("/"); // pakai assign biar bisa ditangani
        }
      }
    }

    return Promise.reject(err);
  }
);

export default instance;

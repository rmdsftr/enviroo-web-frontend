import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jika error 401 dan bukan dari request yang sudah di-retry
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      
      // Jika error berasal dari endpoint login atau refresh itu sendiri,
      // jangan coba refresh lagi untuk menghindari infinite loop.
      if (originalRequest.url?.includes("/auth/refresh") || originalRequest.url?.includes("/auth/login/web")) {
        if (window.location.pathname !== "/") {
          localStorage.removeItem("userData");
          window.location.href = "/";
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Panggil endpoint refresh token
        await api.post("/auth/refresh");
        
        // Ulangi request asli
        return api(originalRequest);
      } catch (refreshError) {
        // Jika refresh gagal, logout user
        if (window.location.pathname !== "/") {
          localStorage.removeItem("userData");
          window.location.href = "/";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
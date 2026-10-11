import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const AUTH_NOTICE_KEY = "authNotice";

export const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true,
});


const PUBLIC_AUTH_URLS = [
  "/auth/login",
  "/auth/logout",
  "/auth/aktivasi-akun",
  "/auth/forget-password/",
];

const NO_REFRESH_URLS = ["/auth/refresh"];

const isSessionRevoked = (error: unknown) =>
  axios.isAxiosError(error) &&
  (error.response?.data as { code?: string } | undefined)?.code === "SESSION_REVOKED";

const forceLogout = (error: unknown) => {
  if (window.location.pathname === "/") return;

  if (isSessionRevoked(error)) {
    sessionStorage.setItem(
      AUTH_NOTICE_KEY,
      "Sesi Anda berakhir karena akun digunakan di perangkat lain. Silakan login kembali."
    );
  }

  localStorage.removeItem("userData");
  window.location.href = "/";
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url ?? "";

    if (PUBLIC_AUTH_URLS.some((url) => requestUrl.includes(url))) {
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401 && !originalRequest._retry) {

      if (NO_REFRESH_URLS.some((url) => requestUrl.includes(url))) {
        forceLogout(error);
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        await api.post("/auth/refresh");

        return api(originalRequest);
      } catch (refreshError) {
        forceLogout(refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

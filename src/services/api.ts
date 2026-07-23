import axios, { type InternalAxiosRequestConfig } from "axios";
import { clearSession } from "../utils/auth";

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
  // Background traffic (heartbeat, auto-refresh) that should not flash the
  // global loading bar.
  _background?: boolean;
}

interface RefreshResponse {
  access: string;
}

const baseURL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL,
});

const isDev = import.meta.env.MODE === "development";

// Broadcast in-flight request count so a global progress bar can show while
// any action is talking to the server.
export const API_ACTIVITY_EVENT = "api-activity";
let activeRequests = 0;
const emitActivity = () => {
  window.dispatchEvent(new CustomEvent(API_ACTIVITY_EVENT, { detail: activeRequests }));
};
const startActivity = () => { activeRequests += 1; emitActivity(); };
const endActivity = () => { activeRequests = Math.max(0, activeRequests - 1); emitActivity(); };

api.interceptors.request.use(
  (config) => {
    if (!(config as RetryableRequest)._background) startActivity();
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `JWT ${token}`;
      if (isDev) {
        console.log("[AXIOS INTERCEPTOR] Token attached");
      }
    } else {
      if (isDev) {
        console.warn("[AXIOS INTERCEPTOR] No token found in localStorage");
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (!(response.config as RetryableRequest)._background) endActivity();
    return response;
  },
  async (error) => {
    if (!(error.config as RetryableRequest | undefined)?._background) endActivity();
    const request = error.config as RetryableRequest | undefined;
    const refreshToken = localStorage.getItem("refresh_token");

    // This account logged in somewhere else — the backend rejected our
    // session outright, so refreshing won't help. Sign out with a reason.
    if (error.response?.status === 401 && error.response.data?.code === "session_replaced") {
      clearSession();
      if (window.location.pathname !== "/login") window.location.assign("/login?reason=session-replaced");
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || !request || request._retry || !refreshToken) {
      return Promise.reject(error);
    }

    request._retry = true;

    try {
      const { data } = await axios.post<RefreshResponse>(
        "/auth/jwt/refresh/",
        { refresh: refreshToken },
        { baseURL }
      );
      localStorage.setItem("access_token", data.access);
      request.headers.Authorization = `JWT ${data.access}`;
      return api(request);
    } catch (refreshError) {
      clearSession();
      if (window.location.pathname !== "/login") window.location.assign("/login");
      return Promise.reject(refreshError);
    }
  }
);

export default api;

import axios, { type InternalAxiosRequestConfig } from "axios";

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshResponse {
  access: string;
}

const baseURL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL,
});

const isDev = import.meta.env.MODE === "development";

api.interceptors.request.use(
  (config) => {
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
  (response) => response,
  async (error) => {
    const request = error.config as RetryableRequest | undefined;
    const refreshToken = localStorage.getItem("refresh_token");

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
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      if (window.location.pathname !== "/login") window.location.assign("/login");
      return Promise.reject(refreshError);
    }
  }
);

export default api;

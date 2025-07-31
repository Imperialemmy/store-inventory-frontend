import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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

export default api;

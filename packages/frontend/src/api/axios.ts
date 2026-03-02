import axios from "axios";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (err) => Promise.reject(err),
);

api.interceptors.response.use(
  (response) => response,
  (err) => {
    return err.response;
  },
);

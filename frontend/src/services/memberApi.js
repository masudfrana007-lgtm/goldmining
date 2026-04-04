import axios from "axios";

const memberApi = axios.create({
  // ✅ Match your backend port (5040, not 5000)
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5040",
});

memberApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("member_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default memberApi;
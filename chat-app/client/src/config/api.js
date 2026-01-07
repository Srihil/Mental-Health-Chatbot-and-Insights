import axios from "axios";

// ✅ Set up base URL for Axios (adjust if you’re using a different backend port)
const API = axios.create({
  baseURL: "http://localhost:5000/api", // or just "/api" if using proxy
});

// ✅ Attach token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;

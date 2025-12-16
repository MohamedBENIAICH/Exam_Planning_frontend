import axios from "axios";

// Create a centralized axios instance
// This allows us to configure the base URL in one place
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
    },
});

// Add a response interceptor to handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // You can handle global errors here, like 401 Unauthorized
        if (error.response && error.response.status === 401) {
            // Handle unauthorized access (e.g., redirect to login)
            console.warn("Unauthorized access");
        }
        return Promise.reject(error);
    }
);

export default api;

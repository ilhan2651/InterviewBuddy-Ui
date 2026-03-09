// src/services/api.js
import axios from "axios";

// Production'da nginx zaten /api → backend yönlendiriyor
const API_URL = "/api";

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - JWT token ekleme
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - 401 yakalama
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

//
// AUTH ENDPOINTS
//

export const login = (email, password) =>
    apiClient.post("/Auth/login", { email, password });

export const register = (userData) =>
    apiClient.post("/Auth/register", userData);

export const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
};

//
// INTERVIEW ENDPOINTS
//

export const startInterview = (data) =>
    apiClient.post("/interview/start", data);

export const getCurrentQuestion = (sessionId, targetQuestionNumber = null) =>
    apiClient.get(`/interview/${sessionId}/current-question`, {
        params: targetQuestionNumber ? { targetQuestionNumber } : {},
    });

export const uploadAudio = (formData) =>
    apiClient.post("/interview/upload-audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

export const submitAnswer = (data) =>
    apiClient.post("/interview/submit-answer", data);

export const getInterviewReport = (sessionId) =>
    apiClient.get(`/interview/${sessionId}/report`);


export const getSimliConfig = async () => {
    const response = await apiClient.get("/Simli/config");
    return response.data;
};



export const getUserStats = () =>
    apiClient.get("/user/stats");

export const getRecentInterviews = () =>
    apiClient.get("/user/recent-interviews");

export const getUncompletedInterviews = () =>
    apiClient.get("/user/uncompleted-interviews");

export const getQuotaStatus = () =>
    apiClient.get("/user/quota-status");

export const updateApiKeys = (data) =>
    apiClient.post("/user/keys", data);

export default apiClient;
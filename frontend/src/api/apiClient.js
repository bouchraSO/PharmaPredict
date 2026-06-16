import axios from 'axios';

const API_BASE = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Dashboard
export const getDashboard = () => api.get('/api/dashboard');

// Medicaments
export const getMedicaments = () => api.get('/api/medicaments');
export const getMedicament = (id) => api.get(`/api/medicaments/${id}`);

// Historique
export const getHistorical = (id, limit = 100) =>
  api.get(`/api/historical/${id}?limit=${limit}`);

// Predictions
export const getAllPredictions = () => api.get('/api/predictions');
export const getPrediction = (id) => api.get(`/api/predictions/${id}`);
export const predictDemand = (data) => api.post('/api/predict', data);

// Recommendations
export const getRecommendations = (priorite = null) =>
  api.get(`/api/recommendations${priorite ? `?priorite=${priorite}` : ''}`);
export const getRecommendation = (id) => api.get(`/api/recommendations/${id}`);

// Model
export const getModelMetrics = () => api.get('/api/model/metrics');
export const getFeatureImportance = () => api.get('/api/model/features');

export default api;
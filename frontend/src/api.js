import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getApiUrl = () => API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests if available
api.interceptors.request.use(async (config) => {
  try {
    // Check if there's an auth token in localStorage (from Supabase)
    const authData = localStorage.getItem('sb-' + import.meta.env.VITE_SUPABASE_URL?.split('//')[1].split('.')[0] + '-auth-token');
    if (authData) {
      const { access_token } = JSON.parse(authData);
      if (access_token) {
        config.headers.Authorization = `Bearer ${access_token}`;
      }
    }
  } catch (error) {
    console.error('Error reading auth token:', error);
  }
  return config;
});

export const uploadShare = async (formData, authToken = null) => {
  try {
    const headers = {
      'Content-Type': 'multipart/form-data',
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    const response = await api.post('/shares/upload', formData, { headers });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const viewShare = async (shareId, password = null) => {
  try {
    const response = await api.post(`/shares/view/${shareId}`, { password });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getShareInfo = async (shareId) => {
  try {
    const response = await api.get(`/shares/info/${shareId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteShare = async (shareId, authToken = null) => {
  try {
    const headers = {};
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    const response = await api.delete(`/shares/delete/${shareId}`, { headers });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default api;

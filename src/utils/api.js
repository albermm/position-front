// src/utils/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://your-api-url.com'; // Replace with your actual API URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const signIn = async (username, password) => {
  const response = await api.post('/auth/signin', { username, password });
  await AsyncStorage.setItem('userToken', response.data.token);
  return response.data.user;
};

export const signUp = async (username, password) => {
  const response = await api.post('/auth/signup', { username, password });
  await AsyncStorage.setItem('userToken', response.data.token);
  return response.data.user;
};

export const uploadMedia = async (uri) => {
  const formData = new FormData();
  formData.append('media', {
    uri: uri,
    type: 'image/jpeg', // Adjust based on media type
    name: 'upload.jpg',
  });
  return api.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getDetectedPositions = async () => {
  const response = await api.get('/positions/detected');
  return response.data;
};

export const updatePositions = async (positions) => {
  return api.put('/positions/update', { positions });
};

export const getAnalysisData = async () => {
  const response = await api.get('/analysis');
  return response.data;
};

export const getRecommendations = async () => {
  const response = await api.get('/recommendations');
  return response.data;
};

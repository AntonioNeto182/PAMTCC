import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.127/simav_api',
  timeout: 15000,
});

export default api;
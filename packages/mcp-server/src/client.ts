import axios, { type AxiosInstance } from 'axios';

let currentToken: string | null = process.env.TIMER_API_TOKEN ?? null;
const BASE_URL = process.env.TIMER_API_URL ?? 'http://localhost:5000/';

function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use((config) => {
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    return config;
  });

  return instance;
}

export const httpClient = createAxiosInstance();

export function setToken(token: string): void {
  currentToken = token;
  httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function getToken(): string | null {
  return currentToken;
}

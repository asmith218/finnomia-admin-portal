import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export interface HealthData {
  overall_status: string;
  timestamp: string;
  services: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
  system_metrics: {
    cpu_percent: number;
    memory_percent: number;
    disk_usage: {
      total: number;
      used: number;
      free: number;
      percent: number;
    };
    network_connections: number;
  };
  services_detail: Array<{
    name: string;
    status: string;
    response_time: number | null;
    last_check: string;
    error_message: string | null;
  }>;
}

export const adminService = {
  async getHealth(): Promise<HealthData> {
    const response = await api.get('/health');
    return response.data;
  },

  async getServicesHealth() {
    const response = await api.get('/health/services');
    return response.data;
  },

  async getSystemHealth() {
    const response = await api.get('/health/system');
    return response.data;
  },

  async getServiceHealth(serviceName: string) {
    const response = await api.get(`/health/${serviceName}`);
    return response.data;
  }
};

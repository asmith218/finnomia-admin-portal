import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:8000';

// Enhanced logging utility
class Logger {
  private static log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      service: 'admin-portal'
    };
    
    if (level === 'info') {
      console.info(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
    } else if (level === 'warn') {
      console.warn(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
    } else if (level === 'error') {
      console.error(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
    } else if (level === 'debug') {
      console.debug(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
    }
    
    // Store logs in sessionStorage for debugging (keep last 100 entries)
    try {
      const logs = JSON.parse(sessionStorage.getItem('admin-portal-logs') || '[]');
      logs.push(logEntry);
      if (logs.length > 100) logs.shift();
      sessionStorage.setItem('admin-portal-logs', JSON.stringify(logs));
    } catch (e) {
      // Ignore storage errors
    }
  }

  static info(message: string, data?: any) {
    this.log('info', message, data);
  }

  static warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  static error(message: string, data?: any) {
    this.log('error', message, data);
  }

  static debug(message: string, data?: any) {
    this.log('debug', message, data);
  }
}

// Enhanced error types
export interface ApiError {
  message: string;
  status?: number;
  error_id?: string;
  timestamp?: string;
  details?: any;
  retryable?: boolean;
}

class AdminServiceError extends Error {
  public status?: number;
  public error_id?: string;
  public timestamp?: string;
  public retryable: boolean;
  public originalError?: any;

  constructor(message: string, options: Partial<ApiError> = {}) {
    super(message);
    this.name = 'AdminServiceError';
    this.status = options.status;
    this.error_id = options.error_id;
    this.timestamp = options.timestamp;
    this.retryable = options.retryable || false;
    this.originalError = options.details;
  }
}

// Retry utility
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      Logger.debug(`Attempting operation (attempt ${attempt}/${maxRetries})`);
      return await operation();
    } catch (error) {
      lastError = error as Error;
      Logger.warn(`Operation failed on attempt ${attempt}/${maxRetries}`, { error: error });

      if (attempt === maxRetries) {
        Logger.error('All retry attempts exhausted', { error: lastError });
        break;
      }

      // Check if error is retryable
      if (error instanceof AdminServiceError && !error.retryable) {
        Logger.info('Error is not retryable, stopping retry attempts');
        break;
      }

      // Wait before retrying with exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      Logger.info(`Waiting ${waitTime}ms before retry attempt ${attempt + 1}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError!;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    Logger.info(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    Logger.error('API Request Error', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    Logger.info(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      statusText: response.statusText,
      responseTime: response.headers['x-response-time'],
      dataSize: JSON.stringify(response.data).length
    });
    return response;
  },
  (error: AxiosError) => {
    const errorDetails = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
      responseData: error.response?.data
    };

    Logger.error('API Response Error', errorDetails);

    // Transform axios error to our custom error
    const apiError = transformAxiosError(error);
    return Promise.reject(apiError);
  }
);

// Error transformation utility
function transformAxiosError(error: AxiosError): AdminServiceError {
  const status = error.response?.status;
  const responseData = error.response?.data as any;

  // Handle different error scenarios
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return new AdminServiceError('Request timeout - the server took too long to respond', {
      status: 408,
      retryable: true,
      details: error
    });
  }

  if (error.code === 'ERR_NETWORK' || !error.response) {
    return new AdminServiceError('Network error - unable to connect to admin service', {
      status: 0,
      retryable: true,
      details: error
    });
  }

  // Handle server errors with structured response
  if (responseData && typeof responseData === 'object') {
    return new AdminServiceError(
      responseData.error || responseData.message || 'Server error occurred',
      {
        status,
        error_id: responseData.error_id,
        timestamp: responseData.timestamp,
        retryable: status ? status >= 500 : false,
        details: responseData
      }
    );
  }

  // Handle other HTTP errors
  const retryable = status ? status >= 500 : false;
  const message = status 
    ? `HTTP ${status}: ${error.response?.statusText || 'Unknown error'}`
    : 'Unknown error occurred';

  return new AdminServiceError(message, {
    status,
    retryable,
    details: error
  });
}

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
    Logger.info('Fetching overall health data');
    
    return withRetry(async () => {
      const response = await api.get('/admin/health');
      Logger.info('Successfully fetched overall health data', {
        status: response.data.overall_status,
        servicesTotal: response.data.services?.total,
        servicesHealthy: response.data.services?.healthy
      });
      return response.data;
    }, 3, 1000);
  },

  async getServicesHealth() {
    Logger.info('Fetching services health data');
    
    return withRetry(async () => {
      const response = await api.get('/admin/health/services');
      Logger.info('Successfully fetched services health data', {
        servicesCount: response.data.services?.length,
        summary: response.data.summary
      });
      return response.data;
    }, 3, 1000);
  },

  async getSystemHealth() {
    Logger.info('Fetching system health data');
    
    return withRetry(async () => {
      const response = await api.get('/admin/health/system');
      Logger.info('Successfully fetched system health data', {
        status: response.data.status,
        cpuUsage: response.data.system_metrics?.cpu_usage,
        memoryUsage: response.data.system_metrics?.memory_usage
      });
      return response.data;
    }, 3, 1000);
  },

  async getServiceHealth(serviceName: string) {
    Logger.info(`Fetching health data for service: ${serviceName}`);
    
    return withRetry(async () => {
      const response = await api.get(`/admin/health/${serviceName}`);
      Logger.info(`Successfully fetched health data for service: ${serviceName}`, {
        status: response.data.status,
        responseTime: response.data.response_time
      });
      return response.data;
    }, 2, 1000); // Fewer retries for individual service checks
  },

  // Utility methods for error handling and debugging
  getStoredLogs(): any[] {
    try {
      return JSON.parse(sessionStorage.getItem('admin-portal-logs') || '[]');
    } catch {
      return [];
    }
  },

  clearStoredLogs(): void {
    try {
      sessionStorage.removeItem('admin-portal-logs');
      Logger.info('Cleared stored logs');
    } catch (e) {
      Logger.warn('Failed to clear stored logs', e);
    }
  },

  // Health check with timeout and error details
  async healthCheck(): Promise<{ healthy: boolean; error?: string; details?: any }> {
    try {
      Logger.info('Performing admin service health check');
      const response = await api.get('/health', { timeout: 5000 });
      Logger.info('Admin service health check passed');
      return { healthy: true, details: response.data };
    } catch (error) {
      Logger.error('Admin service health check failed', error);
      return { 
        healthy: false, 
        error: error instanceof AdminServiceError ? error.message : 'Unknown error',
        details: error
      };
    }
  }
};

// Export utilities for debugging
export { Logger, AdminServiceError };

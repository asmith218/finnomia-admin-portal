import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import './Dashboard.css';

interface HealthData {
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

const Dashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getHealth();
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch health data');
      console.error('Health check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return '#28a745';
      case 'unhealthy': return '#dc3545';
      case 'degraded': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getServiceStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return '✅';
      case 'unhealthy': return '❌';
      case 'unknown': return '❓';
      default: return '⚪';
    }
  };

  if (loading && !healthData) {
    return <div className="dashboard-loading">Loading health data...</div>;
  }

  if (error && !healthData) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>System Health Dashboard</h2>
        <button onClick={fetchHealthData} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {healthData && (
        <>
          {/* Overall Status */}
          <div className="status-overview">
            <div className="status-card">
              <h3>Overall Status</h3>
              <div
                className="status-indicator"
                style={{ backgroundColor: getStatusColor(healthData.overall_status) }}
              >
                {healthData.overall_status.toUpperCase()}
              </div>
            </div>

            <div className="status-card">
              <h3>Services Summary</h3>
              <div className="services-summary">
                <div className="summary-item">
                  <span className="summary-label">Total:</span>
                  <span className="summary-value">{healthData.services.total}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Healthy:</span>
                  <span className="summary-value healthy">{healthData.services.healthy}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Unhealthy:</span>
                  <span className="summary-value unhealthy">{healthData.services.unhealthy}</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Metrics */}
          <div className="metrics-section">
            <h3>System Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-card">
                <h4>CPU Usage</h4>
                <div className="metric-value">{healthData.system_metrics.cpu_percent.toFixed(1)}%</div>
                <div className="metric-bar">
                  <div
                    className="metric-fill"
                    style={{ width: `${healthData.system_metrics.cpu_percent}%` }}
                  ></div>
                </div>
              </div>

              <div className="metric-card">
                <h4>Memory Usage</h4>
                <div className="metric-value">{healthData.system_metrics.memory_percent.toFixed(1)}%</div>
                <div className="metric-bar">
                  <div
                    className="metric-fill"
                    style={{ width: `${healthData.system_metrics.memory_percent}%` }}
                  ></div>
                </div>
              </div>

              <div className="metric-card">
                <h4>Disk Usage</h4>
                <div className="metric-value">{healthData.system_metrics.disk_usage.percent.toFixed(1)}%</div>
                <div className="metric-bar">
                  <div
                    className="metric-fill"
                    style={{ width: `${healthData.system_metrics.disk_usage.percent}%` }}
                  ></div>
                </div>
                <div className="disk-details">
                  {healthData.system_metrics.disk_usage.used.toFixed(1)} GB used of {healthData.system_metrics.disk_usage.total.toFixed(1)} GB
                </div>
              </div>

              <div className="metric-card">
                <h4>Network Connections</h4>
                <div className="metric-value">{healthData.system_metrics.network_connections}</div>
              </div>
            </div>
          </div>

          {/* Services Status */}
          <div className="services-section">
            <h3>Services Status</h3>
            <div className="services-grid">
              {healthData.services_detail.map((service) => (
                <div key={service.name} className="service-card">
                  <div className="service-header">
                    <span className="service-icon">{getServiceStatusIcon(service.status)}</span>
                    <h4>{service.name}</h4>
                  </div>

                  <div className="service-details">
                    <div className="service-metric">
                      <span className="metric-label">Status:</span>
                      <span
                        className="metric-value"
                        style={{ color: getStatusColor(service.status) }}
                      >
                        {service.status}
                      </span>
                    </div>

                    {service.response_time && (
                      <div className="service-metric">
                        <span className="metric-label">Response Time:</span>
                        <span className="metric-value">{service.response_time}ms</span>
                      </div>
                    )}

                    <div className="service-metric">
                      <span className="metric-label">Last Check:</span>
                      <span className="metric-value">
                        {new Date(service.last_check).toLocaleTimeString()}
                      </span>
                    </div>

                    {service.error_message && (
                      <div className="service-error">
                        <span className="error-label">Error:</span>
                        <span className="error-message">{service.error_message}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Last Updated */}
          <div className="last-updated">
            Last updated: {new Date(healthData.timestamp).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import './System.css';

interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network_connections: number;
}

interface SystemData {
  timestamp: string;
  system_metrics: SystemMetrics;
}

const System: React.FC = () => {
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSystemHealth();
      setSystemData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="system-page">
        <h1>System Metrics</h1>
        <div className="loading">Loading system data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="system-page">
        <h1>System Metrics</h1>
        <div className="error">Error: {error}</div>
        <button onClick={fetchSystemData} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!systemData) {
    return (
      <div className="system-page">
        <h1>System Metrics</h1>
        <div className="no-data">No system data available</div>
      </div>
    );
  }

  const { system_metrics } = systemData;

  return (
    <div className="system-page">
      <div className="page-header">
        <h1>System Metrics</h1>
        <div className="last-updated">
          Last updated: {new Date(systemData.timestamp).toLocaleString()}
        </div>
        <button onClick={fetchSystemData} className="refresh-button">
          Refresh
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>CPU Usage</h3>
          <div className="metric-value">
            <span className="value">{system_metrics.cpu_usage.toFixed(1)}%</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${system_metrics.cpu_usage}%`,
                  backgroundColor: system_metrics.cpu_usage > 80 ? '#e74c3c' : 
                                 system_metrics.cpu_usage > 60 ? '#f39c12' : '#27ae60'
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Memory Usage</h3>
          <div className="metric-value">
            <span className="value">{system_metrics.memory_usage.toFixed(1)}%</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${system_metrics.memory_usage}%`,
                  backgroundColor: system_metrics.memory_usage > 80 ? '#e74c3c' : 
                                 system_metrics.memory_usage > 60 ? '#f39c12' : '#27ae60'
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Disk Usage</h3>
          <div className="metric-value">
            <span className="value">{system_metrics.disk_usage.percentage.toFixed(1)}%</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${system_metrics.disk_usage.percentage}%`,
                  backgroundColor: system_metrics.disk_usage.percentage > 80 ? '#e74c3c' : 
                                 system_metrics.disk_usage.percentage > 60 ? '#f39c12' : '#27ae60'
                }}
              ></div>
            </div>
            <div className="disk-details">
              <small>
                Used: {(system_metrics.disk_usage.used / (1024**3)).toFixed(1)} GB / 
                Total: {(system_metrics.disk_usage.total / (1024**3)).toFixed(1)} GB
              </small>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Network Connections</h3>
          <div className="metric-value">
            <span className="value">{system_metrics.network_connections}</span>
            <div className="metric-label">Active connections</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default System;

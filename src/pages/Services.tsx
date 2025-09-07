import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService.ts';

interface ServiceData {
  name: string;
  status: string;
  response_time: number | null;
  last_check: string;
  error_message: string | null;
}

const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServicesData();
    const interval = setInterval(fetchServicesData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchServicesData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getServicesHealth();
      setServices(data.services);
      setError(null);
    } catch (err) {
      setError('Failed to fetch services data');
      console.error('Services fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return '#28a745';
      case 'unhealthy': return '#dc3545';
      case 'unknown': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return '✅';
      case 'unhealthy': return '❌';
      case 'unknown': return '❓';
      default: return '⚪';
    }
  };

  if (loading) {
    return <div className="services-loading">Loading services data...</div>;
  }

  if (error) {
    return <div className="services-error">Error: {error}</div>;
  }

  return (
    <div className="services">
      <div className="services-header">
        <h2>Services Health Monitor</h2>
        <button onClick={fetchServicesData} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="services-grid">
        {services.map((service) => (
          <div key={service.name} className="service-card detailed">
            <div className="service-header">
              <div className="service-title">
                <span className="service-icon">{getStatusIcon(service.status)}</span>
                <h3>{service.name}</h3>
              </div>
              <div
                className="service-status-badge"
                style={{ backgroundColor: getStatusColor(service.status) }}
              >
                {service.status.toUpperCase()}
              </div>
            </div>

            <div className="service-details">
              <div className="detail-row">
                <span className="detail-label">Response Time:</span>
                <span className="detail-value">
                  {service.response_time ? `${service.response_time}ms` : 'N/A'}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Last Check:</span>
                <span className="detail-value">
                  {new Date(service.last_check).toLocaleString()}
                </span>
              </div>

              {service.error_message && (
                <div className="detail-row error">
                  <span className="detail-label">Error:</span>
                  <span className="detail-value error-message">
                    {service.error_message}
                  </span>
                </div>
              )}
            </div>

            <div className="service-actions">
              <button
                onClick={() => adminService.getServiceHealth(service.name)}
                className="action-btn"
              >
                🔍 Check Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;

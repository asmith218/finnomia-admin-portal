import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import './Navigation.css';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="admin-nav">
      <div className="nav-header">
        <h1>FinNomia Admin Portal</h1>
        <p>Application Health Monitoring</p>
        {user && (
          <div className="user-info">
            <span className="user-email">{user.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              <span className="nav-icon">🚪</span>
              Logout
            </button>
          </div>
        )}
      </div>

      <ul className="nav-menu">
        <li className={location.pathname === '/' ? 'active' : ''}>
          <Link to="/">
            <span className="nav-icon">📊</span>
            Dashboard
          </Link>
        </li>
        <li className={location.pathname === '/services' ? 'active' : ''}>
          <Link to="/services">
            <span className="nav-icon">🔧</span>
            Services
          </Link>
        </li>
        <li className={location.pathname === '/system' ? 'active' : ''}>
          <Link to="/system">
            <span className="nav-icon">💻</span>
            System
          </Link>
        </li>
      </ul>

      <div className="nav-footer">
        <p>Status: <span className="status-indicator">●</span> Monitoring</p>
      </div>
    </nav>
  );
};

export default Navigation;

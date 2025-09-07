import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Services from './pages/Services.tsx';
import System from './pages/System.tsx';
import Navigation from './components/Navigation.tsx';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <ProtectedRoute>
            <Navigation />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/services" element={<Services />} />
                <Route path="/system" element={<System />} />
              </Routes>
            </main>
          </ProtectedRoute>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

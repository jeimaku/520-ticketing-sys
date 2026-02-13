import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CompanyPage from './pages/CompanyPage';
import TrackingPage from './pages/TrackingPage';
import AdminDashboard from './pages/AdminDashboard_Modular';
import HomePage from './pages/HomePage';
import HomePageGuard from './components/HomePageGuard';
import './index.css';

// 🔐 SECURITY: This is your Secret Admin URL.
// Only people who know this exact link (or the magic unlock key) can find the login page.
export const ADMIN_PATH = "/sys-admin-secure-access-520";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/portal/:portalCode" element={<CompanyPage />} />
          <Route path="/track/:token" element={<TrackingPage />} />
          
          {/* 🔐 The Secret Admin Route (Replaces standard /admin) */}
          <Route path={ADMIN_PATH} element={<AdminDashboard />} />
          
          {/* Root Route - Protected by Guard */}
          <Route 
            path="/" 
            element={
              <HomePageGuard>
                <HomePage />
              </HomePageGuard>
            } 
          />
          
          {/* Catch-all route for security */}
          <Route path="*" element={<AccessDeniedPage />} />
        </Routes>
      </div>
    </Router>
  );
}

// Catch-all component for unknown routes
const AccessDeniedPage = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    fontFamily: 'Segoe UI, sans-serif'
  }}>
    <div style={{ 
      background: 'white',
      padding: '3rem',
      borderRadius: '1rem',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      textAlign: 'center',
      maxWidth: '400px',
      border: '2px solid #fca5a5'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❓</div>
      <h2 style={{ color: '#dc2626', margin: '0 0 1rem 0' }}>Page Not Found</h2>
      <p style={{ color: '#7f1d1d', marginBottom: '2rem' }}>
        The page you're looking for doesn't exist or access is restricted.
      </p>
    </div>
  </div>
)

export default App;
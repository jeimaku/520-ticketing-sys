import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CompanyPage from './pages/CompanyPage';
import TrackingPage from './pages/TrackingPage';
import AdminDashboard from './pages/AdminDashboard_Modular';
import HomePage from './pages/HomePage';
import HomePageGuard from './components/HomePageGuard';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/company/:slug" element={<CompanyPage />} />
          <Route path="/track/:token" element={<TrackingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
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
      {/* <a 
        href="/admin"
        style={{ 
          color: '#4f46e5',
          textDecoration: 'none',
          fontWeight: '600'
        }}
      >
        Admin Login →
      </a> */}
    </div>
  </div>
)

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CompanyPage from './pages/CompanyPage';
import TrackingPage from './pages/TrackingPage';
import AdminDashboard from './pages/AdminDashboard_Modular';
import HomePage from './pages/HomePage';
import HomePageGuard from './components/HomePageGuard';
import './index.css';

// === STEP 1: DEFINE THE SPLIT ===
// This variable reads from your .env file or Vercel Environment Variables.
const ENABLE_ADMIN = import.meta.env.VITE_ENABLE_ADMIN === 'true';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* === PUBLIC ROUTES (Available on BOTH sites) === */}
          <Route path="/portal/:portalCode" element={<CompanyPage />} />
          <Route path="/track/:token" element={<TrackingPage />} />
          
          {/* === ROOT ROUTE LOGIC === */}
          <Route 
            path="/" 
            element={
              ENABLE_ADMIN ? (
                // ADMIN BUILD: Redirect root immediately to /admin
                // This triggers AdminDashboard, which will show AdminLogin if not authenticated.
                <Navigate to="/admin" replace />
              ) : (
                // CLIENT BUILD: Show the standard Homepage
                <HomePageGuard>
                  <HomePage />
                </HomePageGuard>
              )
            } 
          />

          {/* === ADMIN ROUTES (Only available if ENABLE_ADMIN is true) === */}
          {ENABLE_ADMIN ? (
            <>
              {/* If we are on the Admin Site, allow access */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
            </>
          ) : (
            <>
              {/* If we are on the Client Site, BLOCK access */}
              <Route path="/admin" element={<Navigate to="/" replace />} />
              <Route path="/admin/*" element={<Navigate to="/" replace />} />
            </>
          )}
          
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
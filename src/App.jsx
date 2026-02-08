// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CompanyPage from './pages/CompanyPage';
import TrackingPage from './pages/TrackingPage';
import AdminDashboard from './pages/AdminDashboard';
import HomePage from './pages/HomePage'; // Import the new file
import './index.css'; // You can keep this for global resets if needed, but remove tailwind imports from it

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/company/:slug" element={<CompanyPage />} />
          <Route path="/track/:token" element={<TrackingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
import React from 'react'
import '../styles/SettingsPage.css'


const SettingsPage = ({ currentAdmin }) => {
  return (
    <div className="page-content">
      <div className="content-header">
        <h1 className="page-title">System Settings</h1>
        <p style={{ color: '#64748b' }}>Configuration and system management</p>
      </div>

      <div className="settings-sections">
        <div className="settings-card">
          <h3>Admin Account</h3>
          <p>Logged in as: <strong>{currentAdmin?.email}</strong></p>
          <p>Session started: {new Date(currentAdmin?.loginTime).toLocaleString()}</p>
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#f0fdf4', 
            borderRadius: '0.5rem',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#166534' }}>
              <strong>Session Status:</strong> Active
            </div>
            <div style={{ fontSize: '0.8rem', color: '#15803d', marginTop: '0.25rem' }}>
              You are currently authenticated as a system administrator
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h3>System Information</h3>
          <p><strong>Application:</strong> Support Portal System v1.0</p>
          <p><strong>Organization:</strong> Five Twenty IT Services</p>
          <p><strong>Environment:</strong> Production</p>
          <div style={{ 
            marginTop: '1rem', 
            fontSize: '0.85rem', 
            color: '#64748b' 
          }}>
            Last system update: {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="settings-card">
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <a 
              href="/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-outline"
              style={{ textDecoration: 'none', textAlign: 'center' }}
            >
              🌐 View Public Portal
            </a>
            <button 
              className="btn-outline"
              onClick={() => window.location.reload()}
            >
              🔄 Refresh Dashboard
            </button>
            <button 
              className="btn-outline"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your local session data?')) {
                  localStorage.clear()
                  sessionStorage.clear()
                  alert('Local data cleared successfully!')
                }
              }}
            >
              🗑️ Clear Local Data
            </button>
          </div>
        </div>

        <div className="settings-card">
          <h3>Support Information</h3>
          <p><strong>Technical Support:</strong> sales@520itservices.com</p>
          <p><strong>Phone:</strong> +63 933 304 5384</p>
          <p><strong>Website:</strong> 
            <a 
              href="https://www.520itservices.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ marginLeft: '0.5rem', color: '#3b82f6' }}
            >
              www.520itservices.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import '../styles/HomePage.css'

const HomePage = () => {
  const [showCompanies, setShowCompanies] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [adminAccess, setAdminAccess] = useState(false)

  useEffect(() => {
    checkHomepageAccess()
  }, [])

  const checkHomepageAccess = async () => {
    try {
      // Method 1: Check if user came from admin session
      const adminSession = localStorage.getItem('adminSession')
      if (adminSession) {
        setAdminAccess(true)
        setShowCompanies(true)
        setIsCheckingAccess(false)
        return
      }

      // Method 2: Check referrer - if they came from a company page, allow
      if (document.referrer.includes('/company/')) {
        setShowCompanies(true)
        setIsCheckingAccess(false)
        return
      }

      // Method 3: Check for special admin access parameter
      const urlParams = new URLSearchParams(window.location.search)
      const adminKey = urlParams.get('admin_access')
      if (adminKey === 'fivetwenty_admin_2024') {
        setShowCompanies(true)
        setIsCheckingAccess(false)
        return
      }

      // Method 4: Check if they have any active company sessions
      const hasCompanySession = Object.keys(sessionStorage).some(key => 
        key.startsWith('company_access_')
      )
      if (hasCompanySession) {
        setShowCompanies(true)
        setIsCheckingAccess(false)
        return
      }

      // Default: Hide companies
      setShowCompanies(false)
      setIsCheckingAccess(false)

    } catch (error) {
      console.error('Access check failed:', error)
      setShowCompanies(false)
      setIsCheckingAccess(false)
    }
  }

  if (isCheckingAccess) {
    return (
      <div className="landing-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚡</div>
            <p style={{ color: '#64748b' }}>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="landing-container">
      <div className="hero-background">
        <div className="content-wrapper">
          {/* Hero Header */}
          <div className="hero-header">
            <div className="logo-container">
              <div className="logo-placeholder">
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎫</div>
                <div className="logo-text-main">FIVE TWENTY</div>
                <div className="logo-text-sub">IT SERVICES</div>
              </div>
            </div>
            
            <p className="hero-subtitle">
              Professional IT Support & Ticket Management System
            </p>
            
            <p className="quote-text">
              "Reliable technology solutions for modern businesses"
            </p>
          </div>

          {showCompanies ? (
            <>
              {/* Show company portals */}
              <div className="portals-section">
                <h2 className="section-title">Select Your Organization</h2>
                <div className="company-grid">
                  <CompanyCard 
                    icon="🏭"
                    title="Stahl Materials Philippines, Inc"
                    description="Industrial solutions and materials"
                    slug="stahl-materials"
                  />
                  <CompanyCard 
                    icon="💳"
                    title="Paysera"
                    description="Digital payment solutions"
                    slug="paysera"
                  />
                  <CompanyCard 
                    icon="🚀"
                    title="Launchpad Coworking"
                    description="Creative workspace and collaboration"
                    slug="launchpad-coworking"
                  />
                  <CompanyCard 
                    icon="💰"
                    title="Bestloan Credit Corporation"
                    description="Financial assistance and credit services"
                    slug="bestloan"
                  />
                </div>
              </div>

              {/* Admin Link */}
              <div className="admin-section">
                <Link to="/admin" className="admin-link">
                  🔧 Admin Dashboard
                </Link>
              </div>

              {adminAccess && (
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '1rem',
                  padding: '0.5rem',
                  background: '#f0fdf4',
                  borderRadius: '0.5rem',
                  border: '1px solid #bbf7d0'
                }}>
                  <span style={{ fontSize: '0.8rem', color: '#166534' }}>
                    👑 Admin Access Active
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Information message */}
              <div className="portals-section">
                <div style={{ 
                  textAlign: 'center',
                  background: 'white',
                  padding: '3rem 2rem',
                  borderRadius: '1rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                
                  <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
                    Our secure support platform provides streamlined ticket management 
                    and professional IT assistance for businesses. Ticketing portal 
                    access for efficient issue resolution.
                  </p>
                  
                  <div style={{ 
                    background: '#f8fafc',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    marginBottom: '1.5rem',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 1rem 0', 
                      color: '#1e293b',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}>
                      Contact Information
                    </h3>
                    <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.8' }}>
                      📧 <strong>Contact:</strong> <a href="mailto:sales@520itservices.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>sales@520itservices.com</a><br/>
                      📞 <strong>Phone:</strong> <a href="tel:+639333045384" style={{ color: '#3b82f6', textDecoration: 'none' }}>+63 933 304 5384</a><br/>
                      🌐 <strong>Website:</strong> <a href="https://www.520itservices.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>www.520itservices.com</a>
                    </div>
                  </div>

                  {/* Emergency admin access */}
                  <details style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    <summary style={{ cursor: 'pointer' }}>System Administrator</summary>
                    <div style={{ marginTop: '0.5rem' }}>
                      <Link 
                        to="/admin" 
                        style={{ 
                          color: '#6366f1',
                          textDecoration: 'none'
                        }}
                      >
                        Admin Login
                      </Link>
                    </div>
                  </details>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="main-footer">
        <p>&copy; 2024 Five Twenty IT Services. All rights reserved.</p>
      </footer>
    </div>
  )
}

const CompanyCard = ({ icon, title, description, slug }) => (
  <div className="fade-in-up">
    <Link to={`/company/${slug}`} className="company-card-link">
      <div className="company-card">
        <div className="card-icon">{icon}</div>
        <h3 className="card-title">{title}</h3>
        <p className="card-desc">{description}</p>
        <button className="card-btn">
          Access Portal →
        </button>
      </div>
    </Link>
  </div>
)

export default HomePage
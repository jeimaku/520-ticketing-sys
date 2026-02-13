import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getTheme } from '../styles/themes'
import '../styles/HomePage.css'

// CHECK THE FLAG
const IS_ADMIN_BUILD = import.meta.env.VITE_ENABLE_ADMIN === 'true'

const HomePage = () => {
  const [showCompanies, setShowCompanies] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [companies, setCompanies] = useState([])

  useEffect(() => {
    checkHomepageAccess()
  }, [])

  useEffect(() => {
    if (showCompanies) {
      fetchCompanies()
    }
  }, [showCompanies])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name')

      if (error) throw error
      setCompanies(data)
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const checkHomepageAccess = async () => {
    try {
      // SECURITY CHECK:
      // If this is the CLIENT build, we strictly IGNORE admin sessions.
      // This effectively "removes" the admin capability from this version of the site.
      if (IS_ADMIN_BUILD) {
        const adminSession = localStorage.getItem('adminSession')
        const urlParams = new URLSearchParams(window.location.search)
        const adminKey = urlParams.get('admin_access')

        if (adminSession || adminKey === 'fivetwenty_admin_2024') {
          setShowCompanies(true)
          setIsCheckingAccess(false)
          return
        }
      }

      // Standard Client Access Checks (Referrer / Session)
      if (document.referrer.includes('/company/') || document.referrer.includes('/portal/')) {
        setShowCompanies(true)
        setIsCheckingAccess(false)
        return
      }

      const hasCompanySession = Object.keys(sessionStorage).some(key => 
        key.startsWith('company_access_')
      )
      
      if (hasCompanySession) {
        setShowCompanies(true)
        setIsCheckingAccess(false)
        return
      }

      // Default: Access Denied
      setShowCompanies(false)
      setIsCheckingAccess(false)

    } catch (error) {
      console.error('Access check failed:', error)
      setShowCompanies(false)
      setIsCheckingAccess(false)
    }
  }

  const getCompanyDetails = (slug) => {
    const theme = getTheme(slug)
    const descriptions = {
      'stahl-materials': "Industrial solutions and materials",
      'paysera': "Digital payment solutions",
      'launchpad-coworking': "Creative workspace and collaboration",
      'bestloan': "Financial assistance and credit services"
    }
    return {
      icon: theme.logo || '🏢',
      description: descriptions[slug] || 'Support Portal'
    }
  }

  if (isCheckingAccess) {
    return (
      <div className="landing-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
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
          <div className="hero-header">
            <div className="logo-container">
              <div className="logo-placeholder">
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎫</div>
                <div className="logo-text-main">FIVE TWENTY</div>
                <div className="logo-text-sub">IT SERVICES</div>
              </div>
            </div>
            <p className="hero-subtitle">Professional IT Support & Ticket Management System</p>
            <p className="quote-text">"Reliable technology solutions for modern businesses"</p>
          </div>

          {showCompanies ? (
            <div className="portals-section">
              <h2 className="section-title">Select Your Organization</h2>
              <div className="company-grid">
                {companies.map((company) => {
                  const details = getCompanyDetails(company.slug)
                  return (
                    <CompanyCard 
                      key={company.id}
                      icon={details.icon}
                      title={company.name}
                      description={details.description}
                      link={`/portal/${company.portal_code || 'invalid'}`} 
                    />
                  )
                })}
                {companies.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#64748b', gridColumn: '1/-1' }}>
                    No company portals found.
                  </p>
                )}
              </div>
            </div>
          ) : (
             <div className="portals-section">
                <div style={{ textAlign: 'center', background: 'white', padding: '3rem 2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxWidth: '600px', margin: '0 auto' }}>
                  <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.6' }}>
                    Our secure support platform provides streamlined ticket management and professional IT assistance for businesses.
                  </p>
                  <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1rem', fontWeight: '600' }}>Contact Information</h3>
                    <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.8' }}>
                      📧 <strong>Contact:</strong> <a href="mailto:sales@520itservices.com">sales@520itservices.com</a><br/>
                      📞 <strong>Phone:</strong> <a href="tel:+639333045384">+63 933 304 5384</a>
                    </div>
                  </div>
                  
                  {/* VISUAL INDICATOR: Only show this "Admin Login" text if we are on the Admin Domain */}
                  {IS_ADMIN_BUILD && (
                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                       <Link to="/admin" style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'none' }}>
                         System Administrator Login
                       </Link>
                    </div>
                  )}
                </div>
              </div>
          )}
        </div>
      </div>
      <footer className="main-footer">
        <p>&copy; 2024 Five Twenty IT Services. All rights reserved.</p>
      </footer>
    </div>
  )
}

const CompanyCard = ({ icon, title, description, link }) => (
  <div className="fade-in-up">
    <Link to={link} className="company-card-link">
      <div className="company-card">
        <div className="card-icon">
          {typeof icon === 'string' && icon.startsWith('/') ? (
             <img src={icon} alt={title} style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
          ) : (
             icon 
          )}
        </div>
        <h3 className="card-title">{title}</h3>
        <p className="card-desc">{description}</p>
        <button className="card-btn">Access Portal →</button>
      </div>
    </Link>
  </div>
)

export default HomePage
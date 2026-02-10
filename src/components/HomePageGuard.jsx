import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { checkHomepageAccess } from '../utils/CompanyAccessManager'

const SimpleHomePageGuard = ({ children }) => {
  const [accessResult, setAccessResult] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      const result = await checkHomepageAccess()
      setAccessResult(result)
    } catch (error) {
      console.error('Access check failed:', error)
      setAccessResult({ allowed: false, type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1s linear infinite' }}>⚡</div>
          <p style={{ color: '#64748b' }}>Checking access...</p>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Redirect to company page if user has active company session
  if (accessResult?.redirectTo) {
    return <Navigate to={accessResult.redirectTo} replace />
  }

  // Show informational page for unauthorized users
  if (!accessResult?.allowed) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
        fontFamily: 'Segoe UI, sans-serif'
      }}>
        <div style={{ 
          background: 'white',
          padding: '3rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '500px',
          border: '2px solid #93c5fd'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🎫</div>
          <h2 style={{ 
            color: '#10b981', 
            margin: '0 0 0.5rem 0',
            fontSize: '1.5rem',
            fontWeight: '700'
          }}>
            FIVE TWENTY IT SERVICES
          </h2>
          <p style={{ 
            color: '#f97316', 
            marginBottom: '1.5rem', 
            fontSize: '0.9rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Professional IT Support & Ticket Management System
          </p>
          
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
          
          <a 
            href="/admin"
            style={{ 
              color: '#6366f1',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: '500'
            }}
          >
            System Administrator →
          </a>
        </div>
      </div>
    )
  }

  // Allow access for authorized users
  return children
}

export default SimpleHomePageGuard
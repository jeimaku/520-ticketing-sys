import React, { useState } from 'react'
// We assume CSS is imported in the parent or globally, 
// but referencing the classes we just created.

const AdminLogin = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Hardcoded check for demo purposes
      const validAdmins = [
        { email: 'admin@stahl-materials.com', password: 'admin123' },
        { email: 'admin@paysera.com', password: 'admin123' },
        { email: 'admin@launchpad.com', password: 'admin123' },
        { email: 'superadmin@system.com', password: 'superadmin123' }
      ]

      const adminFound = validAdmins.find(
        admin => admin.email === credentials.email && admin.password === credentials.password
      )

      if (adminFound) {
        localStorage.setItem('adminSession', JSON.stringify({
          email: adminFound.email,
          loginTime: new Date().toISOString()
        }))
        onLoginSuccess(adminFound)
      } else {
        setError('Invalid email or password')
      }
    } catch (error) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          {/* 520 Logo Style */}
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
             <span className="brand-text-main" style={{fontSize: '2.5rem'}}>FIVE TWENTY</span>
             <span className="brand-text-sub" style={{letterSpacing: '3px'}}>IT SERVICES</span>
          </div>
          <p style={{ color: '#64748b' }}>Authorized Personnel Only</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="admin-label">Email Address</label>
            <input
              name="email"
              type="email"
              required
              value={credentials.email}
              onChange={handleInputChange}
              className="admin-input"
              placeholder="Enter your admin email"
            />
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <label className="admin-label">Password</label>
            <input
              name="password"
              type="password"
              required
              value={credentials.password}
              onChange={handleInputChange}
              className="admin-input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{ 
              background: '#fee2e2', color: '#b91c1c', 
              padding: '0.75rem', borderRadius: '0.5rem', 
              marginBottom: '1.5rem', fontSize: '0.9rem' 
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
          >
            {isLoading ? 'Verifying...' : 'Access Dashboard'}
          </button>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', marginBottom: '0.5rem' }}>Demo Credentials:</p>
            <code style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textAlign: 'center', background: '#f8fafc', padding: '0.5rem', borderRadius: '0.25rem' }}>
              admin@stahl-materials.com / admin123
            </code>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Return to Home
          </a>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
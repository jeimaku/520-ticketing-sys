import React, { useState } from 'react'
import { supabase } from '../lib/supabase' // Ensure this import is present

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
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', credentials.email)
        .eq('password_hash', credentials.password) 
        .single()

      if (error || !data) {
        setError('Invalid email or password')
        return
      }

      const adminSession = {
        id: data.id,
        email: data.email,
        loginTime: new Date().toISOString()
      }

      localStorage.setItem('adminSession', JSON.stringify(adminSession))
      onLoginSuccess(adminSession)
      
    } catch (error) {
      console.error('Login error:', error)
      setError('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
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
              marginBottom: '1.5rem', fontSize: '0.9rem',
              textAlign: 'center' 
            }}>
              {error}
            </div>
          )}

          {/* UPDATED BUTTON SECTION */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{ width: 'auto', paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
            >
              {isLoading ? 'Verifying...' : 'Access Dashboard'}
            </button>
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
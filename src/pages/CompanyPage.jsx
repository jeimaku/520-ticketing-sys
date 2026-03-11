import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getTheme } from '../styles/themes'
import TicketForm from '../components/TicketForm'
import './../styles/CompanyPage.css'

const CompanyPage = () => {
  // 1. Change param to portalCode
  const { portalCode } = useParams()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(getTheme('default')) // Default state

  useEffect(() => {
    fetchCompany()
  }, [portalCode])

  const fetchCompany = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('portal_code', portalCode) 
        .single()

      if (error) throw error
      
      setCompany(data)
      
      // Check if the company has dynamic theme data from the database
      if (data) {
        if (data.logo_url) {
          // Use dynamic theme from Supabase
          setTheme({
            name: data.name,
            primary: data.primary_color,
            secondary: data.secondary_color,
            sidebarColor: data.sidebar_color,
            textColor: data.text_color,
            bgGradient: data.bg_gradient,
            formDark: data.form_dark,
            logo: data.logo_url
          })
        } else if (data.slug) {
          // Fallback to themes.js for your legacy companies (Paysera, Stahl, Bestloan, etc.)
          setTheme(getTheme(data.slug))
        }
      }
      
    } catch (error) {
      console.error('Error fetching company:', error)
      setCompany(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center'}}>Loading Portal...</div>
  }

  if (!company) {
    return (
      <div style={{ textAlign:'center', marginTop:'50px', fontFamily: 'Segoe UI' }}>
        <h2>⚠️ Access Denied</h2>
        <p>This portal link is invalid or has expired.</p>
      </div>
    )
  }

  const pageStyle = {
    '--theme-primary': theme.primary,
    '--theme-secondary': theme.secondary || theme.primary,
    '--theme-bg-gradient': theme.bgGradient,
    '--theme-sidebar': theme.sidebarColor,
    '--theme-text': theme.textColor
  };

  return (
    <div className="company-page-container" style={pageStyle}>
      <div className={`brand-sidebar ${theme.formDark ? 'dark-text' : ''}`}>
        {/* NEW CODE: Render as an image */}
        <div className="brand-icon">
          <img 
            src={theme.logo} 
            alt={`${theme.name} logo`} 
            style={{ 
              maxWidth: '150%', 
              maxHeight: '350px', // Limits height so it doesn't look too huge
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' // Adds a nice shadow
            }} 
          />
        </div>
        <h1 className="brand-name">{theme.name}</h1>
        <p className="brand-tagline">Official Support Portal</p>
        <div style={{ marginTop: '2rem', height: '4px', width: '50px', background: theme.formDark ? 'black' : 'white', opacity: 0.5 }}></div>
      </div>

      <div className="form-section">
        <div className="ticket-form-card">
          <TicketForm 
            companyId={company.id} 
            companyName={company.name} 
            theme={theme}
          />
          {/* Removed "Back to Hub" link to keep it isolated */}
        </div>
      </div>
    </div>
  )
}

export default CompanyPage
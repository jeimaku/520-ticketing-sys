import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getTheme } from '../styles/themes'
import TicketForm from '../components/TicketForm'
import './../styles/CompanyPage.css' // Import standard CSS

const CompanyPage = () => {
  const { slug } = useParams()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Get the theme configuration based on the URL slug
  const theme = getTheme(slug)

  useEffect(() => {
    fetchCompany()
  }, [slug])

  const fetchCompany = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) throw error
      setCompany(data)
    } catch (error) {
      console.error('Error fetching company:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center'}}>Loading Portal...</div>
  }

  if (!company) {
    return <div style={{ textAlign:'center', marginTop:'50px'}}>Company Portal Not Found</div>
  }

  // Inline styles to inject CSS Variables dynamically
  const pageStyle = {
    '--theme-primary': theme.primary,
    '--theme-secondary': theme.secondary || theme.primary,
    '--theme-bg-gradient': theme.bgGradient,
    '--theme-sidebar': theme.sidebarColor,
    '--theme-text': theme.textColor
  };

  return (
    <div className="company-page-container" style={pageStyle}>
      
      {/* Brand Sidebar (Left) */}
      <div className={`brand-sidebar ${theme.formDark ? 'dark-text' : ''}`}>
        <div className="brand-icon">{theme.logo}</div>
        <h1 className="brand-name">{theme.name}</h1>
        <p className="brand-tagline">Official Support Portal</p>
        <div style={{ marginTop: '2rem', height: '4px', width: '50px', background: theme.formDark ? 'black' : 'white', opacity: 0.5 }}></div>
      </div>

      {/* Form Section (Right) */}
      <div className="form-section">
        <div className="ticket-form-card">
          <TicketForm 
            companyId={company.id} 
            companyName={company.name} 
            theme={theme}
          />
          
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <a href="/" style={{ color: '#94a3b8', fontSize: '0.85rem', textDecoration: 'none' }}>
              &larr; Back to Hub
            </a>
          </div>
        </div>
      </div>

    </div>
  )
}

export default CompanyPage
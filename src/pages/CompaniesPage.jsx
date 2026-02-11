import React, { useState } from 'react'
import '../styles/CompaniesPage.css' // Assuming you have basic styles here or inherited

const CompaniesPage = ({ companies, tickets }) => {
  // State to track which link was just copied (for the "Copied!" tooltip effect)
  const [copiedId, setCopiedId] = useState(null)

  const handleCopyLink = (portalCode, companyId) => {
    // Construct the full URL
    const fullUrl = `${window.location.origin}/portal/${portalCode}`
    
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(companyId)
      // Reset the "Copied!" status after 2 seconds
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  return (
    <div className="page-content">
      <div className="content-header">
        <h1 className="page-title">Company Management</h1>
        <p style={{ color: '#64748b' }}>Manage organizations and their secret portal access links.</p>
      </div>

      <div className="companies-grid">
        {companies.map(company => {
          const companyTickets = tickets.filter(t => t.company_id === company.id)
          const portalLink = `/portal/${company.portal_code}`

          return (
            <div key={company.id} className="company-card" style={{ position: 'relative' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{company.name}</h3>
                <span style={{ 
                  background: '#f1f5f9', 
                  color: '#64748b', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem',
                  fontFamily: 'monospace'
                }}>
                  {company.slug}
                </span>
              </div>

              {/* Stats Row */}
              <div className="company-stats" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                <div>🎫 {companyTickets.length} Tickets</div>
                <div>📅 Joined {new Date(company.created_at).toLocaleDateString()}</div>
              </div>

              {/* Secure Link Section */}
              <div style={{ 
                background: '#f8fafc', 
                padding: '1rem', 
                borderRadius: '0.5rem', 
                border: '1px solid #e2e8f0',
                marginBottom: '1rem'
              }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.75rem', 
                  fontWeight: '700', 
                  color: '#94a3b8', 
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase'
                }}>
                  🔐 Secret Portal Link
                </label>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    readOnly 
                    value={`${window.location.origin}/portal/${company.portal_code || 'generating...'}`}
                    style={{
                      flex: 1,
                      background: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.375rem',
                      padding: '0.5rem',
                      fontSize: '0.85rem',
                      color: '#475569',
                      fontFamily: 'monospace'
                    }}
                    onClick={(e) => e.target.select()}
                  />
                  <button 
                    onClick={() => handleCopyLink(company.portal_code, company.id)}
                    style={{
                      background: copiedId === company.id ? '#10b981' : 'white',
                      color: copiedId === company.id ? 'white' : '#64748b',
                      border: `1px solid ${copiedId === company.id ? '#10b981' : '#cbd5e1'}`,
                      borderRadius: '0.375rem',
                      padding: '0.5rem 1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: '600',
                      fontSize: '0.85rem'
                    }}
                  >
                    {copiedId === company.id ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <a 
                href={portalLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-outline"
                style={{ 
                  display: 'block', 
                  textAlign: 'center', 
                  textDecoration: 'none',
                  marginTop: 'auto' // Pushes button to bottom if cards have different heights
                }}
              >
                Test Portal View →
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CompaniesPage
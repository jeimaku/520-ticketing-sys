import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/CompaniesPage.css' 

const CompaniesPage = ({ companies, tickets }) => {
  const [copiedId, setCopiedId] = useState(null)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newCompany, setNewCompany] = useState({ 
    name: '', 
    slug: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    sidebarColor: '#1e293b',
    formDark: false,
    logoFile: null,
    logoPreview: null
  })

  const handleCopyLink = (portalCode, companyId) => {
    const fullUrl = `${window.location.origin}/portal/${portalCode}`
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(companyId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setNewCompany({
        ...newCompany,
        logoFile: file,
        logoPreview: URL.createObjectURL(file)
      })
    }
  }

  const handleCreateCompany = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // 1. Safely format the slug (forces it to be a string, even if undefined)
    const safeSlug = String(newCompany.slug || '').toLowerCase().replace(/\s+/g, '-')

    // 2. Double-check that we actually have a slug before proceeding
    if (!safeSlug) {
      alert('Please provide a Theme Slug.')
      setIsSubmitting(false)
      return
    }

    try {
      let logoUrl = null

      // 3. Upload logo if provided
      if (newCompany.logoFile) {
        const fileExt = newCompany.logoFile.name.split('.').pop()
        const fileName = `${safeSlug}-${Date.now()}.${fileExt}` 
        
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, newCompany.logoFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('logos')
          .getPublicUrl(fileName)
          
        logoUrl = publicUrl
      }

      // 4. Insert into database
      const { error } = await supabase
        .from('companies')
        .insert([{ 
          name: newCompany.name, 
          slug: safeSlug, 
          logo_url: logoUrl,
          primary_color: newCompany.primaryColor,
          secondary_color: newCompany.secondaryColor,
          sidebar_color: newCompany.sidebarColor,
          form_dark: newCompany.formDark,
          text_color: newCompany.formDark ? '#1a1a1a' : '#ffffff',
          bg_gradient: `linear-gradient(135deg, ${newCompany.primaryColor}22 0%, #f1f5f9 100%)`
        }])

      if (error) throw error

      alert('Portal created successfully! Please refresh the page to see it.')
      setIsModalOpen(false)
      // Reset form
      setNewCompany({ name: '', slug: '', primaryColor: '#3b82f6', secondaryColor: '#1e40af', sidebarColor: '#1e293b', formDark: false, logoFile: null, logoPreview: null })
        
    } catch (error) {
      console.error('Error creating company:', error)
      alert('Failed to create portal: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-content">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Company Management</h1>
          <p style={{ color: '#64748b' }}>Manage organizations and their secret portal access links.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Add New Portal
        </button>
      </div>

{/* THE LAYOUT CONTAINER (Switched to Flexbox) */}
      <div 
        className="companies-grid"
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '2rem',        /* Standard flex spacing */
          alignItems: 'stretch'
        }}
      >
        {companies.map(company => {
          const companyTickets = tickets?.filter(t => t.company_id === company.id) || []
          const portalLink = `/portal/${company.portal_code}`

          return (
            <div 
              key={company.id} 
              className="company-card"
              style={{
                flex: '1 1 320px',    /* Allows card to grow and sets base width to 320px */
                maxWidth: '100%',     /* Prevents overflow */
                display: 'flex',
                flexDirection: 'column',
                minHeight: '260px',
                marginBottom: '2rem'  /* Bulletproof fallback if the gap fails */
              }}
            >
              {/* HEADER: Logo and Name */}
              <div className="company-card-header">
                <div className="company-logo-container">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={`${company.name} logo`} className="company-logo-thumb" />
                  ) : (
                    <div className="company-logo-placeholder">
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="company-header-text">
                  <h3>{company.name}</h3>
                  <span className="badge-slug">{company.slug}</span>
                </div>
              </div>

              {/* BODY: Quick Stats */}
              <div className="company-card-body" style={{ flexGrow: 1 }}>
                <div className="stat-box">
                  <span className="stat-label">Total Tickets</span>
                  <span className="stat-value">{companyTickets.length}</span>
                </div>
              </div>

              {/* FOOTER: Actions */}
              <div className="company-card-footer" style={{ marginTop: 'auto' }}>
                <button 
                  onClick={() => handleCopyLink(company.portal_code, company.id)}
                  className={`btn-copy ${copiedId === company.id ? 'copied' : ''}`}
                >
                  {copiedId === company.id ? '✓ Link Copied' : '🔗 Copy Link'}
                </button>
                <a 
                  href={portalLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-test"
                >
                  Test Portal &rarr;
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginTop: 0 }}>Create New Company Portal</h2>
            <form onSubmit={handleCreateCompany}>
              
              <div className="form-group">
                <label>Company Name</label>
                <input type="text" required value={newCompany.name} onChange={(e) => setNewCompany({...newCompany, name: e.target.value})} placeholder="e.g. Acme Corp" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
              </div>
              
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Theme Slug</label>
                <input type="text" required value={newCompany.slug} onChange={(e) => setNewCompany({...newCompany, slug: e.target.value})} placeholder="e.g. acme-corp" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
              </div>

              <h3 style={{ marginTop: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Brand Theme</h3>
              
              <div className="form-group">
                <label>Company Logo</label>
                <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'block', marginTop: '0.5rem' }} />
                {newCompany.logoPreview && (
                  <img src={newCompany.logoPreview} alt="Preview" style={{ marginTop: '1rem', maxHeight: '80px', objectFit: 'contain' }} />
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.9rem' }}>Primary</label>
                  <input type="color" value={newCompany.primaryColor} onChange={(e) => setNewCompany({...newCompany, primaryColor: e.target.value})} style={{ width: '100%', height: '40px', marginTop: '0.25rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.9rem' }}>Secondary</label>
                  <input type="color" value={newCompany.secondaryColor} onChange={(e) => setNewCompany({...newCompany, secondaryColor: e.target.value})} style={{ width: '100%', height: '40px', marginTop: '0.25rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.9rem' }}>Sidebar</label>
                  <input type="color" value={newCompany.sidebarColor} onChange={(e) => setNewCompany({...newCompany, sidebarColor: e.target.value})} style={{ width: '100%', height: '40px', marginTop: '0.25rem' }} />
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newCompany.formDark} onChange={(e) => setNewCompany({...newCompany, formDark: e.target.checked})} />
                  Use Dark Text in Sidebar (Check if sidebar color is very light)
                </label>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                  {isSubmitting ? 'Creating...' : 'Create Portal'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompaniesPage
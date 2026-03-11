import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import '../styles/CompaniesPage.css' 

const CompaniesPage = ({ companies, tickets }) => {
  const [copiedId, setCopiedId] = useState(null)
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newCompany, setNewCompany] = useState({ 
    name: '', slug: '', primaryColor: '#3b82f6', secondaryColor: '#1e40af', sidebarColor: '#1e293b', formDark: false, logoFile: null, logoPreview: null
  })

  // EDIT Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)

  const handleCopyLink = (portalCode, companyId) => {
    const fullUrl = `${window.location.origin}/portal/${portalCode}`
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedId(companyId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const handleLogoChange = (e, isEdit = false) => {
    const file = e.target.files[0]
    if (file) {
      if (isEdit) {
        setEditingCompany({ ...editingCompany, logoFile: file, logoPreview: URL.createObjectURL(file) })
      } else {
        setNewCompany({ ...newCompany, logoFile: file, logoPreview: URL.createObjectURL(file) })
      }
    }
  }

  // --- CREATE COMPANY LOGIC ---
  const handleCreateCompany = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const safeSlug = String(newCompany.slug || '').toLowerCase().replace(/\s+/g, '-')

    if (!safeSlug) {
      alert('Please provide a Theme Slug.')
      setIsSubmitting(false)
      return
    }

    try {
      let logoUrl = null
      if (newCompany.logoFile) {
        const fileExt = newCompany.logoFile.name.split('.').pop()
        const fileName = `${safeSlug}-${Date.now()}.${fileExt}` 
        const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, newCompany.logoFile)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName)
        logoUrl = publicUrl
      }

      const { error } = await supabase.from('companies').insert([{ 
        name: newCompany.name, 
        slug: safeSlug, 
        logo_url: logoUrl,
        primary_color: newCompany.primaryColor,
        secondary_color: newCompany.secondaryColor,
        sidebar_color: newCompany.sidebarColor,
        form_dark: newCompany.formDark,
        text_color: newCompany.formDark ? '#1a1a1a' : '#ffffff',
        bg_gradient: `linear-gradient(135deg, ${newCompany.primaryColor}22 0%, #f1f5f9 100%)`,
        is_active: true
      }])

      if (error) throw error
      alert('Portal created successfully! Please refresh the page to see it.')
      setIsModalOpen(false)
      setNewCompany({ name: '', slug: '', primaryColor: '#3b82f6', secondaryColor: '#1e40af', sidebarColor: '#1e293b', formDark: false, logoFile: null, logoPreview: null })
    } catch (error) {
      alert('Failed to create portal: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- OPEN EDIT MODAL ---
  const openEditModal = (company) => {
    setEditingCompany({
      id: company.id,
      name: company.name,
      slug: company.slug,
      primaryColor: company.primary_color || '#3b82f6',
      secondaryColor: company.secondary_color || '#1e40af',
      sidebarColor: company.sidebar_color || '#1e293b',
      formDark: company.form_dark || false,
      isActive: company.is_active !== false, // Defaults to true if null
      existingLogoUrl: company.logo_url,
      logoFile: null,
      logoPreview: company.logo_url || null
    })
    setIsEditModalOpen(true)
  }

  // --- UPDATE COMPANY LOGIC ---
  const handleUpdateCompany = async (e) => {
    e.preventDefault()
    setIsUpdating(true)
    const safeSlug = String(editingCompany.slug || '').toLowerCase().replace(/\s+/g, '-')

    try {
      let logoUrl = editingCompany.existingLogoUrl

      // Upload new logo ONLY if a new file was selected
      if (editingCompany.logoFile) {
        const fileExt = editingCompany.logoFile.name.split('.').pop()
        const fileName = `${safeSlug}-${Date.now()}.${fileExt}` 
        const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, editingCompany.logoFile)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName)
        logoUrl = publicUrl
      }

      const { error } = await supabase.from('companies').update({ 
        name: editingCompany.name, 
        slug: safeSlug, 
        logo_url: logoUrl,
        primary_color: editingCompany.primaryColor,
        secondary_color: editingCompany.secondaryColor,
        sidebar_color: editingCompany.sidebarColor,
        form_dark: editingCompany.formDark,
        text_color: editingCompany.formDark ? '#1a1a1a' : '#ffffff',
        bg_gradient: `linear-gradient(135deg, ${editingCompany.primaryColor}22 0%, #f1f5f9 100%)`,
        is_active: editingCompany.isActive
      }).eq('id', editingCompany.id)

      if (error) throw error
      alert('Portal updated successfully! Please refresh the page to see changes.')
      setIsEditModalOpen(false)
    } catch (error) {
      alert('Failed to update portal: ' + error.message)
    } finally {
      setIsUpdating(false)
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

      {/* THE LAYOUT CONTAINER (Flexbox) */}
      <div 
        className="companies-grid"
        style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'stretch' }}
      >
        {companies.map(company => {
          const companyTickets = tickets?.filter(t => t.company_id === company.id) || []
          const portalLink = `/portal/${company.portal_code}`
          const isInactive = company.is_active === false

          return (
            <div 
              key={company.id} 
              className="company-card"
              style={{
                flex: '1 1 320px', maxWidth: '100%', display: 'flex', flexDirection: 'column', minHeight: '260px', marginBottom: '2rem',
                opacity: isInactive ? 0.7 : 1, // Dims the card if inactive
                filter: isInactive ? 'grayscale(50%)' : 'none'
              }}
            >
              {/* HEADER */}
              <div className="company-card-header">
                <div className="company-logo-container">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={`${company.name} logo`} className="company-logo-thumb" />
                  ) : (
                    <div className="company-logo-placeholder">{company.name.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <div className="company-header-text">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3>{company.name}</h3>
                    {isInactive && <span style={{ fontSize: '0.7rem', background: '#ef4444', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>INACTIVE</span>}
                  </div>
                  <span className="badge-slug">{company.slug}</span>
                </div>
              </div>

              {/* BODY */}
              <div className="company-card-body" style={{ flexGrow: 1 }}>
                <div className="stat-box">
                  <span className="stat-label">Total Tickets</span>
                  <span className="stat-value">{companyTickets.length}</span>
                </div>
              </div>

              {/* FOOTER: Actions */}
              <div className="company-card-footer" style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => openEditModal(company)} style={{ flex: '1', minWidth: '80px', padding: '0.6rem', border: '1px solid #cbd5e1', background: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>
                  ✏️ Edit
                </button>
                <button onClick={() => handleCopyLink(company.portal_code, company.id)} className={`btn-copy ${copiedId === company.id ? 'copied' : ''}`} style={{ flex: '1', minWidth: '100px', padding: '0.6rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                  {copiedId === company.id ? '✓ Copied' : '🔗 Copy'}
                </button>
                <a href={portalLink} target="_blank" rel="noopener noreferrer" className="btn-test" style={{ flex: '1', minWidth: '100px', padding: '0.6rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', textAlign: 'center', textDecoration: 'none' }}>
                  Test &rarr;
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginTop: 0 }}>Create New Company Portal</h2>
            <form onSubmit={handleCreateCompany}>
              <div className="form-group">
                <label>Company Name</label>
                <input type="text" required value={newCompany.name} onChange={(e) => setNewCompany({...newCompany, name: e.target.value})} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Theme Slug</label>
                <input type="text" required value={newCompany.slug} onChange={(e) => setNewCompany({...newCompany, slug: e.target.value})} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>
              <h3 style={{ marginTop: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Brand Theme</h3>
              <div className="form-group">
                <label>Company Logo</label>
                <input type="file" accept="image/*" onChange={(e) => handleLogoChange(e, false)} style={{ display: 'block', marginTop: '0.5rem' }} />
                {newCompany.logoPreview && <img src={newCompany.logoPreview} alt="Preview" style={{ marginTop: '1rem', maxHeight: '80px', objectFit: 'contain' }} />}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.9rem' }}>Primary</label><input type="color" value={newCompany.primaryColor} onChange={(e) => setNewCompany({...newCompany, primaryColor: e.target.value})} style={{ width: '100%', height: '40px' }} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.9rem' }}>Secondary</label><input type="color" value={newCompany.secondaryColor} onChange={(e) => setNewCompany({...newCompany, secondaryColor: e.target.value})} style={{ width: '100%', height: '40px' }} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.9rem' }}>Sidebar</label><input type="color" value={newCompany.sidebarColor} onChange={(e) => setNewCompany({...newCompany, sidebarColor: e.target.value})} style={{ width: '100%', height: '40px' }} /></div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={newCompany.formDark} onChange={(e) => setNewCompany({...newCompany, formDark: e.target.checked})} />
                  Use Dark Text in Sidebar
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>{isSubmitting ? 'Creating...' : 'Create Portal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingCompany && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginTop: 0 }}>Edit Portal: {editingCompany.name}</h2>
            <form onSubmit={handleUpdateCompany}>
              
              {/* ACTIVE TOGGLE */}
              <div style={{ background: editingCompany.isActive ? '#f0fdf4' : '#fef2f2', border: `1px solid ${editingCompany.isActive ? '#bbf7d0' : '#fecaca'}`, padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" id="isActiveToggle" checked={editingCompany.isActive} onChange={(e) => setEditingCompany({...editingCompany, isActive: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <label htmlFor="isActiveToggle" style={{ cursor: 'pointer', color: editingCompany.isActive ? '#15803d' : '#b91c1c', fontWeight: 'bold' }}>
                  {editingCompany.isActive ? 'Portal is Currently LIVE' : 'Portal is Currently INACTIVE'}
                </label>
              </div>

              <div className="form-group">
                <label>Company Name</label>
                <input type="text" required value={editingCompany.name} onChange={(e) => setEditingCompany({...editingCompany, name: e.target.value})} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Theme Slug</label>
                <input type="text" required value={editingCompany.slug} onChange={(e) => setEditingCompany({...editingCompany, slug: e.target.value})} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              </div>

              <h3 style={{ marginTop: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Brand Theme</h3>
              <div className="form-group">
                <label>Update Logo (Leave blank to keep current)</label>
                <input type="file" accept="image/*" onChange={(e) => handleLogoChange(e, true)} style={{ display: 'block', marginTop: '0.5rem' }} />
                {editingCompany.logoPreview && <img src={editingCompany.logoPreview} alt="Preview" style={{ marginTop: '1rem', maxHeight: '80px', objectFit: 'contain' }} />}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.9rem' }}>Primary</label><input type="color" value={editingCompany.primaryColor} onChange={(e) => setEditingCompany({...editingCompany, primaryColor: e.target.value})} style={{ width: '100%', height: '40px' }} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.9rem' }}>Secondary</label><input type="color" value={editingCompany.secondaryColor} onChange={(e) => setEditingCompany({...editingCompany, secondaryColor: e.target.value})} style={{ width: '100%', height: '40px' }} /></div>
                <div style={{ flex: 1 }}><label style={{ fontSize: '0.9rem' }}>Sidebar</label><input type="color" value={editingCompany.sidebarColor} onChange={(e) => setEditingCompany({...editingCompany, sidebarColor: e.target.value})} style={{ width: '100%', height: '40px' }} /></div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editingCompany.formDark} onChange={(e) => setEditingCompany({...editingCompany, formDark: e.target.checked})} />
                  Use Dark Text in Sidebar
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}>Cancel</button>
                <button type="submit" disabled={isUpdating} style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}>
                  {isUpdating ? 'Saving...' : 'Save Changes'}
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
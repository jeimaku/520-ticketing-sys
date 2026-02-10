import React from 'react'
import '../styles/CompaniesPage.css'


const CompaniesPage = ({ companies, tickets }) => {
  return (
    <div className="page-content">
      <div className="content-header">
        <h1 className="page-title">Company Management</h1>
        <p style={{ color: '#64748b' }}>Manage organizations and their portal access</p>
      </div>

      <div className="companies-grid">
        {companies.map(company => {
          const companyTickets = tickets.filter(t => t.company_id === company.id)
          return (
            <div key={company.id} className="company-card">
              <h3>{company.name}</h3>
              <p>Slug: <code>{company.slug}</code></p>
              <div className="company-stats">
                <div>Total Tickets: {companyTickets.length}</div>
                <div>Created: {new Date(company.created_at).toLocaleDateString()}</div>
              </div>
              <a 
                href={`/company/${company.slug}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-outline"
              >
                Visit Portal →
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CompaniesPage
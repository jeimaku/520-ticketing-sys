import React from 'react'
import ExportControls from '../components/ExportControls'
import '../styles/TicketsPage.css'

const TicketsPage = ({ 
  tickets, 
  companies, 
  filters, 
  handleFilterChange, 
  clearAllFilters, 
  updateTicketStatus, 
  setSelectedTicket 
}) => {
  return (
    <div className="tickets-page">
      <div className="tickets-header">
        <h1 className="tickets-title">Ticket Overview</h1>
        <span className="tickets-count">Showing {tickets.length} tickets</span>
      </div>

      {/* Filters & Controls */}
      <div className="tickets-filter-card">
        <div className="tickets-filter-header">
          <h2 className="tickets-filter-title">Search & Filter</h2>
          <ExportControls 
            tickets={tickets} 
            companies={companies} 
            filters={filters}
          />
        </div>

        <div className="tickets-filter-grid">
          <div>
            <label className="admin-label">Search</label>
            <input
              type="text"
              placeholder="Keyword..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="admin-input"
            />
          </div>

          <div>
            <label className="admin-label">Company</label>
            <select
              value={filters.company}
              onChange={(e) => handleFilterChange('company', e.target.value)}
              className="admin-select"
            >
              <option value="all">All Organizations</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="admin-label">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="admin-select"
            >
              <option value="all">Any Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={clearAllFilters} className="btn-outline" style={{ width: '100%' }}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="tickets-table-container">
        <div style={{ overflowX: 'auto' }}>
          <table className="tickets-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Issue Description</th>
                <th>Status</th>
                <th>Tracking</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="tickets-empty-state">
                    No tickets found matching your criteria.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="ticket-date">
                      {new Date(ticket.created_at).toLocaleDateString()}
                      <span className="ticket-date-time">
                        {new Date(ticket.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </td>
                    <td>
                      <div className="ticket-company-name">
                        {companies.find(c => c.id === ticket.company_id)?.name || ticket.companies?.name || 'Unknown'}
                      </div>
                      <div className="ticket-company-location">{ticket.location}</div>
                    </td>
                    <td>
                      <div className="ticket-contact-name">{ticket.contact_name}</div>
                      <div className="ticket-contact-email">{ticket.contact_email}</div>
                    </td>
                    <td>
                      <div className="ticket-issue" title={ticket.issue_description}>
                        {ticket.issue_description}
                      </div>
                    </td>
                    <td>
                      <span className={`ticket-status-badge status-${ticket.status}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <a 
                        href={`/track/${ticket.tracking_token}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ticket-tracking-link"
                      >
                        View
                        <svg className="ticket-tracking-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </td>
                    <td>
                      <div className="ticket-actions">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="ticket-chat-btn"
                          title="Open Chat Thread"
                        >
                          <span>💬</span> Chat
                        </button>

                        <select
                          value={ticket.status}
                          onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                          className="ticket-status-select"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TicketsPage
import React, { useState, useEffect } from 'react'
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

  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Reset to page 1 whenever filters change the total ticket count
  useEffect(() => {
    setCurrentPage(1)
  }, [tickets.length])

  // --- Pagination Math ---
  const indexOfLastTicket = currentPage * rowsPerPage
  const indexOfFirstTicket = indexOfLastTicket - rowsPerPage
  const currentTickets = tickets.slice(indexOfFirstTicket, indexOfLastTicket)
  const totalPages = Math.ceil(tickets.length / rowsPerPage)

  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value))
    setCurrentPage(1) // Reset to first page when changing row count
  }

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

        <div className="tickets-filter-container">
          {/* Row 1: Prominent Search */}
          <div className="filter-row">
            <div className="filter-group full-width">
              <label className="admin-label">Search Tickets</label>
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by keyword, contact name, or ticket ID..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="admin-input search-input"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Dropdowns & Sorting */}
          <div className="filter-row">
            <div className="filter-group">
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

            <div className="filter-group">
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

            <div className="filter-group">
              <label className="admin-label">Sort By Date</label>
              <select
                value={filters.sortOrder}
                onChange={(e) => {
                  handleFilterChange('sortBy', 'created_at');
                  handleFilterChange('sortOrder', e.target.value);
                }}
                className="admin-select"
              >
                <option value="desc">Latest First (Newest)</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Row 3: Date Range & Reset */}
          <div className="filter-row align-bottom">
            <div className="filter-group date-filter">
              <label className="admin-label">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="admin-input"
              />
            </div>
            
            <div className="filter-group date-filter">
              <label className="admin-label">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="admin-input"
              />
            </div>

            {/* 👇 Changed from 'button-group' to 'reset-wrapper' 👇 */}
            <div className="filter-group reset-wrapper">
              <button onClick={clearAllFilters} className="btn-outline clear-filters-btn">
                <span style={{ fontSize: '1.1rem' }}>↺</span> Reset Filters
              </button>
            </div>
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
              {currentTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="tickets-empty-state">
                    No tickets found matching your criteria.
                  </td>
                </tr>
              ) : (
                currentTickets.map((ticket) => (
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
          {/* Pagination Footer */}
          {tickets.length > 0 && (
            <div className="pagination-footer">
              <div className="pagination-info">
                Showing {indexOfFirstTicket + 1} to {Math.min(indexOfLastTicket, tickets.length)} of {tickets.length} entries
              </div>
              
              <div className="pagination-controls">
                <div className="rows-per-page">
                  <label htmlFor="rows">Rows per page:</label>
                  <select id="rows" value={rowsPerPage} onChange={handleRowsChange} className="rows-select">
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="page-buttons">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="page-btn"
                  >
                    Previous
                  </button>
                  
                  <span className="page-indicator">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="page-btn"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TicketsPage
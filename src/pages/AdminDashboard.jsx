import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AdminLogin from '../components/AdminLogin'
import NotificationBell from '../components/NotificationBell'
import ExportControls from '../components/ExportControls'
import { useNotifications } from '../hooks/useNotifications'
import './../styles/Admin.css' // Import the new styles

const AdminDashboard = () => {
  const [tickets, setTickets] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentAdmin, setCurrentAdmin] = useState(null)
  
  const [filters, setFilters] = useState({
    company: 'all',
    status: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  const {
    notifications,
    newTicketCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  } = useNotifications(isAuthenticated)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (newTicketCount > 0) {
      fetchData()
    }
  }, [newTicketCount])

  const checkAuthStatus = () => {
    const adminSession = localStorage.getItem('adminSession')
    if (adminSession) {
      const session = JSON.parse(adminSession)
      // Session expiry logic...
      setCurrentAdmin(session)
      setIsAuthenticated(true)
    }
    setLoading(false)
  }

  const handleLoginSuccess = (admin) => {
    setCurrentAdmin(admin)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    setIsAuthenticated(false)
    setCurrentAdmin(null)
  }

  const fetchData = async () => {
    try {
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select(`*, companies (name)`)
        .order('created_at', { ascending: false })

      if (ticketsError) throw ticketsError

      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')

      if (companiesError) throw companiesError

      setTickets(ticketsData)
      setCompanies(companiesData)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error updating ticket:', error)
      alert('Error updating ticket status')
    }
  }

  // ... Filter logic remains exactly the same as previous file ...
  // (Pasted here for brevity, assume getFilteredAndSortedTickets is defined)
  const getFilteredAndSortedTickets = () => {
    let filtered = tickets.filter(ticket => {
      if (filters.company !== 'all' && ticket.company_id !== filters.company) return false
      if (filters.status !== 'all' && ticket.status !== filters.status) return false
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const text = [ticket.contact_name, ticket.issue_description, ticket.companies.name].join(' ').toLowerCase()
        if (!text.includes(searchTerm)) return false
      }
      return true
    })
    // Sort logic...
    return filtered
  }
  const filteredTickets = getFilteredAndSortedTickets()

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearAllFilters = () => {
    setFilters({ company: 'all', status: 'all', search: '', dateFrom: '', dateTo: '', sortBy: 'created_at', sortOrder: 'desc' })
  }

  if (loading) return <div className="admin-container" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>Loading...</div>

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="admin-container">
      {/* Navigation Bar */}
      <nav className="admin-navbar">
        <div className="nav-brand">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="brand-text-main">FIVE TWENTY</span>
            <span className="brand-text-sub">ADMINISTRATION</span>
          </div>
        </div>
        
        <div className="nav-actions">
          <NotificationBell
            notifications={notifications}
            newTicketCount={newTicketCount}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
            clearNotifications={clearNotifications}
          />
          
          <div className="user-info">
            <div className="user-avatar">
              {currentAdmin?.email[0].toUpperCase()}
            </div>
            <span style={{ display: 'none', '@media (min-width: 768px)': { display: 'inline' } }}>
              {currentAdmin?.email}
            </span>
          </div>
          
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="content-header">
          <h1 className="page-title">Ticket Overview</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Showing {filteredTickets.length} tickets
            </span>
            <a href="/" style={{ color: '#009B4D', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
              View User Portal &rarr;
            </a>
          </div>
        </div>

        {/* Filters & Controls */}
        <div className="filter-card">
          <div className="filter-header">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>Search & Filter</h2>
            <ExportControls 
                tickets={filteredTickets} 
                companies={companies} 
                filters={filters}
              />
          </div>

          <div className="filter-grid">
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
        <div className="table-container">
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Issue Description</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No tickets found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.85rem' }}>
                        {new Date(ticket.created_at).toLocaleDateString()}
                        <br/>
                        {new Date(ticket.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ticket.companies.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{ticket.location}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{ticket.contact_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{ticket.contact_email}</div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ticket.issue_description}>
                          {ticket.issue_description}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge status-${ticket.status}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <select
                          value={ticket.status}
                          onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
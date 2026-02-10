import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AdminLogin from '../components/AdminLogin'
import NotificationBell from '../components/NotificationBell'
import TicketModal from '../components/TicketModal'
import AdminSidebar from '../components/AdminSidebar'
import TicketsPage from '../pages/TicketsPage'
import AnalyticsPage from '../pages/AnalyticsPage'
import CompaniesPage from '../pages/CompaniesPage'
import SettingsPage from '../pages/SettingsPage'
import { useNotifications } from '../hooks/useNotifications'
import './../styles/Admin.css'

const AdminDashboard = () => {
  const [tickets, setTickets] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [activeTab, setActiveTab] = useState('tickets') // Navigation state
  
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

  const getFilteredAndSortedTickets = () => {
    let filtered = tickets.filter(ticket => {
      if (filters.company !== 'all' && ticket.company_id !== filters.company) return false
      if (filters.status !== 'all' && ticket.status !== filters.status) return false
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const text = [ticket.contact_name, ticket.issue_description, ticket.companies?.name].join(' ').toLowerCase()
        if (!text.includes(searchTerm)) return false
      }
      return true
    })
    return filtered
  }

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

  const filteredTickets = getFilteredAndSortedTickets()

  return (
    <div className="admin-container">
      {/* Navigation Bar */}
      <nav className="admin-navbar">
        <div className="nav-brand">
          <button 
            onClick={() => setActiveTab('tickets')}
            className="brand-button"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="brand-text-main">FIVE TWENTY</span>
              <span className="brand-text-sub">ADMINISTRATION</span>
            </div>
          </button>
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
            <span className="user-email-text">
              {currentAdmin?.email}
            </span>
          </div>
          
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <AdminSidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          ticketCount={filteredTickets.length}
          companyCount={companies.length}
        />

        {/* Main Content */}
        <main className="dashboard-main">
          {activeTab === 'tickets' && (
            <TicketsPage 
              tickets={filteredTickets}
              companies={companies}
              filters={filters}
              handleFilterChange={handleFilterChange}
              clearAllFilters={clearAllFilters}
              updateTicketStatus={updateTicketStatus}
              setSelectedTicket={setSelectedTicket}
            />
          )}
          
          {activeTab === 'analytics' && (
            <AnalyticsPage tickets={tickets} companies={companies} />
          )}
          
          {activeTab === 'companies' && (
            <CompaniesPage companies={companies} tickets={tickets} />
          )}
          
          {activeTab === 'settings' && (
            <SettingsPage currentAdmin={currentAdmin} />
          )}
        </main>
      </div>

      {/* Chat Modal */}
      {selectedTicket && (
        <TicketModal 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </div>
  )
}

export default AdminDashboard
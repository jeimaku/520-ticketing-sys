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

  // Destructure the original notification states + new volume/mute controls
  const {
    notifications,
    newTicketCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    isMuted,
    toggleMute,
    volume,
    setVolume
  } = useNotifications(isAuthenticated)

  useEffect(() => {
    // Check local storage instead of Supabase Auth
    const checkSession = () => {
      const savedSession = localStorage.getItem('adminSession')
      if (savedSession) {
        setIsAuthenticated(true)
        setCurrentAdmin(JSON.parse(savedSession))
      }
      setLoading(false)
    }

    checkSession()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets()
      fetchCompanies()
    }
  }, [isAuthenticated])

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setTickets(data)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    }
  }

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name')
      
      if (error) throw error
      setCompanies(data)
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const handleLogout = () => {
    // Clear custom auth session instead of Supabase Auth
    localStorage.removeItem('adminSession')
    setIsAuthenticated(false)
    setCurrentAdmin(null)
  }

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId)

      if (error) throw error

      setTickets(tickets.map(ticket => 
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      ))
    } catch (error) {
      console.error('Error updating ticket:', error)
      alert('Failed to update ticket status')
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearAllFilters = () => {
    setFilters({
      company: 'all',
      status: 'all',
      search: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
  }

  // Filter logic
  const filteredTickets = tickets.filter(ticket => {
    const matchesCompany = filters.company === 'all' || ticket.company_id === filters.company
    const matchesStatus = filters.status === 'all' || ticket.status === filters.status
    const matchesSearch = filters.search === '' || 
      ticket.contact_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      ticket.issue_description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      ticket.id?.toLowerCase().includes(filters.search.toLowerCase())
    
    const ticketDate = new Date(ticket.created_at)
    const matchesDateFrom = !filters.dateFrom || ticketDate >= new Date(filters.dateFrom)
    const matchesDateTo = !filters.dateTo || ticketDate <= new Date(filters.dateTo)

    return matchesCompany && matchesStatus && matchesSearch && matchesDateFrom && matchesDateTo
  }).sort((a, b) => {
    let comparison = 0
    if (filters.sortBy === 'created_at') {
      comparison = new Date(b.created_at) - new Date(a.created_at)
    } else if (filters.sortBy === 'status') {
      comparison = a.status.localeCompare(b.status)
    }
    return filters.sortOrder === 'asc' ? comparison * -1 : comparison
  })

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>
  }

  if (!isAuthenticated) {
    return (
      <AdminLogin 
        onLoginSuccess={(session) => {
          setIsAuthenticated(true)
          setCurrentAdmin(session)
        }} 
      />
    )
  }

  return (
    <div className="admin-container">
      {/* Top Navbar */}
      <nav className="admin-navbar">
        <div className="navbar-brand">
          <span className="brand-logo">🔧</span>
          <h2>Admin Portal</h2>
        </div>
        
        <div className="navbar-actions">
          {/* Thread the sound control props securely into the Bell Component */}
          <NotificationBell 
            notifications={notifications}
            newTicketCount={newTicketCount}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
            clearNotifications={clearNotifications}
            isMuted={isMuted}
            toggleMute={toggleMute}
            volume={volume}
            setVolume={setVolume}
          />
          
          <div className="admin-profile">
            <div className="admin-avatar">
              {currentAdmin?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="user-email-text">{currentAdmin?.email}</span>
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
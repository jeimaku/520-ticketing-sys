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

import fivetwentyLogo from '../assets/520-logo.png'

const AdminDashboard = () => {
  const [tickets, setTickets] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false) // New state for session initialization
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

  // --- REAL-TIME TABLE UPDATES ---
  useEffect(() => {
    if (!isAuthenticated) return

    const tableSubscription = supabase
      .channel('dashboard-table-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Instantly add new tickets to the top of the table
            setTickets(currentTickets => {
              // Check to prevent accidental duplicates
              if (currentTickets.some(t => t.id === payload.new.id)) return currentTickets
              return [payload.new, ...currentTickets]
            })
          } 
          else if (payload.eventType === 'UPDATE') {
            // Instantly update statuses or edits made by other admins
            setTickets(currentTickets => 
              currentTickets.map(ticket => 
                ticket.id === payload.new.id ? { ...ticket, ...payload.new } : ticket
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tableSubscription)
    }
  }, [isAuthenticated])

  const handleLogout = () => {
    // Clear custom auth session instead of Supabase Auth
    localStorage.removeItem('adminSession')
    setIsAuthenticated(false)
    setCurrentAdmin(null)
    setSessionStarted(false) // Reset session start state on logout
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

  const handleNotificationClick = async (ticketId) => {
    // 1. Switch to the tickets tab
    setActiveTab('tickets')
    
    // 2. Try to find the ticket in our currently loaded list
    let ticketToOpen = tickets.find(t => t.id === ticketId)
    
    // 3. 🛑 THE FIX: If it's a brand new ticket not in our list yet, fetch it directly!
    if (!ticketToOpen) {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single()
          
        if (data && !error) {
          ticketToOpen = data
          // Instantly add it to the top of the table so the admin doesn't have to refresh
          setTickets(prevTickets => [data, ...prevTickets])
        }
      } catch (error) {
        console.error('Error fetching new ticket:', error)
      }
    }
    
    // 4. Open the modal!
    if (ticketToOpen) {
      setSelectedTicket(ticketToOpen)
    }
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
      {/* Session Initialization Modal */}
      {isAuthenticated && !sessionStarted && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            background: 'white',
            padding: '3rem 2.5rem',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '480px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.5rem',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {/* Large Bell Icon Container */}
            <div style={{
              background: '#eff6ff',
              padding: '1.5rem',
              borderRadius: '50%',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.5rem'
            }}>
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>

            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '2rem', fontWeight: 'bold' }}>
              Start Session
            </h2>

            <p style={{ margin: 0, color: '#475569', lineHeight: '1.6', fontSize: '1.05rem' }}>
              Please initiate the session to ensure the receipt of notification alerts and sounds, and to officially confirm the commencement of the administrative session.
            </p>

            <button 
              onClick={() => setSessionStarted(true)}
              className="btn-primary"
              style={{ 
                width: '100%', 
                padding: '1rem', 
                fontSize: '1.1rem',
                fontWeight: '600',
                marginTop: '1rem',
                borderRadius: '8px'
              }}
            >
              Start Administrative Session
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="admin-navbar">
        <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src={fivetwentyLogo} 
            alt="520 IT Services" 
            style={{ height: '96px', width: 'auto', objectFit: 'contain' }} 
          />
          <h2 style={{ margin: 0 }}>Admin Portal</h2>
        </div>
        
        <div className="navbar-actions">
          {/* 1. Notification Bell */}
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
            onNotificationClick={handleNotificationClick}
          />
          
          {/* 2. User Profile (Fixed class names) */}
          <div className="user-info">
            <div className="user-avatar">
              {currentAdmin?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <span className="user-email-text">{currentAdmin?.email}</span>
          </div>
          
          {/* 3. Logout Button */}
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
          companies={companies} /* <-- ADD THIS LINE */
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </div>
  )
}

export default AdminDashboard
import React, { useState, useEffect, useRef } from 'react'
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
  
  // ADDED: Global Audio and Session States
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const audioRef = useRef(null)

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

  // 1. Initialize Audio Object once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/alert.mp3');
      audioRef.current.volume = 1.0;
    }
  }, [])

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

  // 2. Global Supabase Listener for Audio Alerts
  useEffect(() => {
    // Only start listening if they are logged in
    if (!isAuthenticated) return;

    const subscription = supabase
      .channel('global-admin-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tickets' },
        (payload) => {
          // Play the sound globally if session is enabled
          if (audioRef.current && isAudioEnabled) {
            audioRef.current.play().catch((error) => {
              console.warn("Audio blocked by browser:", error);
            });
          }
          // Fetch data so all tabs (Tickets, Analytics, etc) update instantly
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isAuthenticated, isAudioEnabled]);

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
    // When they log in actively (clicking a button), the browser unlocks audio automatically
    handleEnableAudio() 
  }

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    setIsAuthenticated(false)
    setCurrentAdmin(null)
    setIsAudioEnabled(false) // Reset audio session on logout
  }

  // ADDED: Function to unlock audio context after a page refresh
  const handleEnableAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }).catch(err => console.warn("Audio unlock issue:", err));
    }
    setIsAudioEnabled(true);
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
    <>
      {/* ADDED: Global Audio Enable Overlay - Only shows if logged in but audio is not unlocked yet (e.g., after a hard refresh) */}
      {isAuthenticated && !isAudioEnabled && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center',
            maxWidth: '450px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h2 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.5rem' }}>Resume Dashboard Session</h2>
            <p style={{ color: '#475569', marginBottom: '24px', lineHeight: '1.6' }}>
              Your session was restored. Please click below to enable global real-time audio notifications across all tabs.
            </p>
            <button 
              onClick={handleEnableAudio} 
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                fontSize: '1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
              }}
            >
              Resume & Enable Audio
            </button>
          </div>
        </div>
      )}

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
    </>
  )
}

export default AdminDashboard
import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getTheme } from '../styles/themes'
import TicketThread from '../components/TicketThread' // <-- IMPORT THE CHAT

const TrackingPage = () => {
  const { token } = useParams()
  const [ticket, setTicket] = useState(null)
  const [company, setCompany] = useState(null)
  const [theme, setTheme] = useState(getTheme('default'))
  const [loading, setLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState('')

  const isAdmin = !!localStorage.getItem('adminSession')
  

  useEffect(() => {
    fetchTicket()
  }, [token])

  const fetchTicket = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          companies (name, slug)
        `)
        .eq('tracking_token', token)
        .single()

      if (error) throw error
      setTicket(data)
      setCompany(data.companies)
      
      if (data.companies?.slug) {
        setTheme(getTheme(data.companies.slug))
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopySuccess('Link copied!')
    setTimeout(() => setCopySuccess(''), 2000)
  }

  const getProgressStep = (status) => {
    switch (status) {
      case 'open': return 1
      case 'in_progress': return 2
      case 'resolved': return 3
      case 'closed': return 4
      default: return 0
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b' }}>
        Loading Ticket Details...
      </div>
    )
  }

  if (!ticket) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '3rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>Ticket Not Found</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>The tracking link is invalid or expired.</p>
          <a href="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>&larr; Return Home</a>
        </div>
      </div>
    )
  }

  // Styles (same as before, but with adjustments for the chat section)
  const styles = {
    container: {
      minHeight: '100vh',
      background: theme.bgGradient,
      padding: '2rem 1rem',
      fontFamily: "'Segoe UI', sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    card: {
      width: '100%',
      maxWidth: '900px', // Made slightly wider for chat
      background: 'white',
      borderRadius: '1.5rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
      overflow: 'hidden',
      position: 'relative'
    },
    topBar: {
      height: '8px',
      background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`,
      width: '100%'
    },
    header: {
      padding: '2.5rem 2.5rem 1.5rem',
      borderBottom: '1px solid #f1f5f9',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    brandName: {
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: '#64748b',
      fontWeight: '600',
      marginBottom: '0.5rem'
    },
    title: {
      fontSize: '1.8rem',
      fontWeight: '800',
      color: '#1e293b',
      margin: 0
    },
    statusBadge: {
      padding: '0.5rem 1rem',
      borderRadius: '999px',
      fontSize: '0.85rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      backgroundColor: theme.accent || '#f1f5f9',
      color: theme.primary,
      border: `1px solid ${theme.primary}30`
    },
    body: {
      padding: '2.5rem'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '2rem',
      marginBottom: '2.5rem'
    },
    label: {
      display: 'block',
      fontSize: '0.8rem',
      color: '#94a3b8',
      fontWeight: '600',
      marginBottom: '0.4rem',
      textTransform: 'uppercase'
    },
    value: {
      fontSize: '1.1rem',
      color: '#334155',
      fontWeight: '500'
    },
    descriptionBox: {
      background: '#f8fafc',
      padding: '1.5rem',
      borderRadius: '1rem',
      border: '1px solid #e2e8f0',
      color: '#475569',
      lineHeight: '1.6'
    },
    // Styles for the new chat section
    chatSection: {
      marginTop: '3rem',
      paddingTop: '2rem',
      borderTop: '1px solid #f1f5f9'
    },
    chatTitle: {
      fontSize: '1.1rem',
      fontWeight: '700',
      color: '#1e293b',
      marginBottom: '1rem'
    },
    footer: {
      background: '#f8fafc',
      padding: '1.5rem 2.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: '1px solid #e2e8f0'
    },
    button: {
      background: 'white',
      border: '1px solid #cbd5e1',
      padding: '0.6rem 1.2rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontWeight: '600',
      color: '#475569',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    refreshBtn: {
      background: theme.primary,
      color: 'white',
      border: 'none',
      padding: '0.6rem 1.5rem',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontWeight: '600',
      boxShadow: `0 4px 6px -1px ${theme.primary}40`
    }
  }

  const currentStep = getProgressStep(ticket.status)

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.topBar}></div>

        <div style={styles.header}>
          <div>
            <div style={styles.brandName}>{company?.name || 'Support Portal'}</div>
            <h1 style={styles.title}>Ticket #{ticket.id.slice(0, 8)}</h1>
          </div>
          <div style={styles.statusBadge}>
            {ticket.status.replace('_', ' ')}
          </div>
        </div>

        <div style={styles.body}>
          {/* Progress Tracker */}
          <div className="progress-container" style={{ marginBottom: '3rem', position: 'relative', padding: '0 1rem' }}>
            <div style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '4px', background: '#e2e8f0', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', top: '15px', left: '0', width: `${(currentStep - 1) * 33}%`, height: '4px', background: theme.primary, transition: 'width 0.5s', zIndex: 0 }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              {['Open', 'In Progress', 'Resolved', 'Closed'].map((stepLabel, index) => {
                const stepNum = index + 1
                const isActive = currentStep >= stepNum
                return (
                  <div key={stepLabel} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: isActive ? theme.primary : '#f1f5f9',
                      color: isActive ? 'white' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      border: isActive ? `4px solid ${theme.primary}30` : '4px solid white',
                      transition: 'all 0.3s'
                    }}>
                      {isActive ? '✓' : stepNum}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: isActive ? theme.primary : '#94a3b8' }}>
                      {stepLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ticket Details */}
          <div style={styles.grid}>
            <div>
              <span style={styles.label}>Submitted By</span>
              <div style={styles.value}>{ticket.contact_name}</div>
            </div>
            <div>
              <span style={styles.label}>Date Created</span>
              <div style={styles.value}>{new Date(ticket.created_at).toLocaleDateString()}</div>
            </div>
            <div>
              <span style={styles.label}>Location</span>
              <div style={styles.value}>{ticket.location}</div>
            </div>
          </div>

          <div>
            <span style={styles.label}>Issue Description</span>
            <div style={styles.descriptionBox}>
              {ticket.issue_description}
            </div>
          </div>

          {/* --- NEW CHAT SECTION --- */}
          <div style={styles.chatSection}>
            <h3 style={styles.chatTitle}>Updates & Discussion</h3>
            <div style={{ height: '500px' }}>
                <TicketThread 
                  ticketId={ticket.id}
                  senderType="user" 
                  senderName={ticket.contact_name}
                  readOnly={isAdmin} // <--- Pass the check here
                />
            </div>
          </div>
          {/* ------------------------- */}

        </div>

        <div style={styles.footer}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="/" style={{ textDecoration: 'none' }}>
              <button style={styles.button}>&larr; Home</button>
            </a>
            <button style={styles.button} onClick={handleCopyLink}>
               <span style={{fontSize:'1.2rem'}}>🔗</span> 
               {copySuccess || 'Copy Link'}
            </button>
          </div>
          
          <button 
            style={styles.refreshBtn}
            onClick={() => window.location.reload()}
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
    
  )
}

export default TrackingPage
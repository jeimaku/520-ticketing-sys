import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getTheme } from '../styles/themes'
import TicketThread from '../components/TicketThread'
import { 
  AUTOMATION_CONFIG, 
  AUTOMATION_MESSAGES, 
  formatAutomationAnswer 
} from '../components/AutomationMessages'

const TrackingPage = () => {
  const { token } = useParams()
  const [ticket, setTicket] = useState(null)
  const [company, setCompany] = useState(null)
  const [theme, setTheme] = useState(getTheme('default'))
  const [loading, setLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState('')
  const automationLock = useRef(false)
  
  // State for automation
  const [showOptions, setShowOptions] = useState(false)
  const [automationChecked, setAutomationChecked] = useState(false)
  
  // We use this to signal updates to the thread if needed
  const [lastUpdated, setLastUpdated] = useState(0)
  
  // Track user scroll behavior to prevent annoying auto-scroll
  const pageRef = useRef(null)
  const [userScrolledUp, setUserScrolledUp] = useState(false)
  const lastScrollY = useRef(0)

  const isAdmin = !!localStorage.getItem('adminSession')

  // Handle page scroll to detect if user is reading content above
  useEffect(() => {
    const handlePageScroll = () => {
      const currentScrollY = window.scrollY
      const scrollingUp = currentScrollY < lastScrollY.current
      
      // If user scrolled up significantly, they're probably reading
      if (scrollingUp && currentScrollY < lastScrollY.current - 50) {
        setUserScrolledUp(true)
      } else if (currentScrollY > window.innerHeight * 0.8) {
        // If user is near bottom, reset the flag
        setUserScrolledUp(false)
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handlePageScroll, { passive: true })
    return () => window.removeEventListener('scroll', handlePageScroll)
  }, [])

  useEffect(() => {
    fetchTicket()
  }, [token])

  // --- AUTOMATION LOGIC ---
  useEffect(() => {
    // ADD 'automationLock.current' TO THIS CHECK:
    if (!ticket || isAdmin || automationChecked || automationLock.current) return

    // IMMEDIATELY LOCK IT so it can't run again while waiting for the timeout
    automationLock.current = true

    const checkAndTriggerAutomation = async () => {
      try {
        console.log('🤖 Starting automation check for ticket:', ticket.id.slice(0, 8))
        
        const { data: messages, error } = await supabase
          .from('ticket_messages')
          .select('*')
          .eq('ticket_id', ticket.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('❌ Error fetching messages:', error)
          return
        }

        console.log('📧 Total messages found:', messages?.length || 0)

        const hasAutomatedMessage = messages?.some(m => 
          m.sender_name === AUTOMATION_CONFIG.BOT_NAME
        )
        console.log('🤖 Has automated message:', hasAutomatedMessage)

        if (!hasAutomatedMessage) {
          console.log('🎉 Sending welcome message (no bot message found)')
          const welcomeMessage = AUTOMATION_MESSAGES.welcome(company?.name, ticket.id)
          await sendAutomatedMessage(welcomeMessage)
        }

        const lastMessage = messages?.[0]
        const isLastMessageFromUser = lastMessage && lastMessage.sender_type === 'user'
        
        console.log('📨 Last message from user:', isLastMessageFromUser)
        console.log('👤 Last message sender:', lastMessage?.sender_name)

        if (hasAutomatedMessage || !hasAutomatedMessage) {
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
          const recentUserMessages = messages?.filter(m => 
            m.sender_type === 'user' && 
            new Date(m.created_at) > fiveMinutesAgo &&
            AUTOMATION_MESSAGES.quickActions.some(action => 
              action.question === m.message
            )
          )

          console.log('🕐 Recent user option selections:', recentUserMessages?.length || 0)

          if (!recentUserMessages?.length) {
            console.log('✅ Showing options - no recent user selections')
            setShowOptions(true)
          } else {
            console.log('⏳ Not showing options - user recently selected an option')
            setTimeout(() => {
              setShowOptions(true)
              console.log('🔄 Re-showing options after delay')
            }, 30000)
          }
        }
        
        setAutomationChecked(true)
        
        } catch (error) {
        console.error('🚨 Automation error:', error)
        setShowOptions(true)
      }
    }

    setTimeout(checkAndTriggerAutomation, 1500)
  }, [ticket, company, automationChecked, isAdmin])

  const sendAutomatedMessage = async (text) => {
    try {
      console.log('📤 Sending automated message...')
      
      const { error } = await supabase.from('ticket_messages').insert([{
        ticket_id: ticket.id,
        sender_type: AUTOMATION_CONFIG.BOT_TYPE,
        sender_name: AUTOMATION_CONFIG.BOT_NAME,
        message: text,
        // ❌ REMOVE THIS LINE ENTIRELY:
        // created_at: new Date().toISOString()
      }])
      
      if (error) throw error
      
      console.log('✅ Automated message sent successfully')
      setLastUpdated(prev => prev + 1)
      
    } catch (error) {
      console.error('❌ Error sending automated message:', error)
    }
  }

  const handleOptionClick = async (option) => {
    try {
      console.log('🔘 User selected option:', option.label)
      setShowOptions(false)

      await supabase.from('ticket_messages').insert([{
        ticket_id: ticket.id,
        sender_type: 'user',
        sender_name: ticket.contact_name,
        message: option.question,
        // ❌ REMOVE THIS LINE ENTIRELY:
        // created_at: new Date().toISOString()
      }])

      setLastUpdated(prev => prev + 1)

      setTimeout(async () => {
        const formattedAnswer = formatAutomationAnswer(option.answer)
        await sendAutomatedMessage(formattedAnswer)
        
        setTimeout(() => {
          setShowOptions(true)
          console.log('🔄 Re-showing options after response')
        }, 2000)
      }, 1500)
      
    } catch (error) {
      console.error('❌ Error handling option selection:', error)
      setTimeout(() => setShowOptions(true), 3000)
    }
  }

  const fetchTicket = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`*, companies (name, slug)`)
        .eq('tracking_token', token)
        .single()

      if (error) throw error
      setTicket(data)
      setCompany(data.companies)
      if (data.companies?.slug) setTheme(getTheme(data.companies.slug))
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

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b' }}>Loading Ticket Details...</div>
  if (!ticket) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>Ticket Not Found</div>

  // --- STYLES ---
  const styles = {
    container: { 
      minHeight: '100vh', 
      background: theme.bgGradient, 
      padding: '2rem 1rem', 
      fontFamily: "'Segoe UI', sans-serif"
    },
    card: { 
      width: '100%', 
      maxWidth: '900px', 
      background: 'white', 
      borderRadius: '1.5rem', 
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', 
      overflow: 'hidden', 
      position: 'relative',
      margin: '0 auto'
    },
    topBar: { height: '8px', background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`, width: '100%' },
    header: { padding: '2.5rem 2.5rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' },
    brandName: { 
      fontSize: '0.9rem', 
      textTransform: 'uppercase', 
      letterSpacing: '0.05em', 
      
      // CHANGE THIS LINE:
      // Old: color: '#64748b',
      
      // New: Use the secondary color (or primary) for a nice branded look
      color: theme.name === 'Launchpad Coworking' ? '#64748b' : theme.secondary || theme.primary,
      
      fontWeight: '600', 
      marginBottom: '0.5rem' 
    },
      title: { 
      fontSize: '1.8rem', 
      fontWeight: '800', 
      
      // CHANGE THIS LINE:
      // Old: color: '#1e293b',
      
      // New: Use brand color, but force Dark Gray for Launchpad (to avoid invisible lime text)
      color: theme.name === 'Launchpad Coworking' 
        ? '#1e293b' // Keep Launchpad dark for readability
        : theme.primary, // Use Brand Color (Blue/Red/etc) for everyone else
        
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
      
      // CHANGE THESE TWO LINES:
      // If there is an accent color (Paysera/Bestloan), use WHITE text.
      // Otherwise (Stahl/Launchpad), use the PRIMARY color text.
      color: theme.accent ? 'white' : theme.primary,
      
      // Optional: Remove the border if it's a solid colored badge to make it cleaner
      border: theme.accent ? 'none' : `1px solid ${theme.primary}30` 
    },
    body: { padding: '2.5rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2.5rem' },
    label: { display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.5rem' },
    value: { fontSize: '1rem', fontWeight: '600', color: '#1e293b', lineHeight: '1.4' },
    descriptionBox: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', fontSize: '1rem', color: '#334155', lineHeight: '1.6', marginTop: '0.5rem' },
    chatSection: { borderTop: '1px solid #f1f5f9', paddingTop: '2.5rem' },
    chatTitle: { fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    footer: { padding: '2rem 2.5rem', borderTop: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' },
    button: { padding: '0.75rem 1.5rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', background: 'white', color: '#64748b', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    refreshBtn: { padding: '0.75rem 1.5rem', background: theme.primary, color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.9rem' },
    // Automation styles
    optionsContainer: {
      marginTop: '1.5rem',
      padding: '1.5rem',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      borderRadius: '1rem',
      border: '2px solid #bae6fd',
      animation: 'slideIn 0.5s ease-out'
    },
    optionsTitle: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#0c4a6e',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    optionsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '0.75rem'
    },
    optionBtn: {
      background: 'white',
      border: '2px solid #bae6fd',
      borderRadius: '0.75rem',
      padding: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s',
      fontSize: '0.9rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      color: '#0c4a6e'
    }
  }

  const currentStep = getProgressStep(ticket.status)

  return (
    <div ref={pageRef} style={styles.container}>
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
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: isActive ? theme.primary : '#f1f5f9',
                      color: isActive ? 'white' : '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', fontSize: '0.9rem',
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

          {/* --- CHAT SECTION --- */}
          <div style={styles.chatSection}>
            <h3 style={styles.chatTitle}>
              💬 Updates & Discussion
            </h3>
            
            {/* Ticket Thread */}
            <div style={{ height: '800px', display: 'flex', flexDirection: 'column' }}>
                <TicketThread 
                  refreshTrigger={lastUpdated} 
                  ticketId={ticket.id}
                  senderType="user" 
                  senderName={ticket.contact_name}
                  readOnly={isAdmin} 
                />
            </div>

            {/* AUTOMATION BUTTONS AREA */}
            {showOptions && !isAdmin && (
              <div style={styles.optionsContainer}>
                <div style={styles.optionsTitle}>
                  🤖 Quick Actions - Select an option to get an instant answer:
                </div>
                <div style={styles.optionsGrid}>
                  {AUTOMATION_MESSAGES.quickActions.map((opt) => (
                    <button
                      key={opt.id}
                      style={styles.optionBtn}
                      onClick={() => handleOptionClick(opt)}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#e0f2fe'
                        e.target.style.borderColor = theme.primary
                        e.target.style.transform = 'translateY(-2px)'
                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white'
                        e.target.style.borderColor = '#bae6fd'
                        e.target.style.transform = 'translateY(0)'
                        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Smooth scrolling for better UX */
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  )
}
  
export default TrackingPage
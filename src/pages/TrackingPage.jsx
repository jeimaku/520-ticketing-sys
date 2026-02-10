import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getTheme } from '../styles/themes'
import TicketThread from '../components/TicketThread'

const TrackingPage = () => {
  const { token } = useParams()
  const [ticket, setTicket] = useState(null)
  const [company, setCompany] = useState(null)
  const [theme, setTheme] = useState(getTheme('default'))
  const [loading, setLoading] = useState(true)
  const [copySuccess, setCopySuccess] = useState('')
  
  // State for automation
  const [showOptions, setShowOptions] = useState(false)
  const [automationChecked, setAutomationChecked] = useState(false)
  
  // We use this to signal updates to the thread if needed
  const [lastUpdated, setLastUpdated] = useState(0)

  const isAdmin = !!localStorage.getItem('adminSession')

  useEffect(() => {
    fetchTicket()
  }, [token])

  // --- AUTOMATION LOGIC START ---
  useEffect(() => {
    if (!ticket || isAdmin || automationChecked) return

    const checkAndTriggerAutomation = async () => {
      const createdAt = new Date(ticket.created_at).getTime()
      const now = Date.now()
      const timeDiff = now - createdAt
      const THREE_MINUTES = 3 * 60 * 1000
      
      // 1. If ticket is too new, schedule the check for later
      if (timeDiff < THREE_MINUTES) {
        const delay = THREE_MINUTES - timeDiff
        setTimeout(() => checkAndTriggerAutomation(), delay)
        return
      }

      // 2. Check if automated message OR any admin message already exists
      const { data: messages, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: false })

      if (error) return

      // If an admin/bot has already spoken, don't send the intro
      const hasAdminReply = messages.some(m => m.sender_type === 'admin')
      
      // If no admin reply yet, send the Welcome Message
      if (!hasAdminReply) {
        await sendAutomatedMessage(
          `Hello there, ${company?.name || 'Client'} client! Thank you for your patience. All our support agents are currently assisting other clients, but your ticket #${ticket.id.slice(0, 8)} is in our queue. While you wait, would you like to get immediate details about your submission or try our quick-resolve tools? Please select an option below.`
        )
        setShowOptions(true) 
      } else {
        // If the LAST message was the bot, show options. Otherwise hide them.
        const lastMessage = messages[0]
        if (lastMessage && lastMessage.sender_name === 'Automated Assistant') {
          setShowOptions(true)
        }
      }
      setAutomationChecked(true)
    }

    checkAndTriggerAutomation()
  }, [ticket, company, automationChecked, isAdmin])

  const sendAutomatedMessage = async (text) => {
    try {
      await supabase.from('ticket_messages').insert([{
        ticket_id: ticket.id,
        sender_type: 'admin', // System messages count as admin
        sender_name: 'Automated Assistant',
        message: text,
        created_at: new Date().toISOString()
      }])
      
      // Quietly signal update without forcing full reload
      setLastUpdated(prev => prev + 1)
      
    } catch (error) {
      console.error('Automation Error:', error)
    }
  }

  const handleOptionClick = async (option) => {
    setShowOptions(false) // Hide buttons immediately

    // 1. Post User's Question
    await supabase.from('ticket_messages').insert([{
      ticket_id: ticket.id,
      sender_type: 'user',
      sender_name: ticket.contact_name,
      message: option.question
    }])

    setLastUpdated(prev => prev + 1)

    // 2. Wait a split second for realism then post answer
    setTimeout(async () => {
      await sendAutomatedMessage(option.answer)
    }, 1000)
  }
  // --- AUTOMATION LOGIC END ---

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
      fontFamily: "'Segoe UI', sans-serif", 
      display: 'flex', 
      // Changed from 'center' to 'flex-start' to prevent scroll jumping
      alignItems: 'flex-start', 
      justifyContent: 'center' 
    },
    card: { 
      width: '100%', 
      maxWidth: '900px', 
      background: 'white', 
      borderRadius: '1.5rem', 
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', 
      overflow: 'hidden', 
      position: 'relative',
      // Added margin auto to center it vertically only when content is short
      margin: 'auto 0'
    },
    topBar: { height: '8px', background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`, width: '100%' },
    header: { padding: '2.5rem 2.5rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' },
    brandName: { fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: '600', marginBottom: '0.5rem' },
    title: { fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', margin: 0 },
    statusBadge: { padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: theme.accent || '#f1f5f9', color: theme.primary, border: `1px solid ${theme.primary}30` },
    body: { padding: '2.5rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2.5rem' },
    label: { display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', marginBottom: '0.4rem', textTransform: 'uppercase' },
    value: { fontSize: '1.1rem', color: '#334155', fontWeight: '500' },
    descriptionBox: { background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', color: '#475569', lineHeight: '1.6' },
    chatSection: { marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9' },
    chatTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem' },
    footer: { background: '#f8fafc', padding: '1.5rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0' },
    button: { background: 'white', border: '1px solid #cbd5e1', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600', color: '#475569', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    refreshBtn: { background: theme.primary, color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600', boxShadow: `0 4px 6px -1px ${theme.primary}40` },
    
    // Automation Options Styles
    optionsContainer: {
      marginTop: '1.5rem',
      padding: '1.5rem',
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '1rem',
      animation: 'fadeIn 0.5s ease-in'
    },
    optionsTitle: { fontSize: '0.9rem', fontWeight: '700', color: '#0369a1', marginBottom: '1rem' },
    optionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' },
    optionBtn: {
      padding: '1rem',
      border: '1px solid #bae6fd',
      borderRadius: '0.75rem',
      background: 'white',
      color: '#0284c7',
      fontWeight: '600',
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'all 0.2s',
      fontSize: '0.9rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }
  }

  const currentStep = getProgressStep(ticket.status)

  // Automation Content Data
  const AUTOMATION_OPTIONS = [
    {
      id: 'A',
      label: 'When will my issue be resolved?',
      question: 'When will my issue be resolved?',
      answer: "Your ticket is currently categorized as Standard Priority.\n\nEstimated Response Time: Within 4 hours.\nEstimated Resolution Time: 24–48 hours.\n\n<strong>URGENT NOTE:</strong> Before you restart your PC or close this website, make sure to copy the link of your ticket so that you will be able to access and monitor the status of your ticket. If this issue is preventing you from working entirely (e.g., system lockout), please reply with 'URGENT' to flag this for a supervisor."
    },
    {
      id: 'B',
      label: 'Is there anything I can do right now?',
      question: 'Is there anything I can do right now?',
      // REPLACED '**' with '<strong>' tags for bolding and removed the asterisks.
      answer: "Yes, here is a categorized guide for common issues:\n\n🌐 <strong>Network & Connectivity</strong>\n- <strong>WiFi/Ethernet:</strong> Disconnect and reconnect your internet source.\n- <strong>VPN:</strong> If enabled, try toggling it off and on.\n- <strong>Slowness:</strong> Close high-bandwidth tabs (Video/Streaming).\n\n💻 <strong>Hardware & System</strong>\n- <strong>Restart:</strong> A full system restart resolves 40% of glitches.\n- <strong>Cables:</strong> Ensure power and monitor cables are tight.\n\n🔐 <strong>Access & Accounts</strong>\n- <strong>Login:</strong> Check Caps Lock or clear browser cache.\n\nDid this help? If yes, you can reply 'Close Ticket'."
    },
    {
      id: 'C',
      label: 'Did I provide enough information?',
      question: 'Did I provide enough information?',
      answer: "We have received your initial report. To speed up the resolution process once an agent connects, please ensure you have provided:\n\n- Asset Tag Number: (Found on the bottom or back of your device).\n- Screenshots: Images of the error message.\n- Reproduction Steps: What were you doing when the error occurred?\n\nYou can upload files or type these details here in the chat while you wait."
    },
    {
      id: 'D',
      label: 'What is the process for this type of issue?',
      question: 'What is the process for this type of issue?',
      answer: "Here is the lifecycle for your ticket:\n\n1. Triage (Current Stage): An admin reviews the issue to assign the correct specialist.\n2. Investigation: A specialist will contact you or remotely access your machine.\n3. Resolution & Testing: We fix the issue and verify it with you.\n4. Closure: You will receive a summary email and a satisfaction survey."
    }
  ]

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
            <h3 style={styles.chatTitle}>Updates & Discussion</h3>
            
            {/* Ticket Thread */}
            <div style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                <TicketThread 
                  // No 'key' prop to prevent unmounting/remounting
                  // Passing lastUpdated as prop in case TicketThread needs it, 
                  // but removing strict dependency to avoid scroll thrashing
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
                <div style={styles.optionsTitle}>🤖 Quick Actions - Select an option to get an instant answer:</div>
                <div style={styles.optionsGrid}>
                  {AUTOMATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      style={styles.optionBtn}
                      onClick={() => handleOptionClick(opt)}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#e0f2fe'
                        e.target.style.borderColor = theme.primary
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white'
                        e.target.style.borderColor = '#bae6fd'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
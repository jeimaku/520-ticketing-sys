import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase' // Corrected import based on your directory structure
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
  // 1. Local state to manage live updates alongside parent props
  const [liveTickets, setLiveTickets] = useState(tickets);
  
  // Added: State to manage the session/audio unlock overlay
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  
  // 2. Ref to hold the Audio instance safely across renders
  const audioRef = useRef(null);

  // 3. Sync local state if the parent component passes down new initial tickets
  useEffect(() => {
    setLiveTickets(tickets);
  }, [tickets]);

  // 4. Real-time Supabase listener and Custom Notification Sound
  useEffect(() => {
    // Initialize the audio object inside the ref. 
    // The path starts with '/' which automatically looks in your 'public' folder.
    if (!audioRef.current) {
      audioRef.current = new Audio('/alert.mp3');
      audioRef.current.volume = 1.0;
    }

    const subscription = supabase
      .channel('public:tickets')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tickets' },
        (payload) => {
          // Play your custom notification sound using the ref
          // Only attempt to play if the session has been started by the user
          if (audioRef.current && isSessionStarted) {
            audioRef.current.play().catch((error) => {
              console.warn("Browser autoplay policy blocked the sound.", error);
            });
          }

          // Instantly add the new ticket to the top of the table
          setLiveTickets((currentTickets) => {
            // Prevent duplicate entries
            if (currentTickets.some(t => t.id === payload.new.id)) return currentTickets;
            return [payload.new, ...currentTickets];
          });
        }
      )
      .subscribe();

    // Cleanup the subscription when the component unmounts
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isSessionStarted]); // Added isSessionStarted to dependency array so the listener knows when it changes

  // Added: Handler to unlock audio context
  const handleStartSession = () => {
    if (audioRef.current) {
      // Play and immediately pause to satisfy the browser's interaction requirement
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0; // Reset audio to the beginning
      }).catch(err => console.warn("Audio unlock issue:", err));
    }
    setIsSessionStarted(true);
  };

  return (
    <>
      {/* Added: Session Start Overlay */}
      {!isSessionStarted && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '40px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h2 style={{ marginTop: 0, color: '#333' }}>Welcome to the Dashboard</h2>
            <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.5' }}>
              To ensure you receive real-time audio notifications for new tickets, please start your session.
            </p>
            <button 
              onClick={handleStartSession} 
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                fontSize: '16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Start Session & Enable Audio
            </button>
          </div>
        </div>
      )}

      <div className="tickets-page">
        <div className="tickets-header">
          <h1 className="tickets-title">Ticket Overview</h1>
          {/* Updated to reflect the live count */}
          <span className="tickets-count">Showing {liveTickets.length} tickets</span>
        </div>

        {/* Filters & Controls */}
        <div className="tickets-filter-card">
          <div className="tickets-filter-header">
            <h2 className="tickets-filter-title">Search & Filter</h2>
            <ExportControls 
              tickets={liveTickets} // Exporting the live data
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
                {/* Updated to map over liveTickets instead of tickets prop */}
                {liveTickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="tickets-empty-state">
                      No tickets found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  liveTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="ticket-date">
                        {new Date(ticket.created_at).toLocaleDateString()}
                        <span className="ticket-date-time">
                          {new Date(ticket.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </td>
                      <td>
                        <div className="ticket-company-name">{ticket.companies?.name || 'Unknown'}</div>
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
    </>
  )
}

export default TicketsPage
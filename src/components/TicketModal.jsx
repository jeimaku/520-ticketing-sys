import React from 'react'
import TicketThread from './TicketThread'

const TicketModal = ({ ticket, companies, onClose }) => {
  if (!ticket) return null

  const getStatusColor = (status) => {
    switch(status) {
      case 'open': return { bg: '#dbeafe', text: '#1e40af' }
      case 'in_progress': return { bg: '#fef3c7', text: '#92400e' }
      case 'resolved': return { bg: '#dcfce7', text: '#166534' }
      case 'closed': return { bg: '#f1f5f9', text: '#475569' }
      default: return { bg: '#f1f5f9', text: '#475569' }
    }
  }

  const statusColors = getStatusColor(ticket.status)

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease-out'
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        
        // UPDATE THESE THREE LINES:
        width: '95%',          // Changed from 90% to take up more width
        maxWidth: '1600px',    // Changed from 1000px to allow it to get much wider
        height: '95vh',        // Changed from 85vh to take up almost full height
        
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease-out'
      }}>
        
        {/* Header - Fixed at top */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #1e293b 0%, #374151 100%)',
          color: 'white',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '1.5rem', 
                  fontWeight: '700',
                  color: 'white'
                }}>
                  🎫 Ticket #{ticket.id.slice(0, 8)}
                </h2>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  background: statusColors.bg,
                  color: statusColors.text
                }}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem', 
                marginTop: '1rem' 
              }}>
                <div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'rgba(255,255,255,0.7)', 
                    fontWeight: '600', 
                    textTransform: 'uppercase', 
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    👤 Contact
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: '500' }}>
                    {ticket.contact_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                    {ticket.contact_email}
                  </div>
                </div>
                
                <div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'rgba(255,255,255,0.7)', 
                    fontWeight: '600', 
                    textTransform: 'uppercase', 
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    🏢 Company
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: '500' }}>
                    
                    {/* 👇 Replace the old logic with this new line: 👇 */}
                    {companies?.find(c => c.id === ticket.company_id)?.name || ticket.companies?.name || 'Unknown'}
                  
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                    📍 {ticket.location}
                  </div>
                </div>
                
                <div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'rgba(255,255,255,0.7)', 
                    fontWeight: '600', 
                    textTransform: 'uppercase', 
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    📅 Created
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: '500' }}>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                    🕐 {new Date(ticket.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                color: 'white',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '1rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Issue Description - Compact */}
        {ticket.issue_description && (
          <div style={{ 
            padding: '1rem 1.5rem', 
            background: '#f8fafc', 
            borderBottom: '1px solid #e2e8f0',
            flexShrink: 0
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#64748b', 
              fontWeight: '600', 
              textTransform: 'uppercase', 
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              📋 Issue Description
            </div>
            <div style={{ 
              fontSize: '0.9rem', 
              color: '#475569', 
              lineHeight: '1.5',
              maxHeight: '60px',
              overflowY: 'auto',
              padding: '0.75rem',
              background: 'white',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0',
              fontStyle: ticket.issue_description.length > 100 ? 'normal' : 'normal'
            }}>
              {ticket.issue_description}
            </div>
          </div>
        )}

        {/* Chat Thread - ADMIN PERSPECTIVE */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: 0,
          background: '#f8fafc'
        }}>
          <div style={{
            padding: '1rem 1.5rem 0.5rem',
            borderBottom: '1px solid #e2e8f0',
            background: 'white',
            flexShrink: 0
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              💬 Conversation Thread
              <span style={{
                fontSize: '0.75rem',
                color: '#64748b',
                background: '#f1f5f9',
                padding: '0.25rem 0.5rem',
                borderRadius: '999px',
                fontWeight: '500'
              }}>
                Admin View
              </span>
            </h3>
          </div>
          
          {/* Enhanced Chat with Admin Perspective */}
          <div style={{ 
            flex: 1, 
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <TicketThread 
              ticketId={ticket.id}
              senderType="admin"
              senderName="Support Team"
              viewerType="admin" // IMPORTANT: This makes admin messages appear on the right
            />
          </div>
        </div>
      </div>

      {/* Enhanced Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        /* Enhanced scrollbar for better UX */
        .ticket-modal-scroll::-webkit-scrollbar {
          width: 8px;
        }
        
        .ticket-modal-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .ticket-modal-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #cbd5e1, #94a3b8);
          border-radius: 4px;
        }
        
        .ticket-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #94a3b8, #64748b);
        }
      `}</style>
    </>
  )
}

export default TicketModal
import React from 'react'
import TicketThread from './TicketThread'

const TicketModal = ({ ticket, onClose }) => {
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
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease-out'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: '#f8fafc'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.5rem', 
                fontWeight: '700',
                color: '#1e293b'
              }}>
                Ticket #{ticket.id.slice(0, 8)}
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
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Contact
                </div>
                <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: '500' }}>
                  {ticket.contact_name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {ticket.contact_email}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Company
                </div>
                <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: '500' }}>
                  {ticket.companies?.name || 'Unknown'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {ticket.location}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Created
                </div>
                <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: '500' }}>
                  {new Date(ticket.created_at).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {new Date(ticket.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              color: '#64748b',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f1f5f9'
              e.currentTarget.style.color = '#1e293b'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#64748b'
            }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Issue Description */}
        {ticket.issue_description && (
          <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Issue Description
            </div>
            <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.5' }}>
              {ticket.issue_description}
            </div>
          </div>
        )}

        {/* Chat Thread */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <TicketThread 
              ticketId={ticket.id}
              senderType="admin"
              senderName="Support Team"
            />
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  )
}

export default TicketModal
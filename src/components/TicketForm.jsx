import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { generateTrackingToken } from '../utils/tokenGenerator'

const TicketForm = ({ companyId, companyName, theme }) => {
  const [formData, setFormData] = useState({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    issue_description: '',
    location: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [trackingToken, setTrackingToken] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = generateTrackingToken()
      
      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          ...formData,
          company_id: companyId,
          tracking_token: token
        }])

      if (error) throw error
      setTrackingToken(token)
    } catch (error) {
      console.error('Error submitting ticket:', error)
      alert('Error submitting ticket. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (trackingToken) {
    const trackingUrl = `${window.location.origin}/track/${trackingToken}`;
    
    const handleCopy = () => {
      navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset button after 2 seconds
    };

    return (
      <div className="ticket-success-message" style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
        <h3 style={{ color: '#15803d', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '700' }}>
          Ticket Submitted Successfully!
        </h3>
        
        <p style={{ color: '#475569', marginBottom: '1.5rem', lineHeight: '1.5', fontSize: '0.95rem' }}>
          Please save your unique tracking link below. You will need this to check your status and chat with our support team.
        </p>
        
        {/* Link Box with Copy Button */}
        <div style={{ 
          background: '#f8fafc', 
          padding: '0.75rem', 
          borderRadius: '0.5rem', 
          border: '1px solid #cbd5e1', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <code style={{ wordBreak: 'break-all', color: '#0f172a', fontSize: '0.85rem', textAlign: 'left' }}>
            {trackingUrl}
          </code>
          
          <button
            onClick={handleCopy}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: copied ? '#10b981' : theme?.primary || '#3b82f6',
              color: copied ? 'white' : theme?.textColor || 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            {copied ? '✓ Copied' : '📋 Copy Link'}
          </button>
        </div>

        {/* Client Instructions */}
        <div style={{ 
          background: '#fffbeb', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          border: '1px solid #fde68a',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', lineHeight: '1.5' }}>
            💡 <strong>Next Step:</strong> Open a new tab and paste this link. You can instantly start a live conversation with our IT support agents and provide additional details or images if needed.
          </p>
        </div>

        <button
          onClick={() => {
            setTrackingToken(null);
            setCopied(false);
            setFormData({
              contact_name: '',
              contact_email: '',
              contact_phone: '',
              issue_description: '',
              location: ''
            });
          }}
          className={theme?.formDark ? 'submit-btn dark-text' : 'submit-btn'}
          style={{ width: '100%' }}
        >
          Submit Another Ticket
        </button>
      </div>
    )
  }

  // Check if we need dark text on the button (for Launchpad lime green button)
  const btnClass = theme?.formDark ? 'submit-btn dark-text' : 'submit-btn';

  return (
    <div className="ticket-form-wrapper">
      <div className="form-header">
        <h2 className="form-title">Submit Support Ticket</h2>
        <p className="form-subtitle">Fill out the details below to reach our support team.</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input
            type="text"
            name="contact_name"
            value={formData.contact_name}
            onChange={handleInputChange}
            required
            className="form-input"
            placeholder="e.g. Juan dela Cruz"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input
            type="email"
            name="contact_email"
            value={formData.contact_email}
            onChange={handleInputChange}
            required
            className="form-input"
            placeholder="name@company.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            name="contact_phone"
            value={formData.contact_phone}
            onChange={handleInputChange}
            className="form-input"
            placeholder="+63 900 000 0000"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Location / Department *</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
            className="form-input"
            placeholder="e.g. Main Office, 2nd Floor"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Issue Description *</label>
          <textarea
            name="issue_description"
            value={formData.issue_description}
            onChange={handleInputChange}
            required
            rows="4"
            className="form-textarea"
            placeholder="Please describe the problem in detail..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={btnClass}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  )
}

export default TicketForm
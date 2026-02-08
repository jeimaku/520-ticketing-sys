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
    return (
      <div className="ticket-success-message">
        <h3 style={{ color: 'green', marginBottom: '1rem', fontSize: '1.5rem' }}>
          ✓ Ticket Submitted!
        </h3>
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>
          Please save your tracking link:
        </p>
        <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0', marginBottom: '1.5rem' }}>
          <code style={{ wordBreak: 'break-all', color: '#15803d' }}>
            {window.location.origin}/track/{trackingToken}
          </code>
        </div>
        <button
          onClick={() => {
            setTrackingToken(null);
            setFormData({
              contact_name: '',
              contact_email: '',
              contact_phone: '',
              issue_description: '',
              location: ''
            });
          }}
          className="submit-btn" // Re-uses the main button style
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
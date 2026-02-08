import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TrackingPage = () => {
  const { token } = useParams()
  const [ticket, setTicket] = useState(null)
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTicket()
  }, [token])

  const fetchTicket = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          companies (name)
        `)
        .eq('tracking_token', token)
        .single()

      if (error) throw error
      setTicket(data)
      setCompany(data.companies)
    } catch (error) {
      console.error('Error fetching ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Ticket Not Found</h2>
          <p className="text-gray-600">The tracking link you're using is invalid or expired.</p>
          <a href="/" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Back to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Ticket Status</h1>
          <p className="text-gray-600">Company: {company?.name}</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div>
            <span className="font-medium">Submitted:</span>
            <span className="ml-2">{new Date(ticket.created_at).toLocaleDateString()}</span>
          </div>

          <div>
            <span className="font-medium">Contact:</span>
            <span className="ml-2">{ticket.contact_name}</span>
          </div>

          <div>
            <span className="font-medium">Email:</span>
            <span className="ml-2">{ticket.contact_email}</span>
          </div>

          <div>
            <span className="font-medium">Location:</span>
            <span className="ml-2">{ticket.location}</span>
          </div>

          <div>
            <span className="font-medium">Issue Description:</span>
            <p className="mt-2 p-3 bg-gray-50 rounded">{ticket.issue_description}</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-4"
          >
            Refresh Status
          </button>
          <a href="/" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}

export default TrackingPage
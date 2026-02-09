import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const RealtimeTest = ({ ticketId }) => {
  const [status, setStatus] = useState('Initializing...')
  const [events, setEvents] = useState([])
  const channelRef = useRef(null)

  useEffect(() => {
    let mounted = true
    console.log('🔧 Starting Realtime Test for ticket:', ticketId)
    
    const setupChannel = async () => {
      // Clean up existing channel
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      const channel = supabase
        .channel(`test-channel-${ticketId}`, {
          config: {
            broadcast: { self: true },
            presence: { key: '' }
          }
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ticket_messages',
            filter: `ticket_id=eq.${ticketId}`
          },
          (payload) => {
            if (!mounted) return
            
            console.log('🎉 REALTIME EVENT RECEIVED:', payload)
            setEvents(prev => [...prev, {
              type: payload.eventType,
              time: new Date().toLocaleTimeString(),
              data: payload.new || payload.old
            }])
          }
        )
        .subscribe((subscriptionStatus, err) => {
          if (!mounted) return
          
          console.log('📡 Subscription status:', subscriptionStatus)
          
          if (err) {
            console.error('❌ Subscription error:', err)
            setStatus(`Error: ${err.message}`)
          } else {
            setStatus(subscriptionStatus)
          }
        })

      channelRef.current = channel
    }

    setupChannel()

    return () => {
      console.log('🔌 Cleaning up test channel')
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).then(() => {
          channelRef.current = null
        })
      }
    }
  }, [ticketId])

  const getStatusColor = () => {
    if (status === 'SUBSCRIBED') return '#10b981'
    if (status === 'CLOSED' || status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') return '#ef4444'
    return '#f59e0b'
  }

  return (
    <div style={{ padding: '1.5rem', background: '#f0f9ff', border: '2px solid #0ea5e9', borderRadius: '0.75rem', margin: '1rem 0' }}>
      <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        🔧 Realtime Debug Panel
      </h3>
      
      <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong>Subscription Status:</strong>{' '}
          <span style={{ 
            color: getStatusColor(), 
            fontWeight: 'bold',
            padding: '0.25rem 0.75rem',
            background: status === 'SUBSCRIBED' ? '#dcfce7' : '#fef3c7',
            borderRadius: '1rem',
            fontSize: '0.85rem'
          }}>
            {status}
          </span>
        </div>
        
        <div>
          <strong>Ticket ID:</strong> <code style={{ background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{ticketId}</code>
        </div>
      </div>
      
      <div>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>
          Events Received: <span style={{ color: events.length > 0 ? '#10b981' : '#94a3b8' }}>({events.length})</span>
        </h4>
        
        <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <p style={{ margin: 0 }}>⏳ Waiting for events...</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
                Try sending a message in another window!
              </p>
            </div>
          ) : (
            events.map((event, idx) => (
              <div key={idx} style={{ 
                padding: '0.75rem', 
                borderBottom: idx < events.length - 1 ? '1px solid #e2e8f0' : 'none',
                background: idx === events.length - 1 ? '#f0fdf4' : 'transparent'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#2563eb' }}>{event.type}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{event.time}</span>
                </div>
                <pre style={{ 
                  fontSize: '0.75rem', 
                  background: '#f8fafc', 
                  padding: '0.5rem', 
                  borderRadius: '0.25rem', 
                  margin: 0,
                  overflow: 'auto',
                  maxHeight: '150px'
                }}>
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
        <strong>💡 Tip:</strong> If status is not "SUBSCRIBED", check:
        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
          <li>RLS policies on ticket_messages table</li>
          <li>Browser console for WebSocket errors</li>
          <li>Refresh the page if stuck on "connecting"</li>
        </ul>
      </div>
    </div>
  )
}

export default RealtimeTest
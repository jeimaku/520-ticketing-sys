import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useNotifications = (isAuthenticated) => {
  const [notifications, setNotifications] = useState([])
  const [newTicketCount, setNewTicketCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) return

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('tickets')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'tickets' 
        }, 
        (payload) => {
          handleNewTicket(payload.new)
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          handleTicketUpdate(payload.new)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [isAuthenticated])

  const handleNewTicket = async (ticket) => {
    try {
      // Fetch company name for the notification
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', ticket.company_id)
        .single()

      const notification = {
        id: ticket.id,
        type: 'new_ticket',
        title: 'New Support Ticket',
        message: `New ticket from ${ticket.contact_name} at ${company?.name || 'Unknown Company'}`,
        timestamp: new Date(),
        read: false,
        ticket: ticket
      }

      setNotifications(prev => [notification, ...prev])
      setNewTicketCount(prev => prev + 1)

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('New Support Ticket', {
          body: `${ticket.contact_name} submitted a ticket at ${company?.name || 'Unknown Company'}`,
          icon: '/favicon.ico',
          tag: `ticket-${ticket.id}`
        })
      }

      // Show desktop alert (optional)
      if (window.confirm(`New ticket received from ${ticket.contact_name}. View now?`)) {
        // Could scroll to ticket or open details
        console.log('User wants to view ticket:', ticket.id)
      }

    } catch (error) {
      console.error('Error handling new ticket notification:', error)
    }
  }

  const handleTicketUpdate = async (ticket) => {
    // You could add notifications for status changes here if needed
    console.log('Ticket updated:', ticket.id)
  }

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
    setNewTicketCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    setNewTicketCount(0)
  }

  const clearNotifications = () => {
    setNotifications([])
    setNewTicketCount(0)
  }

  return {
    notifications,
    newTicketCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  }
}
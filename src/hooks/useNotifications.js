import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useNotifications = (isAuthenticated) => {
  const [notifications, setNotifications] = useState([])
  const [newTicketCount, setNewTicketCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) return

    // 1. Setup the channel
    const channel = supabase
      .channel('realtime-tickets')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          console.log('Realtime Update Received:', payload) // Debug log
          const newTicket = payload.new
          
          // Create notification object
          const newNotif = {
            id: newTicket.id, // Use ticket ID or generate a random ID
            title: 'New Ticket Received',
            message: `${newTicket.contact_name}: ${newTicket.issue_description?.substring(0, 30)}...`,
            timestamp: new Date(),
            read: false,
            ticketId: newTicket.id
          }

          // Update State
          setNotifications((prev) => [newNotif, ...prev])
          setNewTicketCount((prev) => prev + 1)
          
          // Play Sound (Optional)
          try {
            const audio = new Audio("https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3")
            audio.volume = 2.0
            audio.play().catch(e => console.error("Audio blocked", e))
          } catch (e) {}
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Listening for new tickets...')
        }
      })

    // 2. Cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAuthenticated])

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setNewTicketCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
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
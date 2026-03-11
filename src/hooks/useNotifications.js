import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export const useNotifications = (isAuthenticated) => {
  const [notifications, setNotifications] = useState([])
  const [newTicketCount, setNewTicketCount] = useState(0)

  // Sound and Volume States with LocalStorage persistence
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('notificationMuted') === 'true')
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('notificationVolume')
    return saved !== null ? parseFloat(saved) : 0.5 // Default to 50% volume
  })

  // We use refs so the Supabase real-time listener always has the latest 
  // values without needing to disconnect and reconnect on every volume tweak.
  const isMutedRef = useRef(isMuted)
  const volumeRef = useRef(volume)

  // Sync state to refs and local storage
  useEffect(() => {
    isMutedRef.current = isMuted
    localStorage.setItem('notificationMuted', isMuted)
  }, [isMuted])

  useEffect(() => {
    volumeRef.current = volume
    localStorage.setItem('notificationVolume', volume)
  }, [volume])

  const toggleMute = () => setIsMuted(prev => !prev)

  useEffect(() => {
    if (!isAuthenticated) return

    // -----------------------------------------------------
    // 1. Setup the NEW TICKETS channel
    // -----------------------------------------------------
    const ticketChannel = supabase
      .channel('realtime-tickets')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          const newTicket = payload.new
          
          const newNotif = {
            id: newTicket.id, 
            title: 'New Ticket Received',
            message: `${newTicket.contact_name}: ${newTicket.issue_description?.substring(0, 30)}...`,
            timestamp: new Date(),
            read: false,
            ticketId: newTicket.id
          }

          setNotifications((prev) => [newNotif, ...prev])
          setNewTicketCount((prev) => prev + 1)
          
          if (!isMutedRef.current) {
            try {
              const audio = new Audio("/sounds/ticket-alert.mp3") 
              audio.volume = volumeRef.current
              audio.play().catch(e => console.error("Ticket audio blocked", e))
            } catch (e) {
              console.error("Audio initialization error", e)
            }
          }
        }
      )
      .subscribe()

    // -----------------------------------------------------
    // 2. Setup the NEW MESSAGES channel
    // -----------------------------------------------------
    const messageChannel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
        },
        (payload) => {
          const newMessage = payload.new
          
          // STRICT CHECK: Only trigger if the sender is the user/client
          // (Adjust 'sender_type' if your database column is named differently)
          if (newMessage.sender_type !== 'admin') {
            
            const newNotif = {
              id: newMessage.id,
              title: 'New Client Message',
              message: `A client sent a message in ticket #${newMessage.ticket_id?.substring(0,8)}...`,
              timestamp: new Date(),
              read: false,
              ticketId: newMessage.ticket_id
            }

            setNotifications((prev) => [newNotif, ...prev])
            setNewTicketCount((prev) => prev + 1)
            
            // Play the unique message alert sound
            if (!isMutedRef.current) {
              try {
                const messageAudio = new Audio("/sounds/message-alert.mp3") 
                messageAudio.volume = volumeRef.current
                messageAudio.play().catch(e => console.error("Message audio blocked", e))
              } catch (e) {
                console.error("Message audio initialization error", e)
              }
            }
          }
        }
      )
      .subscribe()

    // 3. Cleanup both channels on unmount
    return () => {
      supabase.removeChannel(ticketChannel)
      supabase.removeChannel(messageChannel)
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
    clearNotifications,
    isMuted,
    toggleMute,
    volume,
    setVolume
  }
}
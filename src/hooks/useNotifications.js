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
            id: newTicket.id, 
            title: 'New Ticket Received',
            message: `${newTicket.contact_name}: ${newTicket.issue_description?.substring(0, 30)}...`,
            timestamp: new Date(),
            read: false,
            ticketId: newTicket.id
          }

          // Update State
          setNotifications((prev) => [newNotif, ...prev])
          setNewTicketCount((prev) => prev + 1)
          
          // Play Custom Sound Logic
          if (!isMutedRef.current) {
            try {
              const audio = new Audio("/sounds/ticket-alert.mp3") // Path to Vite public folder
              audio.volume = volumeRef.current
              audio.play().catch(e => console.error("Audio playback blocked by browser", e))
            } catch (e) {
              console.error("Audio initialization error", e)
            }
          }
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
  }, [isAuthenticated]) // Only re-run if authentication status changes

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
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const TicketThread = ({ ticketId, senderType, senderName, readOnly = false }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [otherPersonTyping, setOtherPersonTyping] = useState(false)
  
  const messagesEndRef = useRef(null)
  const lastMessageCountRef = useRef(0)
  const pollingIntervalRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const lastTypingBroadcastRef = useRef(0)

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      // Today - show time only
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else if (diffInHours < 48) {
      // Yesterday
      return 'Yesterday ' + date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else {
      // Older - show date and time
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }) + ' ' + date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }

  // Fetch messages and mark as read
  const fetchMessages = async (showNotification = false) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      if (data) {
        // Check if there are new messages
        if (showNotification && data.length > lastMessageCountRef.current) {
          const newCount = data.length - lastMessageCountRef.current
          console.log(`✨ ${newCount} new message(s) received!`)
          setHasNewMessages(true)
          
          // Auto-dismiss notification after 3 seconds
          setTimeout(() => setHasNewMessages(false), 3000)
        }
        
        lastMessageCountRef.current = data.length
        setMessages(data)

        // Mark unread messages as read (messages not from me)
        const unreadMessages = data.filter(
          msg => !msg.is_read && msg.sender_type !== senderType
        )
        
        if (unreadMessages.length > 0) {
          const unreadIds = unreadMessages.map(msg => msg.id)
          await supabase
            .from('ticket_messages')
            .update({ is_read: true })
            .in('id', unreadIds)
        }
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error)
    }
  }

  // Broadcast typing status (throttled)
  const broadcastTyping = async () => {
    const now = Date.now()
    // Only broadcast once per 2 seconds to avoid spam
    if (now - lastTypingBroadcastRef.current < 2000) return
    
    lastTypingBroadcastRef.current = now
    
    // Store typing status in a separate table or use broadcast
    // For simplicity, we'll use localStorage as a signal
    localStorage.setItem(`typing_${ticketId}_${senderType}`, Date.now().toString())
  }

  // Check if other person is typing
  const checkOtherPersonTyping = () => {
    const otherType = senderType === 'user' ? 'admin' : 'user'
    const typingTimestamp = localStorage.getItem(`typing_${ticketId}_${otherType}`)
    
    if (typingTimestamp) {
      const timestamp = parseInt(typingTimestamp)
      const now = Date.now()
      // Show typing if they typed within last 3 seconds
      setOtherPersonTyping(now - timestamp < 3000)
    } else {
      setOtherPersonTyping(false)
    }
  }

  // Initial fetch and polling setup
  useEffect(() => {
    fetchMessages()

    // Set up polling every 3 seconds for messages
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(true)
      checkOtherPersonTyping()
    }, 3000)

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      // Clear typing indicator
      localStorage.removeItem(`typing_${ticketId}_${senderType}`)
    }
  }, [ticketId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value)
    
    // Broadcast that user is typing
    broadcastTyping()
    
    // Clear typing indicator after 3 seconds of no typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      localStorage.removeItem(`typing_${ticketId}_${senderType}`)
    }, 3000)
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return null

    const fileExt = selectedFile.name.split('.').pop()
    const safeName = selectedFile.name.replace(/[^a-zA-Z0-9]/g, '_')
    const fileName = `${ticketId}/${Date.now()}_${safeName}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('ticket-attachments')
      .upload(fileName, selectedFile)

    if (uploadError) {
      console.error('❌ Upload Error:', uploadError)
      alert('Error uploading file: ' + uploadError.message)
      return null
    }

    const { data } = supabase.storage
      .from('ticket-attachments')
      .getPublicUrl(fileName)

    return {
      name: selectedFile.name,
      url: data.publicUrl,
      type: selectedFile.type
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() && !selectedFile) return

    setUploading(true)
    
    // Clear typing indicator immediately
    localStorage.removeItem(`typing_${ticketId}_${senderType}`)

    try {
      let attachmentData = []
      
      if (selectedFile) {
        const fileData = await handleFileUpload()
        if (fileData) {
          attachmentData.push(fileData)
        } else {
          setUploading(false)
          return 
        }
      }

      // ✅ OPTIMISTIC UPDATE
      const tempId = `temp-${Date.now()}`
      const optimisticMessage = {
        id: tempId,
        ticket_id: ticketId,
        sender_type: senderType,
        sender_name: senderName,
        message: newMessage,
        attachments: attachmentData,
        is_read: false,
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, optimisticMessage])
      lastMessageCountRef.current += 1

      // Clear inputs
      const messageToSend = newMessage
      setNewMessage('')
      setSelectedFile(null)

      // Insert to database
      const { data: insertedData, error } = await supabase
        .from('ticket_messages')
        .insert([{
          ticket_id: ticketId,
          sender_type: senderType,
          sender_name: senderName,
          message: messageToSend,
          attachments: attachmentData, 
          is_read: false
        }])
        .select()

      if (error) throw error

      // Replace temp message with real one
      if (insertedData && insertedData.length > 0) {
        setMessages(prev => 
          prev.map(msg => msg.id === tempId ? insertedData[0] : msg)
        )
      }

    } catch (error) {
      console.error('❌ Error sending message:', error)
      alert('Failed to send message.')
      fetchMessages()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid #e2e8f0', borderRadius: '1rem', background: '#fff', overflow: 'hidden', position: 'relative' }}>
      
      {/* New Message Notification */}
      {hasNewMessages && (
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#10b981',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '999px',
          fontSize: '0.85rem',
          fontWeight: '600',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)',
          zIndex: 10,
          animation: 'slideDown 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>✨</span> New message received!
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: '600', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
        <span>Conversation History</span>
        <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          ● Auto-updating
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '300px', maxHeight: '500px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', marginTop: '2rem' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_type === senderType
            const isOptimistic = msg.id?.toString().startsWith('temp-')
            const showTimestamp = index === 0 || 
              (new Date(msg.created_at) - new Date(messages[index - 1].created_at)) > 300000 // 5 minutes
            
            return (
              <div key={msg.id}>
                {/* Timestamp Divider */}
                {showTimestamp && (
                  <div style={{ 
                    textAlign: 'center', 
                    fontSize: '0.7rem', 
                    color: '#94a3b8', 
                    margin: '1rem 0 0.5rem',
                    fontWeight: '500'
                  }}>
                    {formatTime(msg.created_at)}
                  </div>
                )}
                
                <div style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {/* Sender name (only for other person) */}
                  {!isMe && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', padding: '0 0.5rem', fontWeight: '600' }}>
                      {msg.sender_name}
                    </div>
                  )}
                  
                  <div style={{ 
                    padding: '1rem', 
                    borderRadius: '1rem', 
                    borderTopRightRadius: isMe ? '0' : '1rem',
                    borderTopLeftRadius: isMe ? '1rem' : '0',
                    background: isMe ? '#2563eb' : 'white', 
                    color: isMe ? 'white' : '#334155',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    border: isMe ? 'none' : '1px solid #e2e8f0',
                    opacity: isOptimistic ? 0.7 : 1,
                    transition: 'opacity 0.3s',
                    position: 'relative'
                  }}>
                    {msg.message && <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.message}</p>}
                    
                    {/* Attachments */}
                    {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div style={{ marginTop: msg.message ? '0.75rem' : '0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {msg.attachments.map((file, idx) => (
                          <div key={idx}>
                            {(file.type && file.type.startsWith('image/')) || (file.name && file.name.match(/\.(jpg|jpeg|png|gif)$/i)) ? (
                              <a href={file.url} target="_blank" rel="noopener noreferrer">
                                <img 
                                  src={file.url} 
                                  alt={file.name} 
                                  style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }} 
                                />
                              </a>
                            ) : (
                              <a href={file.url} target="_blank" rel="noopener noreferrer" 
                                 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: isMe ? 'white' : '#2563eb', fontSize: '0.85rem', background: isMe ? 'rgba(255,255,255,0.2)' : '#f1f5f9', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                <span>📎</span> {file.name}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Message time and read status */}
                    <div style={{ 
                      fontSize: '0.65rem', 
                      marginTop: '0.5rem', 
                      color: isMe ? 'rgba(255,255,255,0.7)' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      justifyContent: 'flex-end'
                    }}>
                      {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      {isMe && (
                        <span style={{ marginLeft: '0.25rem' }}>
                          {isOptimistic ? '○' : msg.is_read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        
        {/* Typing Indicator */}
        {otherPersonTyping && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
            <div style={{ 
              padding: '0.75rem 1rem', 
              borderRadius: '1rem', 
              borderTopLeftRadius: '0',
              background: 'white', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              gap: '0.25rem',
              alignItems: 'center'
            }}>
              <div className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', animation: 'typing 1.4s infinite' }}></div>
              <div className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', animation: 'typing 1.4s infinite 0.2s' }}></div>
              <div className="typing-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', animation: 'typing 1.4s infinite 0.4s' }}></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}

      {/* Input Area - Conditionally Rendered */}
      {readOnly ? (
        <div style={{ padding: '1rem', background: '#ffffff', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#ef4444', fontWeight: '500', background: '#fef2f2', padding: '0.75rem', borderRadius: '0.5rem', border: '1px dashed #fecaca' }}>
            ⚠️ You are logged in as Admin. <br/>
            Please reply via the <b>Admin Dashboard</b> to avoid confusion.
          </p>
        </div>
      ) : (
      <form onSubmit={handleSendMessage} style={{ padding: '1rem', background: 'white', borderTop: '1px solid #f1f5f9' }}>
        {selectedFile && (
          <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#eff6ff', padding: '0.5rem', borderRadius: '0.5rem' }}>
            <span>📄 {selectedFile.name}</span>
            <button type="button" onClick={() => setSelectedFile(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 'bold' }}>✕</button>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <label style={{ cursor: 'pointer', padding: '0.8rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', color: '#64748b', background: '#f8fafc' }} title="Attach File">
            <input type="file" style={{ display: 'none' }} onChange={(e) => setSelectedFile(e.target.files[0])} />
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </label>
          
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type your message..."
            disabled={uploading}
            style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', outline: 'none' }}
          />
          
          <button 
            type="submit" 
            disabled={uploading || (!newMessage.trim() && !selectedFile)}
            style={{ padding: '0 1.5rem', borderRadius: '0.75rem', border: 'none', background: '#2563eb', color: 'white', fontWeight: '600', cursor: 'pointer', opacity: (uploading || (!newMessage.trim() && !selectedFile)) ? 0.5 : 1 }}
          >
            {uploading ? '...' : 'Send'}
          </button>
        </div>
      </form>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default TicketThread
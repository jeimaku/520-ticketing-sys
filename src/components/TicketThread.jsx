import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { MessageBubble } from './MessageRenderer'

const TicketThread = ({ 
  ticketId, 
  senderType, 
  senderName, 
  readOnly = false,
  viewerType = 'user'
}) => {
  const [showReactions, setShowReactions] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [userScrolledUp, setUserScrolledUp] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null) // Message being replied to
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)
  
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const lastMessageCountRef = useRef(0)
  const pollingIntervalRef = useRef(null)
  const lastScrollTop = useRef(0)
  const inputRef = useRef(null)

  // Check if user is near the bottom
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const threshold = 100
    return scrollHeight - scrollTop - clientHeight < threshold
  }

  // Handle scroll events
  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    
    const { scrollTop } = messagesContainerRef.current
    const scrollingUp = scrollTop < lastScrollTop.current
    const nearBottom = isNearBottom()
    
    setUserScrolledUp(scrollingUp && !nearBottom)
    lastScrollTop.current = scrollTop
  }

  // Smart scroll to bottom
  const scrollToBottom = (force = false) => {
    if (!messagesEndRef.current) return
    
    if (force || (!userScrolledUp && isNearBottom())) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      setUserScrolledUp(false)
    }
  }

  // Fetch messages
  const fetchMessages = async (showNotification = false) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      if (data) {
        const hadNewMessages = showNotification && data.length > lastMessageCountRef.current
        if (hadNewMessages) {
          const newCount = data.length - lastMessageCountRef.current
          console.log(`✨ ${newCount} new message(s) received!`)
          setHasNewMessages(true)
          
          // Show typing indicator briefly for realism
          setShowTypingIndicator(true)
          setTimeout(() => setShowTypingIndicator(false), 1000)
          
          setTimeout(() => setHasNewMessages(false), 3000)
          
          if (!userScrolledUp) {
            setTimeout(() => scrollToBottom(), 500)
          }
        }
        
        lastMessageCountRef.current = data.length
        setMessages(data)

        // Mark unread messages as read
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

  // Initial load
  useEffect(() => {
    fetchMessages()
    setTimeout(() => scrollToBottom(true), 100)
    
    const interval = setInterval(() => fetchMessages(true), 3000)
    pollingIntervalRef.current = interval
    
    return () => {
      clearInterval(interval)
    }
  }, [ticketId])

  // Handle reply
  const handleReply = (messageData) => {
    setReplyingTo(messageData)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.size <= 10 * 1024 * 1024) {
      setSelectedFile(file)
    } else {
      alert('File size must be less than 10MB')
    }
  }

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || uploading) return

    setUploading(true)
    let attachmentUrl = null

    try {
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `ticket-attachments/${ticketId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, selectedFile)

        if (uploadError) {
          console.warn('File upload failed:', uploadError)
        } else {
          const { data } = supabase.storage
            .from('attachments')
            .getPublicUrl(filePath)
          
          attachmentUrl = data.publicUrl
        }
      }

      // Prepare message with reply data if replying
      let finalMessage = newMessage.trim() || `📎 Sent an attachment: ${selectedFile?.name}`
      
      if (replyingTo) {
        // 1. Get the original message text (truncate if it's too long)
        const originalText = replyingTo.message || 'Attachment'
        const quotedText = originalText.length > 50 
          ? originalText.substring(0, 50) + '...' 
          : originalText

        // 2. Format it with Bold header and Quotes
        // The \n\n adds a space between the quote and your new message
        finalMessage = `Replying to ${replyingTo.senderName}: "${quotedText}"\n\n${finalMessage}`
      }

      const messageData = {
        ticket_id: ticketId,
        sender_type: senderType,
        sender_name: senderName,
        message: finalMessage,
        created_at: new Date().toISOString(),
        // Note: In a real implementation, you'd want to store reply data properly in the database
        // reply_to_id: replyingTo?.messageId || null
      }

      if (attachmentUrl) {
        messageData.attachment_url = attachmentUrl
      }

      const { error } = await supabase
        .from('ticket_messages')
        .insert([messageData])

      if (error) throw error

      setNewMessage('')
      setSelectedFile(null)
      setReplyingTo(null) // Clear reply
      
      setTimeout(() => {
        scrollToBottom(true)
        fetchMessages()
      }, 100)

    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // Handle quick reactions
  const handleQuickReaction = (emoji) => {
    setNewMessage(emoji)
    // Auto-send emoji reactions
    setTimeout(() => {
      if (inputRef.current) {
        const event = new Event('submit', { bubbles: true, cancelable: true })
        inputRef.current.closest('form').dispatchEvent(event)
      }
    }, 100)
  }

  const styles = {
    container: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
      borderRadius: '1rem',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      position: 'relative'
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      scrollbarWidth: 'thin',
      scrollbarColor: '#cbd5e1 transparent'
    },
    inputContainer: {
      padding: '1rem 1.5rem',
      borderTop: '1px solid #e2e8f0',
      background: 'white',
      borderBottomLeftRadius: '1rem',
      borderBottomRightRadius: '1rem'
    },
    replyPreview: {
      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      border: '1px solid #3b82f6',
      borderRadius: '0.75rem',
      padding: '0.75rem 1rem',
      marginBottom: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    quickReactions: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '0.75rem',
      padding: '0.5rem',
      background: '#f8fafc',
      borderRadius: '0.75rem',
      border: '1px solid #e2e8f0'
    },
    quickReactionBtn: {
      background: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '50%',
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: '1.1rem',
      transition: 'all 0.2s'
    },
    inputForm: {
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'flex-end'
    },
    textInput: {
      flex: 1,
      padding: '0.875rem 1.25rem',
      border: '1px solid #d1d5db',
      borderRadius: '1.5rem',
      fontSize: '0.9rem',
      resize: 'none',
      minHeight: '44px',
      maxHeight: '120px',
      fontFamily: 'inherit',
      background: 'white',
      outline: 'none',
      transition: 'all 0.2s',
      lineHeight: '1.4'
    },
    sendButton: {
      padding: '0.875rem 1.5rem',
      background: viewerType === 'admin' ? '#1e293b' : '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '1.5rem',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '0.9rem',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      height: '44px'
    },
    fileButton: {
      padding: '0.875rem',
      background: '#f3f4f6',
      color: '#6b7280',
      border: '1px solid #d1d5db',
      borderRadius: '50%',
      cursor: 'pointer',
      fontSize: '1.1rem',
      transition: 'all 0.2s',
      width: '44px',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    emptyState: {
      textAlign: 'center',
      padding: '4rem 2rem',
      color: '#9ca3af',
      fontSize: '0.9rem',
      background: 'white',
      borderRadius: '1rem',
      margin: '2rem',
      border: '2px dashed #e5e7eb'
    },
    notification: {
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      background: '#10b981',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '0.75rem',
      fontSize: '0.8rem',
      fontWeight: '600',
      animation: 'slideInRight 0.3s ease',
      zIndex: 10,
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
    },
    typingIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '1rem',
      color: '#64748b',
      fontSize: '0.85rem',
      fontStyle: 'italic'
    },
    filePreview: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem',
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '0.75rem',
      fontSize: '0.85rem',
      marginBottom: '0.75rem'
    }
  }

  return (
    <div style={styles.container}>
      {hasNewMessages && (
        <div style={styles.notification}>
          ✨ New message received
        </div>
      )}
      
      <div 
        ref={messagesContainerRef}
        style={styles.messagesContainer}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#64748b' }}>
              No messages yet
            </div>
            <div>Start the conversation to begin receiving support</div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              messageId={message.id}
              message={message.message}
              senderType={message.sender_type}
              senderName={message.sender_name}
              timestamp={message.created_at}
              isRead={message.is_read}
              showSender={true}
              viewerType={viewerType}
              onReply={handleReply}
              replyTo={message.reply_to_id ? messages.find(m => m.id === message.reply_to_id) : null}
            />
          ))
        )}

        {/* Typing indicator */}
        {showTypingIndicator && (
          <div style={styles.typingIndicator}>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <div style={{ 
                width: '6px', 
                height: '6px', 
                background: '#64748b', 
                borderRadius: '50%',
                animation: 'typing 1.4s infinite'
              }} />
              <div style={{ 
                width: '6px', 
                height: '6px', 
                background: '#64748b', 
                borderRadius: '50%',
                animation: 'typing 1.4s infinite 0.2s'
              }} />
              <div style={{ 
                width: '6px', 
                height: '6px', 
                background: '#64748b', 
                borderRadius: '50%',
                animation: 'typing 1.4s infinite 0.4s'
              }} />
            </div>
            Someone is typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {userScrolledUp && hasNewMessages && (
        <div 
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#3b82f6',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s',
            zIndex: 10
          }}
          onClick={() => scrollToBottom(true)}
        >
          ↓ New messages below
        </div>
      )}

      {!readOnly && (
        <div style={styles.inputContainer}>
          {/* Reply Preview */}
          {replyingTo && (
            <div style={styles.replyPreview}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.25rem' }}>
                  Replying to {replyingTo.senderName}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                  {replyingTo.message}
                </div>
              </div>
              <button 
                onClick={() => setReplyingTo(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '0.25rem'
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Reactions */}
          <div style={styles.quickReactions}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginRight: '0.5rem', display: 'flex', alignItems: 'center' }}>
              Quick:
            </div>
            {['👍', '👎', '❤️', '😊', '🙏', '✅'].map((emoji) => (
              <button
                key={emoji}
                style={styles.quickReactionBtn}
                onClick={() => handleQuickReaction(emoji)}
                onMouseOver={(e) => {
                  e.target.style.background = '#f3f4f6'
                  e.target.style.transform = 'scale(1.1)'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'white'
                  e.target.style.transform = 'scale(1)'
                }}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div style={styles.filePreview}>
              <span style={{ fontSize: '1.2rem' }}>📎</span>
              <span style={{ fontWeight: '500', color: '#0c4a6e' }}>{selectedFile.name}</span>
              <button 
                onClick={() => setSelectedFile(null)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#ef4444', 
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  marginLeft: 'auto'
                }}
              >
                ✕
              </button>
            </div>
          )}
          
          <form onSubmit={sendMessage} style={styles.inputForm}>
            <input
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="file-input"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            
            <label htmlFor="file-input" style={styles.fileButton}>
              📎
            </label>
            
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                replyingTo 
                  ? `Reply to ${replyingTo.senderName}...`
                  : viewerType === 'admin' 
                    ? 'Type your response...' 
                    : 'Type your message...'
              }
              style={{
                ...styles.textInput,
                borderColor: newMessage.trim() ? (viewerType === 'admin' ? '#1e293b' : '#3b82f6') : '#d1d5db'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(e)
                }
              }}
            />
            
            <button 
              type="submit" 
              disabled={(!newMessage.trim() && !selectedFile) || uploading}
              style={{
                ...styles.sendButton,
                opacity: (!newMessage.trim() && !selectedFile) || uploading ? 0.5 : 1,
                cursor: (!newMessage.trim() && !selectedFile) || uploading ? 'not-allowed' : 'pointer',
                background: uploading ? '#94a3b8' : styles.sendButton.background
              }}
            >
              {uploading ? '⏳' : '📤'}
              {uploading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      )}
      
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}

export default TicketThread
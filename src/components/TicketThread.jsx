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
  const [replyingTo, setReplyingTo] = useState(null)
  const [showTypingIndicator, setShowTypingIndicator] = useState(false)
  
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const lastMessageCountRef = useRef(0)
  const pollingIntervalRef = useRef(null)
  const lastScrollTop = useRef(0)
  const inputRef = useRef(null)

  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const threshold = 100
    return scrollHeight - scrollTop - clientHeight < threshold
  }

  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop } = messagesContainerRef.current
    const scrollingUp = scrollTop < lastScrollTop.current
    const nearBottom = isNearBottom()
    setUserScrolledUp(scrollingUp && !nearBottom)
    lastScrollTop.current = scrollTop
  }

  const scrollToBottom = (force = false) => {
    if (!messagesEndRef.current) return
    if (force || (!userScrolledUp && isNearBottom())) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
      setUserScrolledUp(false)
    }
  }

  const fetchMessages = async (showNotification = false) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      if (data) {
        const newMsgCount = data.length - lastMessageCountRef.current
        
        if (showNotification && newMsgCount > 0) {
          // 🛑 THE FIX: Check if the new messages actually came from the OTHER person
          const newMessages = data.slice(lastMessageCountRef.current)
          const fromSomeoneElse = newMessages.some(msg => msg.sender_type !== senderType)

          // Only show the alert if it's from someone else
          if (fromSomeoneElse) {
            setHasNewMessages(true)
            setShowTypingIndicator(true)
            setTimeout(() => setShowTypingIndicator(false), 1000)
            setTimeout(() => setHasNewMessages(false), 3000)
          }
          
          setTimeout(() => scrollToBottom(), 100)
        }
        
        lastMessageCountRef.current = data.length
        setMessages(data)

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

  useEffect(() => {
    // 1. Fetch the initial history of messages
    fetchMessages()
    setTimeout(() => scrollToBottom(true), 500)

    // 2. Set up the polling interval (checks every 3 seconds)
    const interval = setInterval(() => {
      fetchMessages(true)
    }, 3000)
    
    pollingIntervalRef.current = interval

    // 3. Clean up the interval when leaving the page
    return () => clearInterval(interval)
    
    // 🛑 THE FIX: We completely removed userScrolledUp from this array!
  }, [ticketId, senderType])

  const handleReply = (messageData) => {
    setReplyingTo(messageData)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file && file.size <= 10 * 1024 * 1024) {
      setSelectedFile(file)
    } else {
      alert('File size must be less than 10MB')
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || uploading) return

    setUploading(true)
    let attachmentUrl = null

    try {
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        // Fix 1: Cleaned up the file path so it doesn't duplicate the bucket name
        const filePath = `${ticketId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(filePath, selectedFile)

        // 🛑 THE CRITICAL FIX: If upload fails, stop everything and alert!
        if (uploadError) {
          console.error('File upload failed:', uploadError)
          alert(`Upload failed: ${uploadError.message}`)
          setUploading(false)
          return // This stops the empty bubble from being created
        }

        const { data } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(filePath)
        attachmentUrl = data.publicUrl
      }

      let finalMessage = newMessage.trim();

      if (replyingTo) {
        const originalText = replyingTo.message || 'Attachment'
        const quotedText = originalText.length > 50 
          ? originalText.substring(0, 50) + '...' 
          : originalText
        finalMessage = `Replying to ${replyingTo.senderName}: "${quotedText}"\n\n${finalMessage}`
      }

      const messageData = {
        ticket_id: ticketId,
        sender_type: senderType,
        sender_name: senderName,
        message: finalMessage, 
        attachment_url: attachmentUrl,
      }

    // Add .select() so Supabase hands the message right back to us immediately
      const { data: newlyInsertedMessage, error } = await supabase
        .from('ticket_messages')
        .insert([messageData])
        .select()

      if (error) throw error

      // ⚡ INSTANT UPDATE: Add it to the screen right now!
      if (newlyInsertedMessage && newlyInsertedMessage.length > 0) {
        setMessages(prevMessages => [...prevMessages, newlyInsertedMessage[0]])
        lastMessageCountRef.current += 1 // Tell the poll to ignore this message
      }

      // Reset everything back to normal
      setNewMessage('')
      setSelectedFile(null)
      setReplyingTo(null)
      
      // Fix 2: Reset the actual HTML file input so you can upload the same file again if needed
      const fileInput = document.getElementById('file-input')
      if (fileInput) fileInput.value = ''

      setTimeout(() => {
        scrollToBottom(true)
      }, 100)

    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message.')
    } finally {
      setUploading(false)
    }
  }
  
  const handleQuickReaction = (emoji) => {
    setNewMessage(emoji)
    setTimeout(() => {
      if (inputRef.current) {
        const event = new Event('submit', { bubbles: true, cancelable: true })
        inputRef.current.closest('form').dispatchEvent(event)
      }
    }, 100)
  }

  const styles = {
    container: { height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)', borderRadius: '1rem', border: '1px solid #e2e8f0', overflow: 'hidden', position: 'relative' },
    messagesContainer: { flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
    inputContainer: { padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: 'white' },
    replyPreview: { background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '1px solid #3b82f6', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    quickReactions: { display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' },
    quickReactionBtn: { background: 'white', border: '1px solid #d1d5db', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    inputForm: { display: 'flex', gap: '0.75rem', alignItems: 'flex-end' },
    textInput: { flex: 1, padding: '0.875rem 1.25rem', border: '1px solid #d1d5db', borderRadius: '1.5rem', fontSize: '0.9rem', resize: 'none', minHeight: '44px' },
    sendButton: { padding: '0.875rem 1.5rem', background: viewerType === 'admin' ? '#1e293b' : '#3b82f6', color: 'white', border: 'none', borderRadius: '1.5rem', fontWeight: '600', cursor: 'pointer', height: '44px', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    fileButton: { padding: '0.875rem', background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '50%', cursor: 'pointer', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    emptyState: { textAlign: 'center', padding: '4rem 2rem', color: '#9ca3af' },
    notification: { position: 'absolute', top: '1rem', right: '1rem', background: '#10b981', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.75rem', zIndex: 10 },
    typingIndicator: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', color: '#64748b', fontSize: '0.85rem' },
    filePreview: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.75rem', marginBottom: '0.75rem' }
  }

  return (
    <div style={styles.container}>
      {hasNewMessages && <div style={styles.notification}>✨ New message received</div>}
      
      <div ref={messagesContainerRef} style={styles.messagesContainer} onScroll={handleScroll}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '3rem' }}>💬</div>
            <div>No messages yet</div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              messageId={message.id}
              message={message.message}
              attachmentUrl={message.attachment_url} // FIXED: Explicitly passing from DB schema column
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
        {showTypingIndicator && <div style={styles.typingIndicator}>Someone is typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      {!readOnly && (
        <div style={styles.inputContainer}>
          {replyingTo && (
            <div style={styles.replyPreview}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>Replying to {replyingTo.senderName}</div>
                <div style={{ fontSize: '0.85rem' }}>{replyingTo.message}</div>
              </div>
              <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          )}

          <div style={styles.quickReactions}>
            {['👍', '👎', '❤️', '😊', '🙏', '✅'].map((emoji) => (
              <button key={emoji} style={styles.quickReactionBtn} onClick={() => handleQuickReaction(emoji)}>{emoji}</button>
            ))}
          </div>

          {selectedFile && (
            <div style={styles.filePreview}>
              <span>📎</span>
              <span>{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} style={{ background: 'none', border: 'none', color: '#ef4444', marginLeft: 'auto', cursor: 'pointer' }}>✕</button>
            </div>
          )}
          
          <form onSubmit={sendMessage} style={styles.inputForm}>
            <input type="file" onChange={handleFileSelect} style={{ display: 'none' }} id="file-input" accept="image/*,.pdf,.doc,.docx,.txt" />
            <label htmlFor="file-input" style={styles.fileButton}>📎</label>
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={replyingTo ? `Reply to ${replyingTo.senderName}...` : 'Type your message...'}
              style={styles.textInput}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
            />
            <button type="submit" disabled={(!newMessage.trim() && !selectedFile) || uploading} style={{ ...styles.sendButton, opacity: uploading ? 0.5 : 1 }}>
              {uploading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default TicketThread
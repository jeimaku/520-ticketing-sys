// src/components/MessageRenderer.jsx
import React, { useState } from 'react'
import { parseStructuredMessage, hasStructuredFormatting } from './AutomationMessages'

const MessageRenderer = ({ message, senderType, senderName }) => {
  // Check if this is an automated message that needs special formatting
  const isAutomatedMessage = senderName === 'Automated Assistant'
  const needsFormatting = hasStructuredFormatting(message)

  if (!isAutomatedMessage || !needsFormatting) {
    // Regular message - display as plain text
    return (
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
        {message}
      </div>
    )
  }

  // Parse and render structured message
  const parts = parseStructuredMessage(message)
  
  return (
    <div style={{ lineHeight: '1.6' }}>
      {parts.map((part, index) => {
        switch (part.type) {
          case 'bold':
            return (
              <strong key={index} style={{ 
                fontWeight: '600', 
                color: '#1e293b' 
              }}>
                {part.content}
              </strong>
            )
          case 'text':
            return (
              <span key={index}>
                {part.content}
              </span>
            )
          case 'break':
            return <br key={index} />
          case 'paragraph':
            return <div key={index} style={{ height: '0.75rem' }} />
          default:
            return null
        }
      })}
    </div>
  )
}

// Generate user avatar with initials and colors
const getUserAvatar = (name, isAdmin, isAutomated) => {
  if (isAutomated) {
    return {
      initials: '🤖',
      bgColor: '#10b981',
      textColor: 'white'
    }
  }

  const colors = [
    { bg: '#3b82f6', text: 'white' }, // Blue
    { bg: '#10b981', text: 'white' }, // Green  
    { bg: '#f59e0b', text: 'white' }, // Amber
    { bg: '#ef4444', text: 'white' }, // Red
    { bg: '#8b5cf6', text: 'white' }, // Purple
    { bg: '#06b6d4', text: 'white' }, // Cyan
  ]

  const nameHash = name.split('').reduce((hash, char) => hash + char.charCodeAt(0), 0)
  const colorIndex = nameHash % colors.length
  const color = colors[colorIndex]

  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return {
    initials,
    bgColor: isAdmin ? '#1e293b' : color.bg,
    textColor: color.text
  }
}

// Reply preview component
const ReplyPreview = ({ replyTo }) => {
  if (!replyTo) return null
  
  return (
    <div style={{
      background: 'rgba(0,0,0,0.05)',
      borderLeft: '3px solid #3b82f6',
      padding: '0.5rem 0.75rem',
      marginBottom: '0.5rem',
      borderRadius: '0 0.5rem 0.5rem 0',
      fontSize: '0.8rem'
    }}>
      <div style={{ 
        fontWeight: '600', 
        color: '#64748b', 
        marginBottom: '0.25rem',
        fontSize: '0.75rem'
      }}>
        Replying to {replyTo.senderName}
      </div>
      <div style={{ 
        color: '#94a3b8', 
        fontStyle: 'italic',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '200px'
      }}>
        {replyTo.message.length > 50 ? replyTo.message.substring(0, 50) + '...' : replyTo.message}
      </div>
    </div>
  )
}

// REPLACE THE MessageBubble COMPONENT WITH THIS:
export const MessageBubble = ({ 
  message, 
  messageId,
  senderType, 
  senderName, 
  timestamp, 
  isRead,
  showSender = true,
  viewerType = 'user',
  onReply = null, 
  replyTo = null 
}) => {
  const [showFullTimestamp, setShowFullTimestamp] = useState(false)
  
  const isFromViewer = viewerType === 'admin' ? senderType === 'admin' : senderType === 'user'
  const isAutomated = senderName === 'Automated Assistant'
  
  const avatar = getUserAvatar(senderName || 'Unknown', senderType === 'admin', isAutomated)
  
  const messageContainerStyle = {
    display: 'flex',
    flexDirection: isFromViewer ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    gap: '0.75rem',
    marginBottom: '1rem',
    maxWidth: '85%',
    alignSelf: isFromViewer ? 'flex-end' : 'flex-start',
    position: 'relative'
  }

  const avatarStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: avatar.bgColor,
    color: avatar.textColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: isAutomated ? '1.2rem' : '0.9rem',
    fontWeight: '600',
    flexShrink: 0,
    border: '2px solid white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'default' // Changed from pointer since it doesn't do much now
  }

  const bubbleStyle = {
    padding: '0.875rem 1.125rem',
    borderRadius: isFromViewer 
      ? '1.25rem 1.25rem 0.25rem 1.25rem' 
      : '1.25rem 1.25rem 1.25rem 0.25rem',
    wordWrap: 'break-word',
    position: 'relative',
    maxWidth: '100%',
    background: isAutomated
      ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
      : isFromViewer
        ? senderType === 'admin' 
          ? 'linear-gradient(135deg, #1e293b 0%, #475569 100%)'
          : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    color: isAutomated
      ? '#065f46'
      : isFromViewer 
        ? 'white' 
        : '#1e293b',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: isAutomated 
      ? '2px solid #10b981'
      : !isFromViewer 
        ? '1px solid #e2e8f0' 
        : 'none',
    cursor: 'pointer', // Indicates it is clickable
    transition: 'all 0.2s'
  }

  const messageInfoStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    minWidth: 0,
    position: 'relative'
  }

   const senderInfoStyle = {
    fontSize: '0.75rem',
    fontWeight: '600',
    // CHANGE THIS SECTION:
    color: isAutomated 
      ? '#059669'
      : '#64748b', // Always use dark gray, even for "isFromViewer"
    marginBottom: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }

  const timestampStyle = {
    fontSize: '0.7rem',
    color: isAutomated
      ? '#065f46'
      : isFromViewer 
        ? 'rgba(255,255,255,0.7)' 
        : '#94a3b8',
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    pointerEvents: 'none' // Prevent clicking timestamp separately
  }

  // UPDATED: Simple time formatter (from previous step)
  const formatSimpleTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const formatDetailedTime = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const getRoleDisplay = () => {
    if (isAutomated) return '🤖 AI Assistant'
    if (senderType === 'admin') return '👩‍💼 Support Team'
    return '👤 Client'
  }

  const handleReplyClick = (e) => {
    // Prevent reply if the user is just trying to select text
    const selection = window.getSelection()
    if (selection.toString().length > 0) return

    if (onReply) {
      onReply({
        messageId,
        senderName,
        message: message.length > 100 ? message.substring(0, 100) + '...' : message,
        timestamp
      })
    }
  }

  return (
    <div style={messageContainerStyle}>
      {/* Avatar */}
      <div style={avatarStyle}>
        {avatar.initials}
        {senderType === 'admin' && (
          <div style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '12px',
            height: '12px',
            background: '#10b981',
            border: '2px solid white',
            borderRadius: '50%'
          }} />
        )}
      </div>

      {/* Message Content */}
      <div style={messageInfoStyle}>
        {showSender && (
          <div style={senderInfoStyle}>
            {senderName}
            <span style={{ 
                opacity: 0.8, 
                fontSize: '0.65rem',
                // CHANGE BACKGROUND: Always use light gray for non-automated messages
                background: isAutomated
                    ? 'rgba(16, 185, 129, 0.15)'
                    : '#f1f5f9',
                
                padding: '0.125rem 0.375rem',
                borderRadius: '999px',
                
                // CHANGE TEXT COLOR: Always use dark slate
                color: isAutomated
                    ? '#059669'
                    : '#64748b'
                }}>
                {getRoleDisplay()}
            </span>
          </div>
        )}
        
        {/* CLICKABLE BUBBLE: Triggers reply on click */}
        <div 
          style={bubbleStyle}
          onClick={handleReplyClick}
          title="Click to reply"
          onMouseOver={(e) => {
            if (!isFromViewer) e.currentTarget.style.filter = 'brightness(0.97)'
          }}
          onMouseOut={(e) => {
             e.currentTarget.style.filter = 'none'
          }}
        >
          {/* Reply preview if this is a reply */}
          <ReplyPreview replyTo={replyTo} />
          
          <MessageRenderer 
            message={message}
            senderType={senderType}
            senderName={senderName}
          />
          
          <div style={timestampStyle}>
            {showFullTimestamp ? formatDetailedTime(timestamp) : formatSimpleTime(timestamp)}
            {isFromViewer && senderType === 'user' && (
              <span style={{ marginLeft: '0.25rem' }}>
                {isRead ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageRenderer
import React, { useState } from 'react'
// Note: We are using the styles defined in Admin.css

const NotificationBell = ({ 
  notifications, 
  newTicketCount, 
  markAsRead, 
  markAllAsRead, 
  clearNotifications,
  isMuted,       // NEW: Prop to check if sound is muted
  toggleMute,    // NEW: Function to toggle the sound state
  volume,        // NEW: Prop for current volume level
  setVolume      // NEW: Function to adjust volume
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const formatTime = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="notification-wrapper">
      {/* Bell Icon (Keep your existing SVG here) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`notification-btn ${isOpen ? 'active' : ''}`}
        title="View Notifications"
      >
        <svg 
          width="24" 
          height="24" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
          {newTicketCount > 0 && (
          <span className="notification-badge">
            {newTicketCount > 9 ? '9+' : newTicketCount}
          </span>
        )}
      </button>

      {/* Overlay (closes dropdown when clicking outside) */}
      {isOpen && (
        <div 
          className="dropdown-overlay" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="notification-dropdown">
          
          {/* Organized Header */}
          <div className="notification-header">
            <div className="header-left">
              <span className="notif-title">Notifications</span>
              {newTicketCount > 0 && (
                <span className="notif-count-pill">{newTicketCount} New</span>
              )}
            </div>

            <div className="header-actions">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllAsRead} className="action-link action-mark">
                    Mark all read
                  </button>
                  <button onClick={clearNotifications} className="action-link action-clear">
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>

          {/* NEW: Dedicated Sound & Volume Controls Panel */}
          <div className="sound-controls-panel">
            <button 
              onClick={toggleMute} 
              className={`mute-btn ${isMuted ? 'muted' : ''}`}
              title={isMuted ? "Unmute Notifications" : "Mute Notifications"}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              disabled={isMuted}
              className="volume-slider"
              title="Adjust Alert Volume"
            />
          </div>

          {/* Scrollable List */}
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="item-icon-box">
                    {!notification.read ? (
                      /* Unread Icon: Solid Bell or Alert */
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                         <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                    ) : (
                      /* Read Icon: Outline */
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="item-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="item-time">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
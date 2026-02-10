import React from 'react'

const AdminSidebar = ({ activeTab, setActiveTab, ticketCount, companyCount }) => {
  return (
    <aside className="admin-sidebar">
      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <span className="nav-icon">🎫</span>
          <span className="nav-text">Tickets</span>
          {ticketCount > 0 && (
            <span className="nav-badge">{ticketCount}</span>
          )}
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-text">Analytics</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'companies' ? 'active' : ''}`}
          onClick={() => setActiveTab('companies')}
        >
          <span className="nav-icon">🏢</span>
          <span className="nav-text">Companies</span>
          <span className="nav-badge">{companyCount}</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-text">Settings</span>
        </button>
      </nav>
      
      <div className="sidebar-footer">
        <a href="/" className="portal-link">
          🌐 View Portal →
        </a>
      </div>
    </aside>
  )
}

export default AdminSidebar
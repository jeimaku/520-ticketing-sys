import React from 'react'
import '../styles/AnalyticsPage.css'

const AnalyticsPage = ({ tickets, companies }) => {
  // Calculate analytics data
  const getAnalytics = () => {
    const now = new Date()
    const last7Days = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
    const last30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))

    // Company stats
    const companyStats = companies.map(company => {
      const companyTickets = tickets.filter(ticket => ticket.company_id === company.id)
      const recentTickets = companyTickets.filter(ticket => new Date(ticket.created_at) > last7Days)
      
      return {
        ...company,
        totalTickets: companyTickets.length,
        recentTickets: recentTickets.length,
        openTickets: companyTickets.filter(t => t.status === 'open').length,
        resolvedTickets: companyTickets.filter(t => t.status === 'resolved').length
      }
    }).sort((a, b) => b.totalTickets - a.totalTickets)

    // Status distribution
    const statusStats = {
      open: tickets.filter(t => t.status === 'open').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length
    }

    // Recent activity
    const last7DaysTickets = tickets.filter(ticket => new Date(ticket.created_at) > last7Days).length
    const last30DaysTickets = tickets.filter(ticket => new Date(ticket.created_at) > last30Days).length

    return {
      companyStats,
      statusStats,
      totalTickets: tickets.length,
      last7DaysTickets,
      last30DaysTickets,
      activeCompanies: companyStats.filter(c => c.totalTickets > 0).length
    }
  }

  const analytics = getAnalytics()

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1 className="analytics-title">Analytics Dashboard</h1>
        <p className="analytics-subtitle">
          Comprehensive overview of support ticket metrics
        </p>
      </div>

      {/* Overview Cards */}
      <div className="analytics-overview-grid">
        <div className="analytics-overview-card">
          <div className="analytics-card-header">
            <h3 className="analytics-card-title">Total Tickets</h3>
            <span className="analytics-card-icon">🎫</span>
          </div>
          <div className="analytics-card-metric">{analytics.totalTickets}</div>
          <p className="analytics-card-subtitle">All time submissions</p>
        </div>

        <div className="analytics-overview-card">
          <div className="analytics-card-header">
            <h3 className="analytics-card-title">Last 7 Days</h3>
            <span className="analytics-card-icon">📈</span>
          </div>
          <div className="analytics-card-metric">{analytics.last7DaysTickets}</div>
          <p className="analytics-card-subtitle">Recent activity</p>
        </div>

        <div className="analytics-overview-card">
          <div className="analytics-card-header">
            <h3 className="analytics-card-title">Active Companies</h3>
            <span className="analytics-card-icon">🏢</span>
          </div>
          <div className="analytics-card-metric">{analytics.activeCompanies}</div>
          <p className="analytics-card-subtitle">Out of {companies.length} total</p>
        </div>

        <div className="analytics-overview-card">
          <div className="analytics-card-header">
            <h3 className="analytics-card-title">Open Tickets</h3>
            <span className="analytics-card-icon">🔓</span>
          </div>
          <div className="analytics-card-metric">{analytics.statusStats.open}</div>
          <p className="analytics-card-subtitle">Requiring attention</p>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="analytics-section">
        <h2 className="analytics-section-title">Status Distribution</h2>
        <div className="analytics-status-chart">
          {Object.entries(analytics.statusStats).map(([status, count]) => (
            <div key={status} className="analytics-status-bar">
              <div className="analytics-status-info">
                <span className={`analytics-status-badge status-${status}`}>
                  {status.replace('_', ' ')}
                </span>
                <span className="analytics-status-count">{count} tickets</span>
              </div>
              <div className="analytics-status-progress">
                <div 
                  className={`analytics-progress-fill status-${status}`}
                  style={{ 
                    width: `${analytics.totalTickets > 0 ? (count / analytics.totalTickets) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Company Performance */}
      <div className="analytics-section">
        <h2 className="analytics-section-title">Company Activity</h2>
        <div className="analytics-company-table-container">
          <table className="analytics-company-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Total Tickets</th>
                <th>Recent (7d)</th>
                <th>Open</th>
                <th>Resolved</th>
                <th>Resolution Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics.companyStats.map(company => (
                <tr key={company.id}>
                  <td>
                    <div className="analytics-company-name">{company.name}</div>
                  </td>
                  <td>{company.totalTickets}</td>
                  <td>
                    <span className={company.recentTickets > 0 ? 'analytics-recent-activity' : 'analytics-no-activity'}>
                      {company.recentTickets}
                    </span>
                  </td>
                  <td>{company.openTickets}</td>
                  <td>{company.resolvedTickets}</td>
                  <td>
                    <div className="analytics-resolution-rate">
                      {company.totalTickets > 0 
                        ? `${Math.round((company.resolvedTickets / company.totalTickets) * 100)}%`
                        : '0%'
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
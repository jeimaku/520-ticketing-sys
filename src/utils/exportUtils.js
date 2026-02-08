import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export const exportToCSV = (tickets, companies, filters = {}) => {
  // Prepare data for export
  const exportData = tickets.map(ticket => {
    const company = companies.find(c => c.id === ticket.company_id)
    
    return {
      'Ticket ID': ticket.id,
      'Company': company?.name || 'Unknown',
      'Contact Name': ticket.contact_name,
      'Contact Email': ticket.contact_email,
      'Contact Phone': ticket.contact_phone || '',
      'Location': ticket.location,
      'Issue Description': ticket.issue_description,
      'Status': ticket.status.replace('_', ' ').toUpperCase(),
      'Created Date': new Date(ticket.created_at).toLocaleDateString(),
      'Created Time': new Date(ticket.created_at).toLocaleTimeString(),
      'Last Updated': new Date(ticket.updated_at).toLocaleDateString(),
      'Tracking Token': ticket.tracking_token
    }
  })

  // Create CSV content
  if (exportData.length === 0) {
    alert('No data to export')
    return
  }

  const headers = Object.keys(exportData[0])
  const csvContent = [
    headers.join(','),
    ...exportData.map(row => 
      headers.map(header => {
        let value = row[header]
        // Escape quotes and commas
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0]
  const filterSuffix = getFilterSuffix(filters)
  const filename = `tickets_export_${timestamp}${filterSuffix}.csv`

  // Download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, filename)
}

export const exportToExcel = (tickets, companies, filters = {}) => {
  // Prepare data for export
  const exportData = tickets.map(ticket => {
    const company = companies.find(c => c.id === ticket.company_id)
    
    return {
      'Ticket ID': ticket.id,
      'Company': company?.name || 'Unknown',
      'Contact Name': ticket.contact_name,
      'Contact Email': ticket.contact_email,
      'Contact Phone': ticket.contact_phone || '',
      'Location': ticket.location,
      'Issue Description': ticket.issue_description,
      'Status': ticket.status.replace('_', ' ').toUpperCase(),
      'Created Date': new Date(ticket.created_at).toLocaleDateString(),
      'Created Time': new Date(ticket.created_at).toLocaleTimeString(),
      'Last Updated': new Date(ticket.updated_at).toLocaleDateString(),
      'Tracking Token': ticket.tracking_token
    }
  })

  if (exportData.length === 0) {
    alert('No data to export')
    return
  }

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(exportData)

  // Auto-size columns
  const colWidths = []
  const headers = Object.keys(exportData[0])
  
  headers.forEach((header, index) => {
    const maxLength = Math.max(
      header.length,
      ...exportData.map(row => String(row[header] || '').length)
    )
    colWidths[index] = { width: Math.min(maxLength + 2, 50) }
  })
  
  ws['!cols'] = colWidths

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Tickets')

  // Create summary sheet
  const summaryData = createSummaryData(tickets, companies)
  const summaryWs = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0]
  const filterSuffix = getFilterSuffix(filters)
  const filename = `tickets_export_${timestamp}${filterSuffix}.xlsx`

  // Download file
  XLSX.writeFile(wb, filename)
}

const getFilterSuffix = (filters) => {
  const parts = []
  
  if (filters.company && filters.company !== 'all') {
    parts.push('filtered')
  }
  if (filters.status && filters.status !== 'all') {
    parts.push(filters.status)
  }
  if (filters.dateFrom || filters.dateTo) {
    parts.push('daterange')
  }
  
  return parts.length > 0 ? `_${parts.join('_')}` : ''
}

const createSummaryData = (tickets, companies) => {
  const summary = []
  
  // Overall stats
  summary.push({
    'Metric': 'Total Tickets',
    'Count': tickets.length,
    'Percentage': '100%'
  })
  
  // Status breakdown
  const statusCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1
    return acc
  }, {})
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    summary.push({
      'Metric': `${status.replace('_', ' ').toUpperCase()} Tickets`,
      'Count': count,
      'Percentage': `${((count / tickets.length) * 100).toFixed(1)}%`
    })
  })
  
  summary.push({ 'Metric': '', 'Count': '', 'Percentage': '' }) // Empty row
  
  // Company breakdown
  const companyCounts = {}
  tickets.forEach(ticket => {
    const company = companies.find(c => c.id === ticket.company_id)
    const companyName = company?.name || 'Unknown'
    companyCounts[companyName] = (companyCounts[companyName] || 0) + 1
  })
  
  Object.entries(companyCounts).forEach(([company, count]) => {
    summary.push({
      'Metric': `${company} Tickets`,
      'Count': count,
      'Percentage': `${((count / tickets.length) * 100).toFixed(1)}%`
    })
  })
  
  return summary
}
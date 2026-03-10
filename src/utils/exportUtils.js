import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export const exportToCSV = (tickets, companies, filters = {}) => {
  // 1. Safety Check: Ensure data exists
  if (!tickets || tickets.length === 0) {
    alert('No data to export')
    return
  }

  // 2. Format Data
  const exportData = tickets.map(ticket => {
    // Handle case where company lookup might fail or data is joined via Supabase relation
    const company = companies.find(c => c.id === ticket.company_id)
    const companyName = company ? company.name : (ticket.companies?.name || 'Unknown')
    
    // Safety check for status string
    const statusText = ticket.status ? ticket.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'

    return {
      'Ticket ID': ticket.id,
      'Company': companyName,
      'Contact Name': ticket.contact_name || '',
      'Contact Email': ticket.contact_email || '',
      'Contact Phone': ticket.contact_phone || '',
      'Location': ticket.location || '',
      'Issue Description': (ticket.issue_description || '').replace(/(\r\n|\n|\r)/gm, " "), // Remove newlines for CSV safety
      'Status': statusText,
      'Created Date': ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : '',
      'Created Time': ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString() : '',
      'Tracking Token': ticket.tracking_token || ''
    }
  })

  // 3. Generate Headers & Content
  const headers = Object.keys(exportData[0])
  const csvContent = [
    headers.join(','),
    ...exportData.map(row => 
      headers.map(header => {
        const rawValue = row[header];
        // Safely convert to string to prevent .includes() from crashing on numbers/booleans
        let stringValue = rawValue !== null && rawValue !== undefined ? String(rawValue) : '';
        
        // Escape quotes and commas for CSV format
        if (stringValue.includes(',') || stringValue.includes('"')) {
          stringValue = `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n')

  // 4. Download
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `tickets_export_${timestamp}.csv`
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, filename)
}

export const exportToExcel = (tickets, companies, filters = {}) => {
  if (!tickets || tickets.length === 0) {
    alert('No data to export')
    return
  }

  const exportData = tickets.map(ticket => {
    const company = companies.find(c => c.id === ticket.company_id)
    const companyName = company ? company.name : (ticket.companies?.name || 'Unknown')
    const statusText = ticket.status ? ticket.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'
    
    return {
      'Ticket ID': ticket.id,
      'Company': companyName,
      'Contact Name': ticket.contact_name,
      'Contact Email': ticket.contact_email,
      'Contact Phone': ticket.contact_phone,
      'Location': ticket.location,
      'Issue Description': ticket.issue_description,
      'Status': statusText,
      'Created Date': ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : '',
      'Created Time': ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString() : '',
      'Tracking Token': ticket.tracking_token
    }
  })

  // Create workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(exportData)

  // Auto-width columns
  const wscols = Object.keys(exportData[0]).map(key => ({ wch: 20 }));
  ws['!cols'] = wscols;

  XLSX.utils.book_append_sheet(wb, ws, 'Tickets')

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `tickets_export_${timestamp}.xlsx`

  // Download
  XLSX.writeFile(wb, filename)
}
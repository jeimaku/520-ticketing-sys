import React, { useState, useEffect, useRef } from 'react'
import { exportToCSV, exportToExcel } from '../utils/exportUtils'

const ExportControls = ({ tickets, companies, filters }) => {
  const [isExporting, setIsExporting] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const dropdownRef = useRef(null)

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOptions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleExport = async (format) => {
    // Prevent double clicks
    if (isExporting) return

    console.log(`Starting ${format} export...`) // Debug log
    setIsExporting(true)
    
    try {
      // Small delay to show "Exporting..." state
      await new Promise(resolve => setTimeout(resolve, 500))

      if (format === 'csv') {
        exportToCSV(tickets, companies, filters)
      } else if (format === 'excel') {
        exportToExcel(tickets, companies, filters)
      }
      console.log('Export success')
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting data: ' + error.message)
    } finally {
      setIsExporting(false)
      setShowOptions(false)
    }
  }

  return (
    <div className="export-wrapper" ref={dropdownRef} style={{ position: 'relative', zIndex: 50 }}>
      <button
        type="button" // Explicitly set type to prevent form submission issues
        onClick={() => setShowOptions(!showOptions)}
        disabled={isExporting || tickets.length === 0}
        className="btn-outline"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        {isExporting ? (
          <span>Exporting...</span>
        ) : (
          <>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export {tickets.length > 0 ? `(${tickets.length})` : ''}</span>
          </>
        )}
      </button>

      {/* Export Options Dropdown */}
      {showOptions && (
        <div className="export-dropdown">
          <div className="export-header">
            <span className="export-title">SELECT FORMAT</span>
          </div>
          
          <div className="export-options">
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="export-option-btn"
            >
              <div className="option-icon csv">CSV</div>
              <div className="option-details">
                <span className="option-name">CSV File</span>
                <span className="option-desc">Best for raw data analysis</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleExport('excel')}
              className="export-option-btn"
            >
              <div className="option-icon excel">XLS</div>
              <div className="option-details">
                <span className="option-name">Excel File</span>
                <span className="option-desc">Formatted report with summary</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExportControls
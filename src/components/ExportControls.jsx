import React, { useState } from 'react'
import { exportToCSV, exportToExcel } from '../utils/exportUtils'

const ExportControls = ({ tickets, companies, filters }) => {
  const [isExporting, setIsExporting] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const handleExport = async (format) => {
    setIsExporting(true)
    
    try {
      if (format === 'csv') {
        exportToCSV(tickets, companies, filters)
      } else if (format === 'excel') {
        exportToExcel(tickets, companies, filters)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Error exporting data. Please try again.')
    } finally {
      setIsExporting(false)
      setShowOptions(false)
    }
  }

  return (
    <div className="relative">
      {/* Export Button */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isExporting || tickets.length === 0}
        className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg 
          className="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
          />
        </svg>
        <span>
          {isExporting ? 'Exporting...' : `Export ${tickets.length} tickets`}
        </span>
      </button>

      {/* Export Options Dropdown */}
      {showOptions && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Export Options</h3>
            
            {/* CSV Export */}
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 mb-2"
            >
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-green-600">CSV</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">CSV File</div>
                <div className="text-xs text-gray-500">
                  Plain text, opens in Excel/Sheets
                </div>
              </div>
            </button>

            {/* Excel Export */}
            <button
              onClick={() => handleExport('excel')}
              className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg border border-gray-200 mb-3"
            >
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-green-600">XLS</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Excel File</div>
                <div className="text-xs text-gray-500">
                  Formatted spreadsheet with summary
                </div>
              </div>
            </button>

            {/* Export Info */}
            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <div>• Exports current filtered results</div>
                <div>• Includes all ticket details</div>
                <div>• Excel version has summary sheet</div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowOptions(false)}
              className="w-full mt-3 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showOptions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowOptions(false)}
        ></div>
      )}
    </div>
  )
}

export default ExportControls
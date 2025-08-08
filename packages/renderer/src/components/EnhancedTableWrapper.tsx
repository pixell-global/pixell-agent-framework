import React, { useRef } from 'react';

interface EnhancedTableWrapperProps {
  children: React.ReactElement;
  className?: string;
}

export const EnhancedTableWrapper: React.FC<EnhancedTableWrapperProps> = ({
  children,
  className = ''
}) => {
  const tableRef = useRef<HTMLDivElement>(null);

  // Extract table data for CSV download
  const extractTableData = (): { headers: string[], rows: string[][] } => {
    if (!tableRef.current) return { headers: [], rows: [] };

    const table = tableRef.current.querySelector('table');
    if (!table) return { headers: [], rows: [] };

    // Extract headers
    const headerCells = table.querySelectorAll('thead th, thead td');
    const headers = Array.from(headerCells).map(cell => 
      cell.textContent?.trim() || ''
    );

    // Extract rows
    const bodyRows = table.querySelectorAll('tbody tr');
    const rows = Array.from(bodyRows).map(row => {
      const cells = row.querySelectorAll('td, th');
      return Array.from(cells).map(cell => 
        cell.textContent?.trim() || ''
      );
    });

    return { headers, rows };
  };

  // Generate CSV content
  const generateCSV = (headers: string[], rows: string[][]): string => {
    const escapeCSV = (field: string): string => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const csvRows = [];
    
    // Add headers if they exist
    if (headers.length > 0) {
      csvRows.push(headers.map(escapeCSV).join(','));
    }
    
    // Add data rows
    rows.forEach(row => {
      csvRows.push(row.map(escapeCSV).join(','));
    });

    return csvRows.join('\n');
  };

  // Download CSV file
  const downloadCSV = () => {
    const { headers, rows } = extractTableData();
    
    if (rows.length === 0) {
      console.warn('No table data found to download');
      return;
    }

    const csvContent = generateCSV(headers, rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `table-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`enhanced-table-wrapper relative group ${className}`}>
      {/* CSV Download Button */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={downloadCSV}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          title="Download as CSV"
        >
          <svg 
            className="w-3 h-3" 
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
          CSV
        </button>
      </div>

      {/* Enhanced Table Container with Improved Scrolling */}
      <div 
        ref={tableRef}
        className="w-full overflow-x-auto border border-gray-200 rounded-lg shadow-sm enhanced-table-scroll"
        style={{
          maxWidth: '100%',
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 #F1F5F9'
        }}
      >
        <style>{`
          .enhanced-table-scroll::-webkit-scrollbar {
            height: 8px;
          }
          .enhanced-table-scroll::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          .enhanced-table-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          .enhanced-table-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>
        
        {/* Render the table with enhanced container */}
        <div className="min-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}; 
'use client'

import React from 'react'

interface TableData {
  headers?: string[]
  rows: (string | number | boolean | null)[][]
  caption?: string
  className?: string
}

interface TableProps {
  data: TableData
  striped?: boolean
  bordered?: boolean
  hover?: boolean
  compact?: boolean
  className?: string
}

export const A2ATable: React.FC<TableProps> = ({
  data,
  striped = true,
  bordered = true,
  hover = true,
  compact = false,
  className = ''
}) => {
  const { headers, rows, caption } = data

  if (!rows || rows.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 my-4">
        <div className="text-gray-500 text-sm">표시할 데이터가 없습니다</div>
      </div>
    )
  }

  const cellPadding = compact ? 'px-3 py-2' : 'px-6 py-4'
  
  return (
    <div className={`overflow-x-auto my-4 ${className}`}>
      {caption && (
        <div className="text-sm text-gray-600 mb-2 font-medium">{caption}</div>
      )}
      <table className={`min-w-full divide-y divide-gray-200 ${
        bordered ? 'border border-gray-200 rounded-lg' : ''
      }`}>
        {headers && headers.length > 0 && (
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={`${cellPadding} text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`${hover ? 'hover:bg-gray-50' : ''} ${
                striped && rowIndex % 2 === 1 ? 'bg-gray-25' : ''
              }`}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`${cellPadding} whitespace-nowrap text-sm text-gray-900`}
                >
                  {cell !== null && cell !== undefined ? String(cell) : '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// 사용 예시를 위한 샘플 데이터를 포함한 데모 컴포넌트
export const A2ATableDemo: React.FC = () => {
  const sampleData: TableData = {
    headers: ['TITLE', 'CONTENT', 'COMMENT', 'APPROVAL'],
    rows: [
      ['[product question] is it okay to use this daily??', "", 'I do. Either this or the Simple version. I love them.', ""],
      ['[MISC] How do you keep your skincare (spending) addiction in check?', "I have been going overboard with my skincare spending recently and decided to refrain from purchasing anything new this past month unless I'm replacing a finished product.", "", ""],
      ['[product question] is it okay to use this daily??', "", 'I do. Either this or the Simple version. I love them.', ""],
      ['[MISC] How do you keep your skincare (spending) addiction in check?', "I have been going overboard with my skincare spending recently and decided to refrain from purchasing anything new this past month unless I'm replacing a finished product.", "", ""],
    ],
    caption: 'A2A Task'
  }

  return (
    <div className="p-6">
      <A2ATable data={sampleData} compact={true} />
    </div>
  )
}

export default A2ATable

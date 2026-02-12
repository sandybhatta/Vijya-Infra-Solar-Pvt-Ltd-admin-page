import { saveAs } from 'file-saver'

export const exportToCSV = (data, fileName, headers) => {
    if (!data || !data.length) return
    
    // Create header row
    const replacer = (key, value) => value === null ? '' : value
    const headerRow = headers ? headers.map(h => h.label) : Object.keys(data[0])
    const headerKeys = headers ? headers.map(h => h.key) : Object.keys(data[0])
    
    const csv = [
        headerRow.join(','), // header line
        ...data.map(row => headerKeys.map(fieldName => {
            const val = row[fieldName]
            // Escape quotes and wrap in quotes if contains comma
            const stringVal = String(val).replace(/"/g, '""')
            return stringVal.includes(',') ? `"${stringVal}"` : stringVal
        }).join(','))
    ].join('\r\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `${fileName}_${new Date().toISOString().split('T')[0]}.csv`)
}

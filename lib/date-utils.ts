export function formatDOB(dateString: string): string {
  try {
    if (!dateString) return 'Invalid DOB'
    
    // Handle YYYY-MM-DD format from database or HTML5 date input
    const dateOnly = dateString.split('T')[0]
    const [year, month, day] = dateOnly.split('-')
    
    if (!year || !month || !day) {
      return 'Invalid DOB'
    }
    
    // Create date using UTC to avoid timezone issues
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)))
    
    if (isNaN(date.getTime())) {
      return 'Invalid DOB'
    }
    
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } catch (err) {
    return 'Invalid DOB'
  }
}

export function getDOBFromString(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('T')[0].split('-')
    return `${day}${month}${year.slice(-2)}`
  } catch (err) {
    return ''
  }
}

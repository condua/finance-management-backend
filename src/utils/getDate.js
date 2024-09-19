const { startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfQuarter } = require('date-fns')



const getStartDate = (type) => {
  switch (type) {
    case 'day':
      return startOfDay(new Date())
    case 'week':
      return startOfWeek(new Date())
    case 'month':
      return startOfMonth(new Date())
    case 'quarter':
      return startOfQuarter(new Date())
    case 'year':
      return startOfYear(new Date())
    default:
      return startOfDay(new Date())
  }
}

const getEndDate = (type) => {
  switch (type) {
    case 'day':
      return endOfDay(new Date())
    case 'week':
      return endOfWeek(new Date())
    case 'month':
      return endOfMonth(new Date())
    case 'quarter':
      return endOfQuarter(new Date())
    case 'year':
      return endOfWeek(new Date())
    default:
      return endOfDay(new Date())
  }
}

module.exports = {
  getStartDate,
  getEndDate,
}
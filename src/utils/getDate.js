const {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfQuarter,
  startOfYesterday,
  endOfYesterday,
  getMonth,
  getYear,
  setMonth,
  getQuarter,
  setQuarter,
  lastDayOfYear,
  setYear,
  setDayOfYear,
  getWeekOfMonth,
  setWeek,
  setDate,
} = require('date-fns')

const getStartDate = (type) => {
  switch (type) {
    case 'day':
      return startOfDay(new Date())
    case 'week':
      return startOfWeek(new Date(), { weekStartsOn: 1 })
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
      return endOfWeek(new Date(), { weekStartsOn: 1 })
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

const getLastStartDate = (type) => {
  switch (type) {
    case 'day':
      return startOfYesterday(new Date())
    case 'week': {
      const date = new Date(2024, 8, 2)
      const week = getWeekOfMonth(date)
      return startOfWeek(setDate(date, date.getDate() - 7), { weekStartsOn: 1 })
    }
    case 'month': {
      const date = new Date()
      const month = getMonth(date)
      return month === 0
        ? new Date(getYear(date) - 1, 11, 1)
        : startOfMonth(setMonth(date, month - 1))
    }
    case 'quarter': {
      const date = new Date()
      const quarter = getQuarter(date)
      return quarter === 0
        ? new Date(getYear(date) - 1, 9, 1)
        : startOfQuarter(setQuarter(date, quarter - 1))
    }
    case 'year': {
      const date = new Date()
      const year = getYear(date)
      return startOfYear(new Date(setYear(date, year - 1)), 1)
    }
    default:
      return startOfYesterday(new Date())
  }
}

const getLastEndDate = (type) => {
  switch (type) {
    case 'day':
      return endOfYesterday(new Date())
    case 'week': {
      const date = new Date(2024, 8, 2)
      return endOfWeek(setDate(date, date.getDate() - 7), { weekStartsOn: 1 })
    }
    case 'month': {
      const date = new Date()
      const month = getMonth(date)
      return month === 0
        ? new Date(getYear(date) - 1, 11, 31)
        : endOfMonth(setMonth(date, month - 1))
    }
    case 'quarter': {
      const date = new Date()
      const quarter = getQuarter(date)
      return quarter === 0
        ? new Date(getYear(date) - 1, 9, 30)
        : endOfQuarter(setQuarter(date, quarter - 1))
    }
    case 'year': {
      const date = new Date()
      const year = getYear(date)
      return lastDayOfYear(new Date(setYear(date, year - 1)))
    }
    default:
      return endOfYesterday(new Date())
  }
}

module.exports = {
  getStartDate,
  getEndDate,
  getLastStartDate,
  getLastEndDate,
}

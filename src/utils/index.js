'use strict'

const _ = require('lodash')

const getInfoData = ({ object = {}, fields = [] }) => {
  return _.pick(object, fields)
}

const removeUndefineOrNullObject = (obj) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined || obj[key] === null) delete obj[key]
  })
  return obj
}

const removeUndefinedFields = (obj) => {
  let updateObj = {}
  for (let [key, value] of Object.entries(obj)) {
    if (value !== 'undefined') {
      updateObj[key] = value
    }
  }
  return updateObj
}

const updateNestedObjectParser = (obj) => {
  const final = {}
  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      // recursive
      const nested = updateNestedObjectParser(obj[key])
      // a = { b: { c: 1 } } => { 'b.c': 1 }
      Object.keys(nested).forEach((nestedKey) => {
        // a['b.c'] = 1
        final[`${key}.${nestedKey}`] = nested[nestedKey]
      })
    } else {
      final[key] = obj[key]
    }
  })
  return final
}

module.exports = {
  getInfoData,
  removeUndefineOrNullObject,
  updateNestedObjectParser,
  removeUndefinedFields,
}

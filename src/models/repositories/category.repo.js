const { InternalServerError } = require('../../core/error.response')
const  categoryModel= require('../category.model')

const addMultipleCategories = async (categories) => {
  try {
    const result = await categoryModel.insertMany(categories)
    return result
  } catch (error) {
    console.error('🚀 ~ addMultipleCategories ~ error:', error)
    throw new InternalServerError('Cannot create categories')
  }
}

module.exports = {
  addMultipleCategories,
}

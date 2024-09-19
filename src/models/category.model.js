const { model, Schema, Types, default: mongoose } = require('mongoose')

const DOCUMENT_NAME = 'Category'
const COLLECTION_NAME = 'categories'


const subcategorySchema = new Schema(
  {
    icon: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    belong_to: {
      type: Types.ObjectId,
      ref: 'Category',
    },
  },
  {
    timestamps: true,
    collection: 'subcategories',
  }
)

const categorySchema = new Schema(
  {
    icon: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ['income', 'expense'],
      },
      required: true,
    },
  
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

module.exports = {
  categoryModel: model(DOCUMENT_NAME, categorySchema),
  // subCategoryModel: model('SubCategory', subcategorySchema),
}
const { model, Schema, Types } = require('mongoose') // Erase if already required

const DOCUMENT_NAME = 'Transaction'
const COLLECTION_NAME = 'transactions'

// Declare the Schema of the Mongo model
const transactionSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be greater than 0'],
      default: 0,
    },
    title: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 50,
    },
    img_url: {
      type: String,
      maxLength: 255,
    },
    category: {
      type: Types.ObjectId,
      ref: 'Category',
    },
    description: {
      type: String,
      maxLength: 255,
    },
    createdAt: {
      type: Date,
      default: new Date(),
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
      },
      required: true,
    },
  
    // createdBy: {
    //   type: Types.ObjectId,
    //   ref: 'User',
    // },
    // status: {
    //   type: String,
    //   enum: {
    //     values: ['pending', 'completed', 'cancelled'],
    //   },
    //   default: 'pending',
    // },

  },
  {
    timestamps: false,
    collection: COLLECTION_NAME,
  }
)

//Export the model
module.exports = model(DOCUMENT_NAME, transactionSchema)

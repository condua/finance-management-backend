const { model, Schema, Types } = require('mongoose') // Erase if already required

const DOCUMENT_NAME = 'Debt'
const COLLECTION_NAME = 'debts'

// Declare the Schema of the Mongo model
const debtSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be greater than 0'],
      default: 0,
    },
    borrower: {
      type: String,
      required: true,
    },
    lender: {
      type: String,
      required: true,
    },
    records: [
      {
        type: Types.ObjectId,
        ref: 'Transaction',
      },
    ],
    due_date: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      maxLength: 255,
    },
    interest_rate: {
      rate: {
        type: Double,
        required: true,
      },
      period: {
        type: String,
        enum: {
          values: ['daily', 'monthly', 'yearly'],
        },
        required: true,
      },
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed', 'overdue'],
      },
      required: true,
    },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

//Export the model
module.exports = model(DOCUMENT_NAME, debtSchema)

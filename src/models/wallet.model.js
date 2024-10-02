const { model, Schema, Types } = require('mongoose') // Erase if already required

const DOCUMENT_NAME = 'Wallet'
const COLLECTION_NAME = 'wallets'

// Declare the Schema of the Mongo model
const walletSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
    },
    balance: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ['private', 'shared'],
      required: true,
    },
    icon: {
      type: String,
    },
    transactions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
      },
    ],
    financial_plans: [
      {
        type: Schema.Types.ObjectId,
        ref: 'FinancialPlan',
      },
    ],
    debts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Debt',
      },
    ],

  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)



//Export the model
module.exports = model(DOCUMENT_NAME, walletSchema)
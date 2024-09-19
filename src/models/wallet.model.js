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
    image_url: {
      type: String,
      // default: 'https://res.cloudinary.com/dybygufkr/image/upload/v1623925926/avatars/default-avatar.png',
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

    // walletOptions: {
    //   type: Schema.Types.Mixed,
    // },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
)

// const individualWalletSchema = new Schema({
//   transactions : [{
//     type: Schema.Types.ObjectId,
//     ref: 'Transaction'
//   }],
//   goals: [{
//     type: Schema.Types.ObjectId,
//     ref: 'Goal'
//   }],
//   budgets: [{
//     type: Schema.Types.ObjectId,
//     ref: 'Budget'
//   }]
// },{
//   timestamps: true,
//   collection: 'individual'
// })


// const groupWalletSchema = new Schema({
  
//   members: [{
//     user: {
//       type: Schema.Types.ObjectId,
//       ref: 'User'
//     },
//     role: {
//       type: String,
//       enum: ['owner', 'member'],
//       required: true
//     },
//     _id: false
//   }],

// },{
//   timestamps: true,
//   collection: 'group'
// })



//Export the model
module.exports = {
  walletModel: model(DOCUMENT_NAME, walletSchema),
  // individualWalletModel: model('IndividualWallet', individualWalletSchema),
  // groupWalletModel: model('GroupWallet', groupWalletSchema),
}

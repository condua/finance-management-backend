const { model, Schema, Types } = require("mongoose"); // Erase if already required
const mongoose = require("mongoose");
const DOCUMENT_NAME = "Wallet";
const COLLECTION_NAME = "wallets";

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
      enum: ["private", "shared"],
      required: true,
    },
    icon: {
      type: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    transactions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
    financial_plans: [
      {
        type: Schema.Types.ObjectId,
        ref: "FinancialPlan",
      },
    ],
    debts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Debt",
      },
    ],
    transactions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
    ],
    histories: [],
    invitations: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: COLLECTION_NAME,
  }
);

//Export the model
module.exports = model(DOCUMENT_NAME, walletSchema);

// models/Message.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  // receiver: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "User",
  //   required: true,
  // },
  name: { type: mongoose.Schema.Types.String, ref: "User", require: true },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: true,
  },
  content: { type: String },
  video: { type: String },

  images: [{ type: String }], // Thêm mảng chứa URL hoặc đường dẫn của hình ảnh
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", MessageSchema);

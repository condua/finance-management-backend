const { InternalServerError } = require("../../core/error.response")
const transactionModel = require("../transaction.model")
const walletModel = require("../wallet.model")

const deleteAllTransactions = async (walletId) => {
  try {
    const { transactions } = await walletModel.findById(walletId)
    if (transactions.length === 0) {
      return
    }
    return await transactionModel.deleteMany({ _id: { $in: transactions } })

  } catch (error) {
    throw new InternalServerError('Delete all transactions error')
  }
}

const deleteAllTransactionByCategory = async (categoryId) => {
  try {
    const transactions =  await transactionModel.find({ category: categoryId })
    if (transactions.length === 0) {
      return
    }
    const { type } = transactions[0]
    if (type === 'income') {
      await walletModel.updateMany({}, { $inc: { balance: -transactions.reduce((acc, curr) => acc + curr.amount, 0) }, $pull: { transactions: { $in: transactions.map((transaction) => transaction._id) } } })
    } else {
      await walletModel.updateMany({}, { $inc: { balance: transactions.reduce((acc, curr) => acc + curr.amount, 0) }, $pull: { transactions: { $in: transactions.map((transaction) => transaction._id) } } })
    }
    const deletedTransactions = await transactionModel.deleteMany({ category: categoryId })
    return deletedTransactions
  } catch (error) {
    throw new InternalServerError('Delete all transactions by category error')
  }
}

module.exports = {
  deleteAllTransactions,
  deleteAllTransactionByCategory,
}
const transactionModel = require('../models/transaction.model')
const categoryModel = require('../models/category.model')
const { getStartDate, getEndDate, getLastStartDate, getLastEndDate } = require('../utils/getDate')
const UserServices = require('./user.service')
const walletModel = require('../models/wallet.model')
const { BadRequestError, InternalServerError } = require('../core/error.response')
const { planModel, budgetModel } = require('../models/financialPlan.model')
const OCRService = require('./OCR.service')

const {
  updateSpentAmountBudget,
  removeOrAddRecordsBudget,
} = require('../models/repositories/financialPlan.repo')
const { findPlansFilteredByTransaction } = require('../models/repositories/wallet.repo')
const { getInfoData } = require('../utils')

class TransactionService {
  static getAllTransactions = async ({ walletId, options, search }) => {
    const foundWallet = await walletModel.findOne({ _id: walletId })
    if (!foundWallet) {
      throw new BadRequestError({
        data: {
          walletId: 'Wallet not found',
        },
      })
    }
    const createdAt =
      options?.period === 'all'
        ? {
            $gte: new Date(0),
          }
        : options?.period === 'custom'
        ? {
            $gte: !!options.startDate ? getStartDate(options.startDate) : getStartDate('day'),
            $lt: !!options.endDate ? getEndDate(options.endDate) : getEndDate('day'),
          }
        : {
            $gte: !!options.period ? getStartDate(options.period) : undefined,
            $lt: !!options.period ? getEndDate(options.period) : undefined,
          }
    const offset = !!options.offset && { $gt: options.offset }
    const type = options.type !== 'all' ? options.type : { $in: ['income', 'expense'] }
    const limit = options.limit || 0
    const sort = { createdAt: options.sort === 'desc' ? -1 : 1 }
    const category =
      options.category !== 'all' ? { $in: options.category.split(',') } : { $exists: true }
    try {
      const { transactions } = await walletModel.findOne({ _id: walletId }).populate({
        path: 'transactions',
        match: {
          _id: offset,
          createdAt,
          type,
          category,
          title: { $regex: Number.isNaN(Number(search)) ? search: '', $options: 'i' },
        },
        options: {
          limit,
          sort,
        },
        populate: {
          path: 'category',
          select: '_id name icon type',
        },
      })
      return transactions.map((transaction) => {
        return getInfoData({
          object: transaction,
          fields: ['_id', 'amount', 'type', 'category', 'title', 'description', 'createdAt'],
        })
      })
    } catch (error) {
      console.error(error)
      throw new InternalServerError('Get all transactions error')
    }
  }

  static getTransactionById = async ({ walletId, transactionId }) => {
    const wallet = await walletModel.findOne({ _id: walletId })
    if (!wallet || !wallet.transactions.includes(transactionId)) {
      throw new BadRequestError({
        data: {
          transactionId: 'Transaction not found',
        },
      })
    }
    try {
      const transaction = await transactionModel.findOne({ _id: transactionId }).populate({
        path: 'category',
        select: '_id name icon type',
      })
      return getInfoData({
        object: transaction,
        fields: ['_id', 'amount', 'type', 'category', 'title', 'createdAt'],
      })
    } catch (error) {
      console.error(error)

      throw new InternalServerError('Get transaction error')
    }
  }

  static createTransaction = async ({ userId, walletId, transaction }) => {
    const foundWallet = await walletModel.findOne({
      _id: walletId,
    })
    if (!foundWallet) {
      throw new BadRequestError({
        data: {
          walletId: 'Wallet not found',
        },
      })
    }
    // check valid category
    const foundCategory = await categoryModel.findOne({ _id: transaction.category }).lean()

    if (!foundCategory) {
      throw new BadRequestError({
        data: {
          category: 'Category not found',
        },
      })
    }
    /*  for (let i = 0; i < 12; i++) {
        const newTransaction = await transactionModel.create({
          ...transaction,
          title: `${transaction.title} ${i}`,
          category: transaction.category,
          amount: Math.round(Math.random() * 1000) * 1000,
          createdAt: new Date(new Date(transaction.createdAt).getTime() + 60000 *60* i),
        })
        console.error('creating transaction ::' , i)
      await walletModel.findOneAndUpdate(
        { _id: walletId },
        {
          $push: { transactions: newTransaction._id },
          $inc: {
            balance: newTransaction.amount * (newTransaction.type === 'expense' ? -1 : 1),
          },
        },
        { new: true }
      )
     
    }
    return await transactionModel.create({
      ...transaction,
      title: `${transaction.title}`,
      category: transaction.category,
      amount: Math.round(Math.random() * 1000) * 1000,
      createdAt: new Date(new Date(transaction.createdAt).getTime() + 60000  * 50),
    }) */
    // }
    const newTransaction = await transactionModel.create(transaction)

    if (!newTransaction) {
      throw new BadRequestError('Cannot create transaction')
    }
    try {
      // update wallet
      await walletModel.findOneAndUpdate(
        { _id: walletId },
        {
          $push: { transactions: newTransaction._id },
          $inc: {
            balance: newTransaction.amount * (newTransaction.type === 'expense' ? -1 : 1),
          },
        },
        { new: true }
      )

      // update budget if transaction is expense
      if (newTransaction.type === 'expense') {
        const filteredPlans = await findPlansFilteredByTransaction({
          walletId: walletId,
          transaction: newTransaction,
        })
        filteredPlans.forEach(async (plan) => {
          const updatedPlan = await removeOrAddRecordsBudget({
            planId: plan._id,
            transactionId: newTransaction._id,
            amount: newTransaction.amount,
            type: 'add',
          })
        })
      }
      return getInfoData({
        object: newTransaction,
        fields: ['_id', 'amount', 'type', 'category', 'title', 'createdAt'],
      })
    } catch (error) {
      // Rollback
      console.error(error)
      await transactionModel.deleteOne({ _id: newTransaction._id })
      throw new InternalServerError('Cannot create transaction')
    }
  }

  static updateTransaction = async ({ walletId, transactionId, update, userId }) => {
    // validate input fields
    const foundUser = await UserServices.findById(userId)
    if (!foundUser || !foundUser.wallets.includes(walletId)) {
      throw new BadRequestError('Not found wallet or user')
    }
    if (update.category) {
      const foundCategory = await categoryModel.findOne({ _id: update.category._id }).lean()
      if (!foundCategory) {
        throw new BadRequestError({
          data: {
            category: 'Category not found',
          },
        })
      }
    }

    try {
      const filter = { _id: transactionId },
        options = { new: true, insert: true }
      const foundTransaction = await transactionModel.findOne(filter)

      const { amount, type } = foundTransaction

      const updatedTransaction = await transactionModel.findOneAndUpdate(filter, update, options)

      const updateAmount =
        (updatedTransaction.type === 'expense'
          ? -updatedTransaction.amount
          : updatedTransaction.amount) + (foundTransaction.type === 'expense' ? amount : -amount)

      // update wallet
      await walletModel.findOneAndUpdate(
        {
          _id: walletId,
        },
        {
          $inc: { balance: updateAmount },
        }
      )

      const { financial_plans: plans } = await walletModel.findOne({ _id: walletId }).populate({
        path: 'financial_plans',
        match: {
          type: 'budget',
          'attributes.records': foundTransaction._id,
        },
      })
      //category or date is changed
      if (
        ((updatedTransaction.type === 'expense' &&
          updatedTransaction.category !== foundTransaction.category) ||
          updatedTransaction.createdAt !== foundTransaction.createdAt) &&
        plans.length > 0
      ) {
        plans.forEach(async (plan) => {
          const planCategories = plan.attributes.categories.map((category) => category.toString())
          // remove transaction if category is changed and new category is not in plan categories

          if (
            !planCategories.includes(updatedTransaction.category.toString()) || // cast to string for comparison
            updatedTransaction.createdAt < plan.attributes.start_date ||
            updatedTransaction.createdAt > plan.end_date
          ) {
            const updatedPlan = await removeOrAddRecordsBudget({
              planId: plan._id,
              transactionId: updatedTransaction._id,
              amount: updatedTransaction.amount,
              type: 'delete',
            })
          }
          // update amount
          const updatedPlan = await updateSpentAmountBudget({
            planId: plan._id,
            amount: -foundTransaction.amount + updatedTransaction.amount,
          })

          // add transaction if category is changed and new category is in plan categories
        })
      }
      // type changed
      else if (
        (updatedTransaction.type === 'expense' && foundTransaction.type === 'income') ||
        (updatedTransaction.type === 'expense' &&
          foundTransaction.category !== updatedTransaction.category)
      ) {
        const filteredPlans = await findPlansFilteredByTransaction({
          walletId: walletId,
          transaction: updatedTransaction,
        })
        filteredPlans.forEach(async (plan) => {
          const updatedPlan = await removeOrAddRecordsBudget({
            planId: plan._id,
            transactionId: updatedTransaction._id,
            amount: updatedTransaction.amount,
            type: 'add',
          })
        })
      }

      return getInfoData({
        object: updatedTransaction,
        fields: ['_id', 'amount', 'type', 'category', 'title', 'createdAt'],
      })
    } catch (error) {
      console.error(error)
      throw new InternalServerError('Update transaction error')
    }
  }

  static deleteTransactionById = async ({ userId, walletId, transactionId }) => {
    const foundUser = await UserServices.findById(userId)
    if (!foundUser || !foundUser.wallets.includes(walletId)) {
      throw new BadRequestError('Not found wallet or user')
    }
    const wallet = await walletModel.findOne({ _id: walletId })
    if (!wallet || !wallet.transactions.includes(transactionId)) {
      throw new BadRequestError('Not found transaction')
    }
    try {
      const foundTransaction = await transactionModel.findOne({
        _id: transactionId,
      })
      const newAmount =
        foundTransaction.type === 'expense' ? foundTransaction.amount : -foundTransaction.amount

      // delete transaction
      const deletedTransaction = await transactionModel.deleteOne({
        _id: transactionId,
      })

      // update wallet
      await walletModel.findOneAndUpdate(
        {
          _id: walletId,
        },
        {
          $pull: { transactions: transactionId },
          $inc: { balance: newAmount },
        }
      )

      // update budget if transaction is expense
      if (foundTransaction.type === 'expense') {
        const { financial_plans: plans } = await walletModel.findOne({ _id: walletId }).populate({
          path: 'financial_plans',
          match: {
            type: 'budget',
            'attributes.records': foundTransaction._id,
          },
        })
        plans.forEach(async (plan) => {
          await budgetModel.findByIdAndUpdate(plan._id, {
            $pull: { records: foundTransaction._id },
            $inc: { spent_amount: -foundTransaction.amount },
          })
          await planModel.findByIdAndUpdate(plan._id, {
            $pull: { 'attributes.records': foundTransaction._id },
            $inc: { 'attributes.spent_amount': -foundTransaction.amount },
          })
        })
      }
      return deletedTransaction
    } catch (error) {
      console.error(error)
      throw new InternalServerError('Delete transaction error')
    }
  }
  /// delete all transaction when wallet is deleted -> dont need update budget ?
  static deleteAllTransactions = async (transactionIds) => {
    try {
      const deletedTransactions = await transactionModel.deleteMany({
        _id: { $in: transactionIds },
      })
      return deletedTransactions
    } catch (error) {
      console.error(error)
      throw new InternalServerError('Delete all transactions error')
    }
  }

  static scanReceiptImage = async ({ userId, file }) => {
    const foundUser = await UserServices.findById(userId)
    if (!foundUser) {
      throw new BadRequestError('Invalid user')
    }
    try {
      const result = await OCRService.processImage(file)
      return result
    } catch (error) {
      console.error(error)
      throw new InternalServerError('Scan receipt image error')
    }
  }
}

module.exports = TransactionService

'use strict'
const  walletModel = require('../models/wallet.model')
const UserServices = require('./user.service')
const { BadRequestError, InternalServerError } = require('../core/error.response')
const userModel = require('../models/user.model')
const transactionModel = require('../models/transaction.model')
const TransactionService = require('./transaction.service')
const { getInfoData } = require('../utils')
const { deleteAllPlans } = require('../models/repositories/financialPlan.repo')
const { deleteAllTransactions } = require('../models/repositories/transaction.repo')
const { removeWalletById } = require('../models/repositories/wallet.repo')

const getAllWallets = async (userId) => {
  const foundUser = await UserServices.findById(userId)
  if (!foundUser) {
    throw new BadRequestError({
      data: {
        userId: 'User not found',
      },
    })
  }
  const foundWallets = await walletModel.find({ _id: { $in: foundUser.wallets } })
  return foundWallets.map((wallet) =>
    getInfoData({
      object: wallet,
      fields: ['_id', 'name', 'icon', 'balance', 'type', 'transactions', 'financial_plans', 'debts'],
    })
  )
}

const createWallet = async ({ userId, wallet }) => {
  const foundUser = await userModel.findOne({ _id: userId }).lean()
  if (foundUser.wallets.length >= 5) {
    throw new InternalServerError('Cannot create more than 5 wallets')
  }
  const { wallets } = await userModel.findOne({ _id: userId }).populate({
    path: 'wallets',
    match: { name: wallet.name },
  })
  if (wallets.length !== 0) {
    throw new BadRequestError({
      data: {
        name: 'Wallet name already exists',
      },
    })
  }

  const newWallet = await walletModel.create(wallet)
  if (!newWallet) {
    throw new InternalServerError('Cannot create wallet')
  }
  try {
    await UserServices.addWalletById(userId, newWallet._id)
    return getInfoData({
      object: newWallet,
      fields: ['_id', 'icon', 'name', 'balance', 'type', 'transactions', 'financial_plans', 'debts'],
    })
  } catch (error) {
    console.error(error)
    await walletModel.deleteOne({ _id: newWallet._id })
    throw new InternalServerError('Cannot create wallet')
  }
}

const findById = async (walletId) => {
  const foundWallet = await walletModel.findById(walletId)
  if (!foundWallet) {
    throw new BadRequestError({ data: { walletId: 'Wallet not found' } })
  }
  return getInfoData({
    object: foundWallet,
    fields: ['_id', 'name', 'balance', 'type', 'transactions', 'financial_plans', 'debts'],
  })
}

const getWalletById = async (userId, walletId) => {
  const foundUser = await UserServices.findById(userId)
  if (!foundUser) {
    throw new BadRequestError({
      data: {
        userId: 'User not found',
      },
    })
  }
  const foundWallet = await walletModel.findById(walletId)
  if (!foundWallet) {
    throw new BadRequestError({
      data: {
        walletId: 'Wallet not found',
      },
    })
  }
  try {
    return getInfoData({
      object: foundWallet,
      fields: ['_id', 'name', 'balance', 'type', 'transactions', 'financial_plans', 'debts'],
    })
  } catch (error) {
    console.error('🚀 ~ getWalletById ~ error:', error)
    throw new InternalServerError('Cannot get wallet')
  }
}

const deleteById = async ({ userId, walletId }) => {
  const foundUser = await UserServices.findById(userId)
  if (!foundUser) {
    throw new BadRequestError('Invalid user')
  }
  if (!foundUser.wallets.includes(walletId)) {
    throw new BadRequestError({
      data: {
        walletId: 'Wallet not found',
      },
    })
  }
  try {
    const wallet = await walletModel.findById(walletId).lean()
    await deleteAllTransactions(walletId)
    await deleteAllPlans(walletId)
    await removeWalletById(userId, walletId)
    return await walletModel.deleteOne({ _id: walletId })
  } catch (error) {
    console.error(error)
    throw new InternalServerError('Cannot delete wallet')
  }
}

const updateWallet = async ({ userId, walletId, wallet }) => {
  const foundUser = await userModel.findOne({ _id: userId })
  if (!foundUser) {
    throw new BadRequestError({
      data: {
        userId: 'User not found',
      },
    })
  }
  if (!foundUser.wallets.includes(walletId)) {
    throw new BadRequestError({
      data: {
        walletId: 'Wallet not found',
      },
    })
  }
  const {wallets} = await userModel.findOne({ _id: userId}).populate({
    path: 'wallets',
    match: {
      name: wallet.name
    }})
  if (wallets.length !== 0 && wallets[0]._id !== walletId) {
    throw new BadRequestError({
      data: {
        name: 'Wallet name already exists',
      },
    })
  }
  try {
    const updateWallet = {
      name: wallet?.name,
      icon: wallet?.icon,
    }
    const updatedWallet = await walletModel.findOneAndUpdate({ _id: walletId }, updateWallet, {
      new: true,
    })
    return getInfoData({
      object: updatedWallet,
      fields: ['_id', 'name', 'icon', 'balance', 'type', 'transactions', 'financial_plans', 'debts'],
    })
  } catch (error) {
    throw new InternalServerError('Cannot update wallet')
  }
}

module.exports = {
  getAllWallets,
  createWallet,
  findById,
  getWalletById,
  deleteById,
  updateWallet,
}

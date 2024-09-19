const mongoose = require('mongoose')
const { budgetModel, goalModel, planModel } = require('../financialPlan.model')
const { walletModel } = require('../wallet.model')
const { InternalServerError, BadRequestError } = require('../../core/error.response')
const { updateNestedObjectParser, getInfoData } = require('../../utils')
const { Types } = require('mongoose')
const { getInfo } = require('../../controllers/user.controller')

const updateFinancialPlanById = async (planId, planBody, type) => {
  return await planModel.findByIdAndUpdate(planId, planBody, { new: true })
}

const removeOrAddRecordsBudget = async ({ planId, transactionId, amount, type = 'delete' }) => {
  try {
    if (type === 'delete') {
      await budgetModel.findByIdAndUpdate(planId, {
        $pull: { records: transactionId },
        $inc: { spent_amount: -amount },
      })
      return (updatedPlan = await planModel.findByIdAndUpdate(
        planId,
        {
          $pull: { 'attributes.records': transactionId },
          $inc: { 'attributes.spent_amount': -amount },
        },
        { new: true }
      ))
    } else {
      await budgetModel.findByIdAndUpdate(planId, {
        $push: { records: transactionId },
        $inc: { spent_amount: amount },
      })
      return (updatedPlan = await planModel.findByIdAndUpdate(
        planId,
        {
          $push: { 'attributes.records': transactionId },
          $inc: { 'attributes.spent_amount': amount },
        },
        { new: true }
      ))
    }
  } catch (error) {
    console.log(error)
    throw new InternalServerError('Update financial plan error')
  }
}

const updateSpentAmountBudget = async ({ planId, amount }) => {
  try {
    await budgetModel.findByIdAndUpdate(
      planId,
      {
        $inc: { spent_amount: amount },
      },
      { new: true }
    )
    return await planModel.findByIdAndUpdate(
      planId,
      {
        $inc: { 'attributes.spent_amount': amount },
      },
      { new: true }
    )
  } catch (error) {}
}

const getDetailsPlanById = async (planId) => {
  try {
    const plan = await planModel.findOne({ _id: planId }).lean()
    const attributes = await budgetModel
      .findOne({ _id: planId })
      .populate({
        path: 'records',
        populate: {
          path: 'category',
        },
      })
      .populate({
        path: 'categories',
        model: 'Category',
      })
      .lean()
    return { ...plan, attributes: { ...attributes } }
  } catch (error) {
    console.log(error)
    throw new InternalServerError('Get plan error')
  }
}

const addAmountToGoal = async ({ planId, record }) => {
  const foundGoal = await goalModel.findOne({ _id: planId })
  if (!foundGoal) {
    throw new BadRequestError('Invalid Goal')
  }
  if (record.amount < 0) {
    throw new BadRequestError('Invalid record amount')
  }
  try {
    const updatedGoal = await goalModel.findOneAndUpdate(
      { _id: planId },
      {
        $push: {
          records: {
            ...record,
            _id: new mongoose.Types.ObjectId(),
          },
        },
        $inc: { current_amount: record.amount },
      },
      { new: true }
    )
    const updatedPlan = await planModel.findOneAndUpdate(
      {
        _id: updatedGoal._id,
      },
      {
        $push: {
          'attributes.records': {
            ...updatedGoal.records[updatedGoal.records.length - 1],
          },
        },
        $inc: { 'attributes.current_amount': record.amount },
      }
    )

    if (!updatedGoal) {
      throw new BadRequestError('Add record to Goal error')
    }
    if (!updatedPlan) {
      throw new BadRequestError('Add record to Plan error')
    }
    return updatedGoal
  } catch (error) {
    console.log('🚀 ~ addAmountToGoal ~ error:', error)
    throw new InternalServerError('Add record to Goal error')
  }
}

const deleteRecordFromGoal = async ({ planId, recordId }) => {
  const foundGoal = await goalModel.findOne({ _id: planId }).lean()
  if (!foundGoal) {
    throw new BadRequestError('Invalid Goal')
  }
  try {
    const updatedRecordsList = foundGoal.records.filter(
      (record) => record._id.toString() !== recordId.toString()
    )
    const { records } = await goalModel
      .findOne({ _id: planId, 'records._id': recordId }, { 'records.$': 1 })
      .lean()
    const deletedRecord = await goalModel.findOneAndUpdate(
      { _id: planId },
      {
        $set: { records: updatedRecordsList },
        $inc: { current_amount: -records[0].amount },
      },
      { new: true }
    )
    const updatedPlan = await planModel.findOneAndUpdate(
      {
        _id: planId,
      },
      {
        $set: { 'attributes.records': updatedRecordsList },
        $inc: { 'attributes.current_amount': -records[0].amount },
      },
      {
        new: true,
      }
    )
    if (!deletedRecord) {
      throw new BadRequestError('Delete record from Goal error')
    }
    if (!updatedPlan) {
      throw new BadRequestError('Delete record from Plan error')
    }
    return updatedPlan
  } catch (error) {
    console.log(error)
    throw new InternalServerError('Delete record from Goal error')
  }
}

const updateRecordInGoal = async ({ planId, recordId, record }) => {
  const foundGoal = await goalModel.findOne({ _id: planId }).lean()
  if (!foundGoal) {
    throw new InternalServerError('Goal Not Found')
  }
  try {
    const { records } = await goalModel
      .findOne({
        _id: planId,
        // 'records._id': { $in: recordId },
      })
      .lean()
    const foundRecord = records.find((record) => record._id.toString() === recordId.toString())
    const oldAmount = record.amount - foundRecord.amount
    const updatedRecords = records.map((rc) => {
      if (rc._id.toString() === recordId.toString()) {
        return {
          ...rc,
          amount: record.amount,
        }
      }
      return rc
    })

    await goalModel.updateOne(
      { _id: planId },
      {
        $set: { records: updatedRecords },
        $inc: { current_amount: oldAmount },
      },
      { new: true }
    )

    await planModel.updateOne(
      { _id: planId },
      {
        $set: { 'attributes.records': updatedRecords },
        $inc: { 'attributes.current_amount': oldAmount },
      }
    )
    const updated = await planModel.findOne({ _id: planId }).lean()
    return getInfoData({
      object: updated,
      fields: ['_id', 'name', 'type', 'end_date', 'attributes'],
    })
  } catch (error) {
    console.log(error)
    throw new InternalServerError('Update record in Goal error')
  }
}

const deleteAllPlans = async (walletId) => {
  try {
    const foundWallet = await walletModel.findById(walletId)
    if (!foundWallet) {
      throw new BadRequestError({
        data: {
          walletId: 'Wallet not found',
        },
      })
    }
    const { financial_plans: plans } = foundWallet
    await planModel.deleteMany({ _id: { $in: plans } })
    await budgetModel.deleteMany({ _id: { $in: plans } })
    await goalModel.deleteMany({ _id: { $in: plans } })
  } catch (error) {
    console.log('🚀 ~ deleteAllPlans ~ error:', error)
    throw new InternalServerError('Delete all plans error')
  }
}

const updatePlansHaveCateogry = async (categoryId) => {
  try {
    const plans = await planModel.find({ 'attributes.categories': categoryId })
    console.log(plans)
  } catch (error) {
    console.log(error)
  }
}

const updateBudgetWhenCategoryDeleted = async (categoryId) => {
  try {
    await budgetModel.updateMany({ categories: categoryId }, { $pull: { categories: categoryId } })
    await planModel.updateMany(
      { 'attributes.categories': Types.ObjectId.createFromHexString(categoryId) },
      { $pull: { 'attributes.categories': Types.ObjectId.createFromHexString(categoryId) } }
    )
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  updateFinancialPlanById,
  removeOrAddRecordsBudget,
  updateSpentAmountBudget,
  getDetailsPlanById,
  addAmountToGoal,
  deleteRecordFromGoal,
  updateRecordInGoal,
  deleteAllPlans,
  updatePlansHaveCateogry,
  updateBudgetWhenCategoryDeleted,
}

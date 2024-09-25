const { planModel, budgetModel, goalModel } = require('../models/financialPlan.model')
const { BadRequestError, InternalServerError } = require('../core/error.response')
const { startSession } = require('mongoose')
const { subCategoryModel, categoryModel } = require('../models/category.model')
const { walletModel } = require('../models/wallet.model')
const { getInfoData, updateNestedObjectParser, removeUndefineOrNullObject } = require('../utils')
const {
  updateFinancialPlanById,
  getDetailsPlanById,
  addAmounToGoal,
  deleteRecordFromGoal,
  addAmountToGoal,
  updateRecordInGoal,
} = require('../models/repositories/financialPlan.repo')

const PLAN_FIELDS = ['_id', 'name', 'description', 'type', 'attributes', 'end_date']

class FinancialPlanFactory {
  static financialPlanRegistry = {} // key-class

  static registerFinancialPlanType(type, classRef) {
    FinancialPlanFactory.financialPlanRegistry[type] = classRef
  }

  static async createFinancialPlan({ type, payload, walletId }) {
    const planClass = FinancialPlanFactory.financialPlanRegistry[type]
    if (!planClass) {
      throw new BadRequestError(`Invalid Plan Type  ${type}`)
    }
    return new planClass(walletId, payload).createFinancialPlan()
  }

  static async updateFinancialPlan({ type, bodyUpdate, walletId, planId }) {
    const planClass = FinancialPlanFactory.financialPlanRegistry[type]
    if (!planClass) {
      throw new BadRequestError(`Invalid Plan Type  ${type}`)
    }
    return new planClass(walletId, { ...bodyUpdate, type }).updateFinancialPlan(planId)
  }

  static async deleteFinancialPlan({ walletId, planId, type }) {
    const planClass = FinancialPlanFactory.financialPlanRegistry[type]
    if (!planClass) {
      throw new BadRequestError(`Invalid Plan Type  ${type}`)
    }
    return planClass.deleteFinancialPlan(walletId, planId)
  }

  static async getFinancialPlanById({ walletId, planId }) {
    return await FinancialPlan.getFinancialPlanById(walletId, planId)
  }

  static async getAllFinancialPlans({ walletId, filter, type }) {
    return await FinancialPlan.getAllFinancialPlans({ walletId, type, filter })
  }
  static async addRecordToGoal({ walletId, planId, record }) {
    const foundWallet = await walletModel.findOne({ _id: walletId })

    if (!foundWallet || !foundWallet.financial_plans.includes(planId)) {
      throw new BadRequestError('Invalid wallet')
    }
    return await addAmountToGoal({ planId, record })
  }

  static async deleteRecordById({ walletId, planId, recordId }) {
    const foundWallet = await walletModel.findOne({ _id: walletId })
    if (!foundWallet || !foundWallet.financial_plans.includes(planId)) {
      throw new BadRequestError('Invalid wallet')
    }
    return await deleteRecordFromGoal({ planId, recordId })
  }

  static async updateRecordById({ walletId, planId, recordId, record }) {
    return await updateRecordInGoal({ planId, recordId, record })
  }
}

class FinancialPlan {
  constructor(walletId, { name, description, type, attributes = [], end_date }) {
    this.name = name
    this.description = description
    this.type = type
    this.end_date = end_date
    this.attributes = attributes
    this.walletId = walletId
  }

  async createFinancialPlan({ _id, attributes }) {
    try {
      const newPlan = await planModel.create({ ...this, _id, attributes })
      await walletModel.findOneAndUpdate(
        { _id: this.walletId },
        { $push: { financial_plans: newPlan._id } }
      )
      return getInfoData({
        object: newPlan,
        fields: PLAN_FIELDS,
      })
    } catch (error) {
      console.error(error)
      throw new InternalServerError('Create Plan error')
    }
  }

  async updateFinancialPlan({ _id, attributes }) {
    try {
      const updated = await updateFinancialPlanById(
        _id,
        updateNestedObjectParser(removeUndefineOrNullObject({ ...this, attributes })),
        this.type
      )
      return getInfoData({
        object: updated,
        fields: PLAN_FIELDS,
      })
    } catch (error) {
      throw new InternalServerError('Update Plan error')
    }
  }

  static async deleteFinancialPlan(walletId, planId) {
    try {
      await walletModel.findOneAndUpdate({ _id: walletId }, { $pull: { financial_plans: planId } })
      return await planModel.deleteOne({ _id: planId })
    } catch (error) {
      console.error(error)
      throw new InternalServerError('Delete Plan error')
    }
  }

  static async getFinancialPlanById(walletId, planId) {
    const foundWallet = await walletModel.findOne({ _id: walletId })
    if (!foundWallet) {
      throw new BadRequestError({
        data: {
          walletId: 'Wallet not found',
        },
      })
    }
    if (!foundWallet.financial_plans.includes(planId)) {
      throw new BadRequestError({
        data: {
          walletId: 'Plan not found',
        },
      })
    }
    try {
      const plan = await getDetailsPlanById(planId) // get plan by id
      return getInfoData({
        object: plan,
        fields: PLAN_FIELDS,
      })
    } catch (error) {
      console.error(error)
      throw new InternalServerError('Get Plan error')
    }
  }

  static async getAllFinancialPlans({ walletId, type, filter }) {
    const foundWallet = await walletModel.findById(walletId)
    if (!foundWallet) {
      throw new BadRequestError({
        data: {
          walletId: 'Wallet not found',
        },
      })
    }

    try {
      const { financial_plans } = await walletModel
        .findOne({ _id: walletId })
        .populate({
          path: 'financial_plans',
          match: {
            type: type,
          },
        })
        .lean()
      if (type === 'goal') return financial_plans
      const ids = financial_plans.map((plan) => plan._id)
      const budgets = await budgetModel
        .find({ _id: { $in: ids } })
        .populate({
          path: 'categories',
          model: 'Category',
        })
        .populate({
          path: 'records',
          model: 'Transaction',
        })

      const detailsPlan = financial_plans.map((plan, index) => {
        return {
          ...plan,
          attributes: getInfoData({
            object: budgets[index],
            fields: ['target_amount', 'spent_amount', 'start_date', 'categories', 'records'],
          }),
        }
      })
      return detailsPlan
    } catch (error) {
      console.error('🚀 ~ FinancialPlan ~ getAllFinancialPlans ~ error:', error)
      throw new InternalServerError('Get Plans error')
    }
  }
}

// define sub-class for budget

class Budget extends FinancialPlan {
  async createFinancialPlan() {
    try {
      const { categories, start_date } = this.attributes
      let records = []
      let spentAmount = 0
      // filter records by categories
      for (const category of categories) {
        const { transactions } = await walletModel.findOne({ _id: this.walletId }).populate({
          path: 'transactions',
          match: {
            category: category, // id of subcategory
            createdAt: {
              $gte: start_date,
              $lt: this.end_date,
            },
          },
        })

        // compute spent amount from records filtered by categories, start_date, due_date
        transactions.forEach((transaction) => records.push(transaction._id))
        spentAmount += transactions.reduce((pre, cur) => pre + cur.amount, 0)
      }

      // create new budget with spent amount and records
      const newBudget = await budgetModel.create({
        ...this.attributes,
        records,
        spent_amount: spentAmount,
      })

      if (!newBudget) {
        throw new InternalServerError('Create new Budget error')
      }

      const newPlan = await super.createFinancialPlan({
        _id: newBudget._id,
        attributes: getInfoData({
          object: newBudget,
          fields: ['target_amount', 'spent_amount', 'start_date', 'categories', 'records'],
        }),
      })

      return newPlan
    } catch (error) {
      console.error(error)
      throw new InternalServerError('Create new Budget error')
    }
  }

  async updateFinancialPlan(planId) {
    const foundPlan = await planModel.findOne({ _id: planId })
    if (!foundPlan) {
      throw new BadRequestError('Invalid Plan')
    }
    const categories = this.attributes?.categories || foundPlan.attributes.categories // if categories is not updated, use the old one
    const start_date = this.attributes?.start_date || foundPlan.attributes.start_date // if start_date is not updated, use the old one
    const end_date = this.end_date || foundPlan.end_date // if due_date is not updated, use the old one

    try {
      let records = []
      let spentAmount = 0
      // filter records by categories
      for (const category of categories) {
        const { transactions } = await walletModel.findOne({ _id: this.walletId }).populate({
          path: 'transactions',
          match: {
            category: category, // id of subcategory
            createdAt: {
              $gte: start_date,
              $lt: end_date,
            },
          },
        })

        // compute spent amount from records filtered by categories, start_date, due_date
        transactions.forEach((transaction) => records.push(transaction._id))
        spentAmount += transactions.reduce((pre, cur) => pre + cur.amount, 0)
      }

      // create new budget with spent amount and records
      const updatedBudget = await budgetModel.findOneAndUpdate(
        { _id: planId },
        {
          ...this.attributes,
          records,
          spent_amount: spentAmount,
        },
        { new: true }
      )

      if (!updatedBudget) {
        throw new InternalServerError('Update Budget error')
      }

      // create new plan with budget attributes
      const updatedPlan = await super.updateFinancialPlan({
        _id: updatedBudget._id,
        attributes: getInfoData({
          object: updatedBudget,
          fields: ['target_amount', 'spent_amount', 'start_date', 'categories', 'records'],
        }),
      })

      // when create new plan failed, we should delete the created budget?
      if (!updatedPlan) {
        throw new BadRequestError('Create new Plan error')
      }
      return updatedPlan
    } catch (error) {
      console.error(error)
      throw new InternalServerError('Create new Budget error')
    }
  }

  static async deleteFinancialPlan(walletId, planId) {
    try {
      const deletedBudget = await budgetModel.deleteOne({ _id: planId })
      if (!deletedBudget) {
        throw new InternalServerError('Delete Budget error')
      }
      const deletedPlan = await super.deleteFinancialPlan(walletId, planId)
      return deletedPlan
    } catch (error) {
      console.error(error)
      throw new InternalServerError('Delete Budget error 2')
    }
  }
}
/* 
  1. category + start_date + due_date -> records -> spent amount
  2. target amount
*/

// define sub-class for goal
class Goal extends FinancialPlan {
  async createFinancialPlan() {
    try {
      const newGoal = await goalModel.create({
        ...this.attributes,
        records: [],
      })
      if (!newGoal) {
        throw new BadRequestError('Create new Goal error')
      }

      const newPlan = await super.createFinancialPlan({
        _id: newGoal._id,
        attributes: getInfoData({
          object: newGoal,
          fields: ['target_amount', 'current_amount', 'records'],
        }),
      })
      if (!newPlan) {
        throw new BadRequestError('Create new Plan error')
      }
      return newPlan
    } catch (error) {
      throw new InternalServerError('Create new Goal error')
    }
  }

  async updateFinancialPlan(planId) {
    const foundPlan = await planModel.findOne({ _id: planId })
    if (!foundPlan) {
      throw new BadRequestError('Invalid Plan')
    }
    try {
      const { target_amount } = this.attributes
      const updatedGoal = await goalModel.findOneAndUpdate(
        { _id: planId },
        { target_amount },
        { new: true }
      )
      if (!updatedGoal) {
        throw new BadRequestError('Update Goal error')
      }
      const updatedPlan = await super.updateFinancialPlan({
        _id: planId,
        attributes: getInfoData({
          object: updatedGoal,
          fields: ['target_amount'],
        }),
      })
      if (!updatedPlan) {
        throw new BadRequestError('Update Plan error')
      }
      return updatedPlan
    } catch (error) {
      console.error('🚀 ~ Goal ~ updateFinancialPlan ~ error:', error)
      throw new InternalServerError('Update Goal error')
    }
  }

  static async deleteFinancialPlan(walletId, planId) {
    try {
      const deletedGoal = await goalModel.deleteOne({ _id: planId })
      if (!deletedGoal) {
        throw new InternalServerError('Delete Goal error')
      }
      const deletedPlan = await super.deleteFinancialPlan(walletId, planId)
      return deletedPlan
    } catch (error) {
      console.error(error)
      throw new InternalServerError('Delete Goal error 2')
    }
  }
}

// register financial plan type
FinancialPlanFactory.registerFinancialPlanType('budget', Budget)
FinancialPlanFactory.registerFinancialPlanType('goal', Goal)

module.exports = FinancialPlanFactory

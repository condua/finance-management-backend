const User = require('../src/models/user.model')
const KeyToken = require('../src/models/keyToken.model')
const Wallet = require('../src/models/wallet.model')
const Transaction = require('../src/models/transaction.model')
const Category = require('../src/models/category.model')
const {
  budgetModel: Budget,
  goalModel: Goal,
  planModel: Plan,
} = require('../src/models/financialPlan.model')

before(async function () {
  await User.deleteMany({})
  await KeyToken.deleteMany({})
  await Wallet.deleteMany({})
  await Transaction.deleteMany({})
  await Category.deleteMany({})
  await Budget.deleteMany({})
  await Goal.deleteMany({})
  await Plan.deleteMany({})
})


after(async function () {
  await User.deleteMany({})
  await KeyToken.deleteMany({})
  await Wallet.deleteMany({})
  await Transaction.deleteMany({})
  await Category.deleteMany({})
  await Budget.deleteMany({})
  await Goal.deleteMany({})
  await Plan.deleteMany({})
})

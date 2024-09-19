'use strict'

const express = require('express')
const financialPlanController = require('../../controllers/financialPlan.controller')
const { asyncHandler } = require('../../helpers/asyncHandler')
const { authentication } = require('../../auth/authUtils')
const router = express.Router()

// authentication
router.use(authentication)

router.get('/:walletId', asyncHandler(financialPlanController.getAllFinancialPlans))
router.get('/:walletId/:planId', asyncHandler(financialPlanController.getFinancialPlanById))
router.post('/:walletId', asyncHandler(financialPlanController.createFinancialPlan))
router.patch('/:walletId/:planId', asyncHandler(financialPlanController.updateFinancialPlan))
router.post('/:walletId/:planId/records', asyncHandler(financialPlanController.addRecordToFinancialPlan))
router.patch(
  '/:walletId/:planId/records/:recordId',
  asyncHandler(financialPlanController.updateRecordById)
)
router.delete(
  '/:walletId/:planId/records/:recordId',
  asyncHandler(financialPlanController.deleteRecordById)
)

router.delete('/:walletId/:planId', asyncHandler(financialPlanController.deleteFinancialPlan))

module.exports = router

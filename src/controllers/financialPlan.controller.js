const { SuccessResponse, CREATED } = require('../core/success.response');
const FinancialPlanService = require('../services/financialPlan.service');


class FinancialPlanController {
  createFinancialPlan = async (req, res, next) => {
    console.log(req.body)
    new CREATED({
      message: 'Create financial plan success!',
      metadata: await FinancialPlanService.createFinancialPlan({
        type: req.body.type,
        walletId: req.params.walletId,
        payload: req.body,
      }),
    }).send(res)
  }

  updateFinancialPlan = async (req, res, next) => {
    new SuccessResponse({
      message: 'Update financial plan success!',
      metadata: await FinancialPlanService.updateFinancialPlan({
        type: req.query.type,
        walletId: req.params.walletId,
        planId: req.params.planId,
        bodyUpdate: req.body,
      }),
    }).send(res)
  }

  deleteFinancialPlan = async (req, res, next) => {
    new SuccessResponse({
      message: 'Delete financial plan success!',
      metadata: await FinancialPlanService.deleteFinancialPlan({
        walletId: req.params.walletId,
        type: req.query.type,
        planId: req.params.planId,
      }),
    }).send(res)
  }

  getFinancialPlanById = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get specific plan success!',
      metadata: await FinancialPlanService.getFinancialPlanById({
        walletId: req.params.walletId,
        planId: req.params.planId,
      }),
    }).send(res)
  }

  getAllFinancialPlans = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get all financial plans success!',
      metadata: await FinancialPlanService.getAllFinancialPlans({
        type: req.query.type,
        filter: req.query.filter,
        walletId: req.params.walletId,
      }),
    }).send(res)
  }

  addRecordToFinancialPlan = async (req, res, next) => {
    new SuccessResponse({
      message: 'Add record to financial plan success!',
      metadata: await FinancialPlanService.addRecordToGoal({
        walletId: req.params.walletId,
        planId: req.params.planId,
        record: req.body,
      }),
    }).send(res)
  }

  updateRecordById = async (req, res, next) => {
    new SuccessResponse({
      message: 'Update record by id success!',
      metadata: await FinancialPlanService.updateRecordById({
        walletId: req.params.walletId,
        planId: req.params.planId,
        recordId: req.params.recordId,
        record: req.body,
      }),
    }).send(res)
  }

  deleteRecordById = async (req, res, next) => {
    new SuccessResponse({
      message: 'Delete record by id success!',
      metadata: await FinancialPlanService.deleteRecordById({
        walletId: req.params.walletId,
        planId: req.params.planId,
        recordId: req.params.recordId,
      }),
    }).send(res)
  }
  

}

module.exports = new FinancialPlanController();
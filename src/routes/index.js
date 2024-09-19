'use strict'

const express = require('express')
const { apiKey, permission } = require('../auth/checkAuth')
const router = express.Router()


// check apiKey
// router.use(apiKey)

// check permission
// router.use(permission('0000'))

router.use('/v1/api', require('./access'))
router.use('/v1/api/users', require('./user'))
router.use('/v1/api/wallets', require('./wallet'))
router.use('/v1/api/categories', require('./category'))
router.use('/v1/api/transactions', require('./transaction'))
router.use('/v1/api/financialPlans', require('./financialPlan'))
module.exports = router
'use strict'

const express = require('express')
const accessController = require('../../controllers/access.controller')
const { asyncHandler } = require('../../helpers/asyncHandler')
const { authentication } = require('../../auth/authUtils')
const router = express.Router()

// signUp
router.post('/auth/signup', asyncHandler(accessController.signUp))
router.post('/auth/login', asyncHandler(accessController.login))


// authentication
router.use(authentication)

// logout
router.post('/auth/changePassword', asyncHandler(accessController.changePassword))
router.post('/auth/logout', asyncHandler(accessController.logout))
router.post('/auth/handlerRefreshToken', asyncHandler(accessController.handlerRefreshToken))



module.exports = router
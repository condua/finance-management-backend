'use strict'

const express = require('express')
const userController = require('../../controllers/user.controller')
const { asyncHandler } = require('../../helpers/asyncHandler')
const { authentication } = require('../../auth/authUtils')
const uploadDisk = require('../../configs/multer.config')
const router = express.Router()

// authentication
router.use(authentication)

// update info
router.post('/:userId', uploadDisk.single('file'), asyncHandler(userController.updateInfo))
router.get('/', asyncHandler(userController.getInfo))

module.exports = router

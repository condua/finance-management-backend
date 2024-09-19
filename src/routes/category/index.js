'use strict'

const express = require('express')
const categoryController = require('../../controllers/category.controller')
const { asyncHandler } = require('../../helpers/asyncHandler')
const { authentication } = require('../../auth/authUtils')
const router = express.Router()

// authentication
router.use(authentication)

// router.get('/', asyncHandler(categoryController.getAllCategories))
router.get('/', asyncHandler(categoryController.getAllCategories))

router.post('', asyncHandler(categoryController.createCategory))
router.patch('/:categoryId', asyncHandler(categoryController.updateCategory))

router.delete('/:categoryId', asyncHandler(categoryController.deleteCategory))


module.exports = router

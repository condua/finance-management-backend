'use strict'

const UserService = require('../services/user.service')
const { CREATED, SuccessResponse } = require('../core/success.response')
const { BadRequestError } = require('../core/error.response')

class UserController {
  updateInfo = async (req, res, next) => {
    const {file } = req
    if (!file) {
      throw new BadRequestError('File is required')
    }
    const { userId } = req.params
    new SuccessResponse({
      message: 'Update info success!',
      metadata: await UserService.updateInfo({userId, user: req.body, file: {
        path: file.path,
        fileName: file.filename,
        folderName: `avatar/${userId}`
      }}),
    }).send(res)
  }
  getInfo = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get info success!',
      metadata: await UserService.getInfo(req.headers['x-client-id']),
    }).send(res)
  }
}

module.exports = new UserController()

'use strict'

const keyTokenModel = require('../models/keyToken.model')
const { Types } = require('mongoose')

class KeyTokenService {
  static createKeyToken = async ({
    userId,
    publicKey,
    privateKey,
    refreshToken,
  }) => {
    try {
      const filter = { user: userId },
        update = { publicKey, privateKey, refreshTokensUsed: [], refreshToken },
        options = { new: true, upsert: true }
      const tokens = await keyTokenModel
        .findOneAndUpdate(filter, update, options)
        .lean()
      return tokens ? tokens.privateKey : null
    } catch (error) {
      return error
    }
  }

  static findByUserId = async (userId) => {
    return await keyTokenModel
      .findOne({ user: Types.ObjectId.createFromHexString(userId) })
  }

  static removeById = async (id) => {
    return await keyTokenModel.deleteOne({ _id: id })
  }

  static findByRefreshTokenUsed = async (refreshToken) => {
    return await keyTokenModel
      .findOne({ refreshTokensUsed: refreshToken })
      .lean()
  }

  static findByRefreshToken = async (refreshToken) => {
    return await keyTokenModel.findOne({ refreshToken: refreshToken })
  }

  static deleteByUserId = async (userId) => {
    return await keyTokenModel.deleteOne({
      user: Types.ObjectId.createFromHexString(userId),
    })
  }
}

module.exports = KeyTokenService

'use strict'

const JWT = require('jsonwebtoken')
const { AuthFailureError, NotFoundError } = require('../core/error.response')
const KeyTokenService = require('../services/keyToken.service')
const { asyncHandler } = require('../helpers/asyncHandler')

 const HEADER = {
  API_KEY: 'x-api-key',
  CLIENT_ID: 'x-client-id',
  AUTHORIZATION: 'authorization',
  REFRESHTOKEN: 'x-rtoken-id',
}

const createTokenPair = async (payload, publicKey, privateKey) => {
  try {
    // access token
    const accessToken = JWT.sign(payload, publicKey, {
      algorithm: 'HS256',
      expiresIn: '2 days',
    })

    const refreshToken = JWT.sign(payload, privateKey, {
      algorithm: 'HS256',
      expiresIn: '7 days',
    })

    return { accessToken, refreshToken }
  } catch (error) {
    return error
  }
}

const authentication = asyncHandler(async (req, res, next) => {
  /*
        1 - get userid from header
        2 - get access token from header
        3 - find Keystore with user in database
        4 - verify token
        5 - ok all => return next()
    */
  const userId = req.headers[HEADER.CLIENT_ID]
  if (!userId) throw new AuthFailureError('Invalid request')
  const keyStore = await KeyTokenService.findByUserId(userId)
  if (!keyStore) throw new AuthFailureError('Auth failure')

  if (
    req.originalUrl === '/v1/api/auth/handlerRefreshToken' &&
    req.headers[HEADER.REFRESHTOKEN]
  ) {
    try {
      
      const refreshToken = req.headers[HEADER.REFRESHTOKEN]
      const decode = verifyJWT(refreshToken, keyStore.privateKey)
      if (decode.userId !== userId) throw new AuthFailureError('Invalid token')
      req.keyStore = keyStore
      req.user = decode
      req.refreshToken = refreshToken
      return next()
    } catch (error) {
      throw error
    }
  }
  const accessToken = req.headers[HEADER.AUTHORIZATION]
  if (!accessToken) throw new AuthFailureError('Invalid request')
    try {
      const decode = verifyJWT(accessToken, keyStore.publicKey)
      if (decode.userId !== userId) throw new AuthFailureError('Invalid token')
      req.keyStore = keyStore
      return next()
    } catch (error) {
      console.log(error)
      throw error
    }

})

const verifyJWT = (accessToken, keySecret) => {
  return JWT.verify(accessToken, keySecret)
}

module.exports = {
  HEADER,
  createTokenPair,
  authentication,
  verifyJWT,
}

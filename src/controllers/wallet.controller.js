'use strict'

const WalletService = require('../services/wallet.service')
const { CREATED, SuccessResponse } = require('../core/success.response')

const HEADER = {
  API_KEY: 'x-api-key',
  CLIENT_ID: 'x-client-id',
  AUTHORIZATION: 'authorization',
}

class WalletController {
  createWallet = async (req, res, next) => {
    console.log(req.body)
    new CREATED({
      message: 'Create wallet success!',
      metadata: await WalletService.createWallet({
        userId: req.headers[HEADER.CLIENT_ID],
        wallet: req.body
      }),
    }).send(res)
  }

  getAllWallets = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get wallets success!',
      metadata: await WalletService.getAllWallets(
        req.headers[HEADER.CLIENT_ID]
      ),
    }).send(res)
  }

  getWalletById = async (req, res, next) => {
    new SuccessResponse({
      message: 'Get wallet success!',
      metadata: await WalletService.getWalletById(
        req.headers[HEADER.CLIENT_ID],
        req.params.id
      ),
    }).send(res)
  }

  updateWallet = async (req, res, next) => {
    new SuccessResponse({
      message: 'Update wallet success!',
      metadata: await WalletService.updateWallet({
        userId: req.headers[HEADER.CLIENT_ID],
        walletId: req.params.id,
        wallet: req.body,
      }),
    }).send(res)
  }

  deleteWalletById = async (req, res, next) => {
    new SuccessResponse({
      message: 'Delete wallet success!',
      metadata: await WalletService.deleteById({
        userId: req.headers[HEADER.CLIENT_ID],
        walletId: req.params.id,
      }),
    }).send(res)
  }
}

module.exports = new WalletController()

"use strict";

const WalletService = require("../services/wallet.service");
const { CREATED, SuccessResponse } = require("../core/success.response");

const HEADER = {
  API_KEY: "x-api-key",
  CLIENT_ID: "x-client-id",
  AUTHORIZATION: "authorization",
};

class WalletController {
  createWallet = async (req, res, next) => {
    new CREATED({
      message: "Create wallet success!",
      metadata: await WalletService.createWallet({
        userId: req.headers[HEADER.CLIENT_ID],
        wallet: req.body,
      }),
    }).send(res);
  };

  getAllWallets = async (req, res, next) => {
    new SuccessResponse({
      message: "Get wallets success!",
      metadata: await WalletService.getAllWallets(
        req.headers[HEADER.CLIENT_ID]
      ),
    }).send(res);
  };

  getWalletById = async (req, res, next) => {
    new SuccessResponse({
      message: "Get wallet success!",
      metadata: await WalletService.getWalletById(
        req.headers[HEADER.CLIENT_ID],
        req.params.id
      ),
    }).send(res);
  };

  updateWallet = async (req, res, next) => {
    new SuccessResponse({
      message: "Update wallet success!",
      metadata: await WalletService.updateWallet({
        userId: req.headers[HEADER.CLIENT_ID],
        walletId: req.params.id,
        wallet: req.body,
      }),
    }).send(res);
  };

  deleteWalletById = async (req, res, next) => {
    new SuccessResponse({
      message: "Delete wallet success!",
      metadata: await WalletService.deleteById({
        userId: req.headers[HEADER.CLIENT_ID],
        walletId: req.params.id,
      }),
    }).send(res);
  };
  inviteMember = async (req, res, next) => {
    try {
      const walletId = req.params.id; // Lấy walletId từ params
      const userId = req.params.inviterId; // Lấy inviterId từ params
      const inviterId = req.headers[HEADER.CLIENT_ID]; // Get userId from custom header

      const result = await WalletService.inviteMember({
        walletId,
        userId,
        inviterId,
      });

      new SuccessResponse({
        message: "User invited successfully!",
        metadata: result,
      }).send(res);
    } catch (error) {
      next(error); // Pass the error to the next middleware (error handler)
    }
  };

  respondToInvitation = async (req, res, next) => {
    try {
      const walletId = req.params.id;
      const userId = req.headers[HEADER.CLIENT_ID];
      const { response } = req.body;
      const result = await WalletService.respondToInvitation({
        walletId,
        userId,
        response,
      });
      new SuccessResponse({
        message: `User ${
          response === "accept" ? "accepted" : "declined"
        } the invitation`,
        metadata: result,
      }).send(res);
    } catch (error) {
      next(error); // Chuyển lỗi cho middleware xử lý lỗi tiếp theo
    }
  };

  sendMessage = async (req, res, next) => {
    try {
      const walletId = req.params.id;
      const userId = req.headers[HEADER.CLIENT_ID];
      const { content, images } = req.body;
      const result = await WalletService.sendMessage({
        walletId,
        userId,
        content,
        images,
      });
      new SuccessResponse({
        message: "User sent message successfully",
        metadata: result,
      }).send(res);
    } catch (error) {
      next(error); // Chuyển lỗi cho middleware xử lý lỗi tiếp theo
    }
  };
  getAllMessagesByWalletId = async (req, res, next) => {
    try {
      const walletId = req.params.id; // Lấy walletId từ tham số URL
      const userId = req.headers[HEADER.CLIENT_ID];

      const messages = await WalletService.getAllMessagesByWalletId({
        walletId,
        userId,
      });

      new SuccessResponse({
        message: "Messages fetched successfully",
        metadata: messages,
      }).send(res);
    } catch (error) {
      next(error); // Chuyển lỗi cho middleware xử lý lỗi tiếp theo
    }
  };
}

module.exports = new WalletController();

"use strict";

const express = require("express");
const walletController = require("../../controllers/wallet.controller");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { authentication } = require("../../auth/authUtils");
const router = express.Router();

// authentication
router.use(authentication);

router.get("", asyncHandler(walletController.getAllWallets));
router.get("/:id", asyncHandler(walletController.getWalletById));
router.post("", asyncHandler(walletController.createWallet));
router.patch("/:id", asyncHandler(walletController.updateWallet));
router.delete("/:id", asyncHandler(walletController.deleteWalletById));

router.post(
  "/:id/invite/:inviterId",
  asyncHandler(walletController.inviteMember)
);

router.post("/:id/respond", asyncHandler(walletController.respondToInvitation));
router.post("/:id/message", asyncHandler(walletController.sendMessage));
router.get(
  "/:id/messages",
  asyncHandler(walletController.getAllMessagesByWalletId)
);

module.exports = router;

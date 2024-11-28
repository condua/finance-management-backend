"use strict";

const express = require("express");
const accessController = require("../../controllers/access.controller");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { authentication } = require("../../auth/authUtils");
const router = express.Router();

// signUp
router.post("/auth/signup", asyncHandler(accessController.signUp));
router.post("/auth/login", asyncHandler(accessController.login));
router.post("/auth/send-email", asyncHandler(accessController.sendEmail));
router.post("/auth/verify-otp", asyncHandler(accessController.verifyOtp));
router.post(
  "/auth/change-password-by-otp",
  asyncHandler(accessController.changePasswordByOtp)
);
router.post("/auth/resend-otp", asyncHandler(accessController.resendOtp));

// authentication
router.use(authentication);

// logout
router.post(
  "/auth/changePassword",
  asyncHandler(accessController.changePassword)
);
router.post("/auth/logout", asyncHandler(accessController.logout));
router.post(
  "/auth/handlerRefreshToken",
  asyncHandler(accessController.handlerRefreshToken)
);

module.exports = router;

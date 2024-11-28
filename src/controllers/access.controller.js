"use strict";

const AccessService = require("../services/access.service");

const { OK, CREATED, SuccessResponse } = require("../core/success.response");

class AccessController {
  /**
   * @description This is the sign up controller
   * @param {Object} req - The request object
   * @param {Object} res - The response object
   * @param {Function} next - The next middleware
   * @returns {Object} - A JSON response
   */
  handlerRefreshToken = async (req, res, next) => {
    new SuccessResponse({
      message: "Get token success!",
      metadata: await AccessService.handlerRefreshToken({
        keyStore: req.keyStore,
        refreshToken: req.refreshToken,
        user: req.user,
      }),
    }).send(res);
  };

  signUp = async (req, res, next) => {
    new CREATED({
      message: "Signup success!",
      metadata: await AccessService.signUp(req.body),
    }).send(res);
  };

  login = async (req, res, next) => {
    new SuccessResponse({
      message: "Login success!",
      metadata: await AccessService.login(req.body),
    }).send(res);
  };

  logout = async (req, res, next) => {
    new SuccessResponse({
      message: "Logout success!",
      metadata: await AccessService.logout(req.keyStore),
    }).send(res);
  };

  changePassword = async (req, res, next) => {
    new SuccessResponse({
      message: "Change password success!",
      metadata: await AccessService.changePassword({
        userId: req.headers["x-client-id"],
        ...req.body,
      }),
    }).send(res);
  };

  test = async (req, res, next) => {
    new SuccessResponse({
      message: "Test success!",
      metadata: { test: "test" },
    }).send(res);
  };

  sendEmail = async (req, res, next) => {
    new SuccessResponse({
      message: "Send email success!",
      metadata: await AccessService.sendEmail(req.body),
    }).send(res);
  };

  verifyOtp = async (req, res, next) => {
    new SuccessResponse({
      message: "OTP verified successfully!",
      metadata: await AccessService.verifyOtp(req.body),
    }).send(res);
  };

  changePasswordByOtp = async (req, res, next) => {
    new SuccessResponse({
      message: "Password changed successfully!",
      metadata: await AccessService.changePasswordByOtp(req.body),
    }).send(res);
  };

  resendOtp = async (req, res, next) => {
    new SuccessResponse({
      message: "OTP resent successfully!",
      metadata: await AccessService.resendOtp(req.body),
    }).send(res);
  };
}

module.exports = new AccessController();

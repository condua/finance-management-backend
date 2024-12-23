"use strict";

const UserService = require("../services/user.service");
const { CREATED, SuccessResponse } = require("../core/success.response");
const { BadRequestError } = require("../core/error.response");

class UserController {
  updateInfo = async (req, res, next) => {
    const { file } = req;

    const userId = req.headers["x-client-id"];
    new SuccessResponse({
      message: "Update info success!",
      metadata: await UserService.updateInfo({
        userId,
        user: {
          name: req.body?.name,
          dob: req.body?.dob,
          gender: req.body?.gender,
          avatar_url: req.body?.avatar_url,
        },
        file: file
          ? {
              path: file.path,
              fileName: file.filename,
              folderName: `avatar/${userId}`,
            }
          : null,
      }),
    }).send(res);
  };
  getInfo = async (req, res, next) => {
    new SuccessResponse({
      message: "Get info success!",
      metadata: await UserService.getInfo(req.headers["x-client-id"]),
    }).send(res);
  };
  getInfoById = async (req, res, next) => {
    const { userId } = req.params;
    new SuccessResponse({
      message: "Get info success!",
      metadata: await UserService.getInfo(userId),
    }).send(res);
  };
  getAllUsers = async (req, res, next) => {
    new SuccessResponse({
      message: "Get info success!",
      metadata: await UserService.getAllUsers(),
    }).send(res);
  };
}

module.exports = new UserController();

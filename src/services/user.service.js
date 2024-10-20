"use strict";
const { path } = require("../app");
const { BadRequestError } = require("../core/error.response");
const userModel = require("../models/user.model");
const {
  getInfoData,
  removeUndefineOrNullObject,
  removeUndefinedFields,
} = require("../utils");
const { uploadImageFromLocal } = require("./upload.service");
const defaultCategories = require("../utils/defaultCategories");
const {
  addMultipleCategories,
} = require("../models/repositories/category.repo");

class UserService {
  static create = async (user) => {
    try {
      const categories = await addMultipleCategories(defaultCategories);
      const newUser = await userModel.create({
        ...user,
        categories: categories.map((category) => category._id),
      });
      return newUser;
    } catch (error) {
      console.error("🚀 ~ UserService ~ create= ~ error:", error);
      throw new Error("Create new user error");
    }
  };

  static updateInfo = async ({ userId, user, file }) => {
    let thumb_url = undefined;
    if (file) {
      const { path, fileName, folderName } = file;
      thumb_url = await uploadImageFromLocal({ path, fileName, folderName });
    }
    const { dob } = removeUndefinedFields(user);
    if (dob && new Date(dob) > new Date()) {
      throw new BadRequestError({
        data: {
          dob: "Date of birth must be less than current date",
        },
      });
    }

    const filter = { _id: userId },
      update = { ...removeUndefinedFields(user), avatar_url: thumb_url },
      options = { new: true, update: true };
    return await userModel.findOneAndUpdate(filter, update, options).lean();
  };

  static findByEmail = async ({
    email,
    select = {
      name: 1,
      email: 1,
    },
  }) => {
    try {
      const foundUser = await userModel
        .findOne({ email })
        // .populate({
        //   path: 'wallets',
        // })
        .select(select)
        .lean();
      return foundUser;
    } catch (error) {
      throw new BadRequestError("User not found");
    }
  };

  static findById = async (userId) => {
    return await userModel.findById(userId);
  };

  static addWalletById = async (userId, walletId) => {
    return await userModel.findOneAndUpdate(
      { _id: userId },
      { $push: { wallets: walletId } },
      { new: true }
    );
  };

  static getInfo = async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new BadRequestError({
        data: {
          userId: "User not found",
        },
      });
    }
    return getInfoData({
      object: user,
      fields: ["_id", "name", "email", "avatar_url", "gender", "dob"],
    });
  };
  static getInfoById = async (userId) => {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new BadRequestError({
        data: {
          userId: "User not found",
        },
      });
    }
    return getInfoData({
      object: user,
      fields: ["_id", "name", "email", "avatar_url", "gender", "dob"],
    });
  };
  static removeWalletById = async (userId, walletId) => {
    return await userModel.findOneAndUpdate(
      { _id: userId },
      { $pull: { wallets: walletId } },
      { new: true }
    );
  };
}

module.exports = UserService;

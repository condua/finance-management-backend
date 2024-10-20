"use strict";

const bycrypt = require("bcrypt");
const crypto = require("node:crypto");
const KeyTokenService = require("./keyToken.service");
const UserService = require("./user.service");
const { createTokenPair, verifyJWT } = require("../auth/authUtils");
const { getInfoData } = require("../utils");
const {
  BadRequestError,
  InternalServerError,
  AuthFailureError,
  ForbiddenError,
} = require("../core/error.response");
const userModel = require("../models/user.model");

class AccessService {
  // check this token used?

  static handlerRefreshToken = async ({ keyStore, refreshToken, user }) => {
    const { userId, email } = user;
    // check token used
    if (keyStore.refreshTokensUsed.includes(refreshToken)) {
      await KeyTokenService.deleteByUserId(userId);
      throw new ForbiddenError("Something went wrong!! Please login again");
    }

    // find token in db
    if (keyStore.refreshToken !== refreshToken)
      throw new AuthFailureError("Invalid token");
    // verify token
    // check user in db
    const foundUser = await UserService.findByEmail({ email });
    if (!foundUser) throw new AuthFailureError("User not found");

    // generate  private key
    const privateKey = crypto.randomBytes(64).toString("hex");
    const publicKey = crypto.randomBytes(64).toString("hex");

    // generate new token pair
    const tokens = await createTokenPair(
      { userId, email },
      publicKey,
      privateKey
    );

    // save keyToken to db
    await keyStore.updateOne({
      $set: {
        refreshToken: tokens.refreshToken,
        publicKey: publicKey,
        privateKey: privateKey,
      },
      $addToSet: {
        refreshTokensUsed: refreshToken,
      },
    });

    return {
      user,
      tokens,
    };
  };

  static logout = async (keyStored) => {
    return await KeyTokenService.removeById(keyStored._id);
  };

  static login = async ({ email, password, refreshToken = null }) => {
    const foundUser = await UserService.findByEmail({
      email,
      select: {
        _id: 1,
        name: 1,
        email: 1,
        password: 1,
        wallets: 1,
        categories: 1,
        avatar_url: 1,
        invitations: 1,
      },
    });
    if (!foundUser) {
      throw new BadRequestError({
        data: {
          email: `User isn\'t exist`,
        },
      });
    }
    const match = await bycrypt.compare(password, foundUser.password);
    if (!match) {
      throw new BadRequestError({
        data: {
          password: "Password is incorrect",
        },
      });
    }

    // generate  private key
    const privateKey = crypto.randomBytes(64).toString("hex");
    const publicKey = crypto.randomBytes(64).toString("hex");

    const { _id: userId } = foundUser;
    const tokens = await createTokenPair(
      { userId, email },
      publicKey,
      privateKey
    );
    try {
      // generate token pair

      // save keyToken to db
      await KeyTokenService.createKeyToken({
        userId,
        publicKey,
        privateKey,
        refreshToken: tokens.refreshToken,
      });
    } catch (error) {
      throw new InternalServerError("Authentication error");
    }
    return {
      user: getInfoData({
        object: foundUser,
        fields: [
          "_id",
          "email",
          "name",
          "wallets",
          "avatar_url",
          "categories",
          "invitations",
        ],
      }),
      tokens,
    };
  };

  static signUp = async ({ name, email, password }) => {
    const existingUser = await UserService.findByEmail({ email });
    if (existingUser) {
      throw new BadRequestError({
        data: {
          email: "Email already exists",
        },
      });
    }

    const passwordHashed = await bycrypt.hash(password, 10);

    const newUser = await UserService.create({
      name,
      email,
      password: passwordHashed,
    });

    if (newUser) {
      // generate public and private key
      const publicKey = crypto.randomBytes(64).toString("hex");
      const privateKey = crypto.randomBytes(64).toString("hex");

      // save keyToken to db
      const keyStored = await KeyTokenService.createKeyToken({
        userId: newUser._id,
        publicKey,
        privateKey,
      });

      if (!keyStored) {
        throw new InternalServerError("Error saving keyToken");
      }

      // create access token and refresh token
      const tokens = await createTokenPair(
        { userId: newUser._id, email },
        publicKey,
        privateKey
      );

      return {
        user: getInfoData({
          object: newUser,
          fields: [
            "_id",
            "name",
            "email",
            "wallets",
            "avatar_url",
            "categories",
          ],
        }),
        tokens,
      };
    }
    throw new InternalServerError("Sign up error");
  };

  static changePassword = async ({ userId, oldPassword, newPassword }) => {
    const foundUser = await UserService.findById(userId);
    if (!foundUser) {
      throw new BadRequestError({
        data: {
          userId: "User not found",
        },
      });
    }

    const match = await bycrypt.compare(oldPassword, foundUser.password);
    if (!match) {
      throw new BadRequestError({
        data: {
          oldPassword: "Password is incorrect",
        },
      });
    }

    const passwordHashed = await bycrypt.hash(newPassword, 10);
    const updatedUser = await userModel.findOneAndUpdate(
      { _id: userId },
      { password: passwordHashed }
    );
    if (!updatedUser) {
      throw new InternalServerError("Change password error");
    }
    return getInfoData({
      object: updatedUser,
      fields: ["_id", "name", "email", "wallets", "avatar_url", "categories"],
    });
  };
}

module.exports = AccessService;

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
const nodemailer = require("nodemailer");

class AccessService {
  static sendEmail = async ({ email }) => {
    const user = await userModel.findOne({ email });
    if (!user) {
      throw new BadRequestError({
        data: {
          email: "User with the provided email does not exist",
        },
      });
    }

    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // Update the user record with the OTP and expiration (5 minutes)
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes from now
    await userModel.updateOne({ email }, { otp, otpExpiry });
    // user.otp = otp;
    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "noreply.ewallet.hcmut@gmail.com",
        pass: "wsxweqdjcbdzenfn",
      },
    });

    // Send OTP email
    const mailOptions = {
      from: {
        name: "WalletPal",
        address: "noreply.ewallet.hcmut@gmail.com",
      },
      to: email,
      subject: "Reset Password OTP",
      // text: `Your OTP for resetting password is: ${otp}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
          <base target="_top">
      </head>
      <body>
          <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
              <div style="margin:50px auto;width:80%;padding:20px 0">
                  <div style="border-bottom:5px solid #eee">
                      <a href="" style="font-size:30px;color: #f7c800;text-decoration:none;font-weight:600">WalletPal</a>
                  </div>
                  <p style="font-size:15px">Hello ${email},</p>
                  <p>Thank you for choosing WalletPal. Use this OTP to change your account password on the WalletPal.</p>
                  <p>Remember, Never share this OTP with anyone.</p>
                  <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
                  <p style="font-size:15px;">Regards,<br />Team WalletPal</p>
                  <hr style="border:none;border-top:5px solid #eee" />
                  <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                      <p>WalletPal Inc</p>
                  </div>
              </div>
          </div>
      </body>
      </html>
  `,
    };

    await transporter.sendMail(mailOptions);
    return { message: "OTP sent successfully" };
  };
  // Verify OTP
  static verifyOtp = async ({ email, otp }) => {
    const user = await userModel.findOne({ email });
    if (!user) {
      throw new BadRequestError("User with the provided email does not exist");
    }
    console.log(user.otp);
    // Check if OTP is valid
    if (user.otp !== otp) {
      throw new BadRequestError("Invalid OTP");
    }

    // Check if OTP has expired
    if (Date.now() > user.otpExpiry) {
      throw new BadRequestError("OTP has expired");
    }

    return { message: "OTP verified successfully" };
  };

  // Change password using OTP
  static changePasswordByOtp = async ({ email, otp, newPassword }) => {
    const user = await userModel.findOne({ email });
    if (!user) {
      throw new BadRequestError({
        data: {
          user: "User with the provided email does not exist",
        },
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      throw new BadRequestError({
        data: {
          otp: "Invalid OTP",
        },
      });
    }

    if (Date.now() > user.otpExpiry) {
      throw new BadRequestError({
        data: {
          otp: "OTP has expired",
        },
      });
    }

    // Hash the new password
    const passwordHashed = await bycrypt.hash(newPassword, 10);

    // Update the password and clear OTP fields
    const updatedUser = await userModel.findOneAndUpdate(
      { email },
      { password: passwordHashed, otp: null, otpExpiry: null },
      { new: true }
    );

    if (!updatedUser) {
      throw new InternalServerError("Password update failed");
    }

    return { message: "Password updated successfully" };
  };
  // Resend OTP to the user's email
  static resendOtp = async ({ email }) => {
    const user = await userModel.findOne({ email });
    if (!user) {
      throw new BadRequestError({
        data: { user: "User with the provided email does not exist" },
      });
    }

    // Generate a new 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // Update the user record with the new OTP and expiration (5 minutes)
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes from now
    await userModel.updateOne({ email }, { otp, otpExpiry });

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "noreply.ewallet.hcmut@gmail.com",
        pass: "wsxweqdjcbdzenfn",
      },
    });

    // Send OTP email
    const mailOptions = {
      from: {
        name: "WalletPal",
        address: "noreply.ewallet.hcmut@gmail.com",
      },
      to: email,
      subject: "Reset Password OTP",
      // text: `Your OTP for resetting password is: ${otp}`,
      html: `
      <!DOCTYPE html>
      <html>
      <head>
          <base target="_top">
      </head>
      <body>
          <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
              <div style="margin:50px auto;width:80%;padding:20px 0">
                  <div style="border-bottom:5px solid #eee">
                      <a href="" style="font-size:30px;color: #f7c800;text-decoration:none;font-weight:600">WalletPal</a>
                  </div>
                  <p style="font-size:15px">Hello ${email},</p>
                  <p>Thank you for choosing WalletPal. Use this OTP to change your account password on the WalletPal.</p>
                  <p>Remember, Never share this OTP with anyone.</p>
                  <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
                  <p style="font-size:15px;">Regards,<br />Team WalletPal</p>
                  <hr style="border:none;border-top:5px solid #eee" />
                  <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                      <p>WalletPal Inc</p>
                  </div>
              </div>
          </div>
      </body>
      </html>
  `,
    };
    await transporter.sendMail(mailOptions);
    return { message: "OTP resent successfully" };
  };
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
          "membership",
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
            "membership",
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
      fields: [
        "_id",
        "name",
        "email",
        "wallets",
        "avatar_url",
        "categories",
        "membership",
      ],
    });
  };
}

module.exports = AccessService;

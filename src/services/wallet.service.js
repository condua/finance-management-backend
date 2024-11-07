"use strict";
const walletModel = require("../models/wallet.model");
const UserServices = require("./user.service");
const messageModel = require("../models/message.model");
const {
  BadRequestError,
  InternalServerError,
} = require("../core/error.response");
const userModel = require("../models/user.model");
const transactionModel = require("../models/transaction.model");
const TransactionService = require("./transaction.service");
const { getInfoData } = require("../utils");
const { deleteAllPlans } = require("../models/repositories/financialPlan.repo");
const {
  deleteAllTransactions,
} = require("../models/repositories/transaction.repo");
const { removeWalletById } = require("../models/repositories/wallet.repo");

const getAllWallets = async (userId) => {
  const foundUser = await UserServices.findById(userId);
  if (!foundUser) {
    throw new BadRequestError({
      data: {
        userId: "User not found",
      },
    });
  }
  const foundWallets = await walletModel.find({
    _id: { $in: foundUser.wallets },
  });
  return foundWallets.map((wallet) =>
    getInfoData({
      object: wallet,
      fields: [
        "_id",
        "name",
        "icon",
        "balance",
        "type",
        "transactions",
        "financial_plans",
        "debts",
        "owner",
        "members",
        "admins",
      ],
    })
  );
};

const createWallet = async ({ userId, wallet }) => {
  const foundUser = await userModel.findOne({ _id: userId }).lean();
  if (foundUser.wallets.length >= 5) {
    throw new InternalServerError("Cannot create more than 5 wallets");
  }
  const { wallets } = await userModel.findOne({ _id: userId }).populate({
    path: "wallets",
    match: { name: wallet.name },
  });
  if (wallets.length !== 0) {
    throw new BadRequestError({
      data: {
        name: "Wallet name already exists",
      },
    });
  }
  // Add the owner field to the wallet object
  wallet.owner = userId;
  wallet.members = [userId];
  const newWallet = await walletModel.create(wallet);
  if (!newWallet) {
    throw new InternalServerError("Cannot create wallet");
  }
  try {
    await UserServices.addWalletById(userId, newWallet._id);
    return getInfoData({
      object: newWallet,
      fields: [
        "_id",
        "icon",
        "name",
        "balance",
        "type",
        "transactions",
        "financial_plans",
        "debts",
        "owner",
        "members",
        "admins",
      ],
    });
  } catch (error) {
    console.error(error);
    await walletModel.deleteOne({ _id: newWallet._id });
    throw new InternalServerError("Cannot create wallet");
  }
};

const findById = async (walletId) => {
  const foundWallet = await walletModel.findById(walletId);
  if (!foundWallet) {
    throw new BadRequestError({ data: { walletId: "Wallet not found" } });
  }
  return getInfoData({
    object: foundWallet,
    fields: [
      "_id",
      "name",
      "balance",
      "type",
      "transactions",
      "financial_plans",
      "debts",
      "owner",
      "members",
      "admins",
    ],
  });
};

const getWalletById = async (userId, walletId) => {
  const foundUser = await UserServices.findById(userId);
  if (!foundUser) {
    throw new BadRequestError({
      data: {
        userId: "User not found",
      },
    });
  }
  const foundWallet = await walletModel.findById(walletId);
  if (!foundWallet) {
    throw new BadRequestError({
      data: {
        walletId: "Wallet not found",
      },
    });
  }
  try {
    return getInfoData({
      object: foundWallet,
      fields: [
        "_id",
        "name",
        "icon",
        "balance",
        "type",
        "transactions",
        "financial_plans",
        "debts",
        "owner",
        "members",
        "admins",
      ],
    });
  } catch (error) {
    console.error("🚀 ~ getWalletById ~ error:", error);
    throw new InternalServerError("Cannot get wallet");
  }
};

const deleteById = async ({ userId, walletId }) => {
  const foundUser = await UserServices.findById(userId);
  if (!foundUser) {
    throw new BadRequestError("Invalid user");
  }
  if (!foundUser.wallets.includes(walletId)) {
    throw new BadRequestError({
      data: {
        walletId: "Wallet not found",
      },
    });
  }
  try {
    const wallet = await walletModel.findById(walletId).lean();
    await deleteAllTransactions(walletId);
    await deleteAllPlans(walletId);
    await removeWalletById(userId, walletId);
    return await walletModel.deleteOne({ _id: walletId });
  } catch (error) {
    console.error(error);
    throw new InternalServerError("Cannot delete wallet");
  }
};

const updateWallet = async ({ userId, walletId, wallet }) => {
  const foundUser = await userModel.findOne({ _id: userId });
  if (!foundUser) {
    throw new BadRequestError({
      data: {
        userId: "User not found",
      },
    });
  }
  if (!foundUser.wallets.includes(walletId)) {
    throw new BadRequestError({
      data: {
        walletId: "Wallet not found",
      },
    });
  }
  const { wallets } = await userModel
    .findOne({ _id: userId })
    .populate({
      path: "wallets",
      match: {
        name: wallet.name,
      },
    })
    .lean();
  if (wallets.length !== 0 && wallets[0]._id != walletId) {
    throw new BadRequestError({
      data: {
        name: "Wallet name already exists",
      },
    });
  }
  try {
    const updateWallet = {
      name: wallet?.name,
      icon: wallet?.icon,
    };
    const updatedWallet = await walletModel.findOneAndUpdate(
      { _id: walletId },
      updateWallet,
      {
        new: true,
      }
    );
    return getInfoData({
      object: updatedWallet,
      fields: [
        "_id",
        "name",
        "icon",
        "balance",
        "type",
        "transactions",
        "financial_plans",
        "debts",
        "owner",
        "members",
        "admins",
      ],
    });
  } catch (error) {
    throw new InternalServerError("Cannot update wallet");
  }
};
const inviteMember = async ({ walletId, userId, inviterId }) => {
  try {
    // Tìm người dùng được mời
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Tìm ví bằng ID
    const wallet = await walletModel.findById(walletId);
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Kiểm tra xem ví có phải loại "shared" không
    if (wallet.type !== "shared") {
      throw new Error("Only shared wallets can have members invited");
    }

    // Kiểm tra xem người mời có phải là owner hoặc admin không
    if (
      wallet.owner.toString() !== inviterId &&
      !wallet.admins.some((admin) => admin.toString() === inviterId)
    ) {
      throw new Error("Only the owner or an admin can invite members");
    }

    // Kiểm tra xem người dùng đã là thành viên chưa
    if (wallet.members.some((member) => member.toString() === userId)) {
      throw new Error("User is already a member of the wallet");
    }

    // Kiểm tra xem người dùng đã được mời trước đó chưa
    const existingInvitation = wallet.invitations.find(
      (invite) => invite.user.toString() === userId
    );
    if (existingInvitation) {
      throw new Error("User has already been invited");
    }

    // Thêm lời mời vào wallet và user
    wallet.invitations.push({ user: userId });
    user.invitations.push({ inviter: inviterId, wallet: walletId });

    // Lưu lại thay đổi
    await wallet.save();
    await user.save();

    return { message: "User invited successfully" };
  } catch (error) {
    console.error("Error inviting member:", error.message);
    throw new Error(error.message);
  }
};
const respondToInvitation = async ({ walletId, userId, response }) => {
  // Tìm ví và người dùng dựa trên ID
  const wallet = await walletModel.findOne({ _id: walletId });
  const user = await userModel.findById(userId);

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  if (!user) {
    throw new Error("User not found");
  }

  // Tìm lời mời trong ví và người dùng
  const invitation = wallet.invitations.find(
    (invite) => invite.user.toString() === userId
  );
  if (!invitation) {
    throw new Error("No invitation found for this user in this wallet");
  }

  const userInvitation = user.invitations.find(
    (invite) => invite.wallet.toString() === walletId
  );
  if (!userInvitation) {
    throw new Error("No invitation found for this wallet in user data");
  }

  if (response === "accept") {
    // Người dùng chấp nhận lời mời
    wallet.members.push(userId);
    wallet.invitations = wallet.invitations.filter(
      (invite) => invite.user.toString() !== userId
    );
    user.invitations = user.invitations.filter(
      (invite) => invite.wallet.toString() !== walletId
    );

    user.wallets.push(walletId); // Thêm ví vào danh sách wallets của người dùng

    await wallet.save();
    await user.save();

    return { message: "User accepted the invitation and joined the wallet" };
  } else if (response === "decline") {
    // Xóa lời mời khỏi ví và người dùng nếu từ chối
    wallet.invitations = wallet.invitations.filter(
      (invite) => invite.user.toString() !== userId
    );
    user.invitations = user.invitations.filter(
      (invite) => invite.wallet.toString() !== walletId
    );

    await wallet.save();
    await user.save();

    return {
      message: "User declined the invitation and the invitation was removed",
    };
  } else {
    throw new Error("Invalid response");
  }
};

const sendMessage = async ({ userId, walletId, content, images }) => {
  try {
    // Kiểm tra sự tồn tại của ví
    const wallet = await walletModel.findById(walletId);
    if (!wallet) {
      throw new BadRequestError("Wallet not found");
    }

    // Kiểm tra người dùng có tồn tại và có quyền gửi tin nhắn không
    const user = await userModel.findById(userId);
    if (!user || !wallet.members.includes(userId)) {
      throw new BadRequestError("User not authorized to send message");
    }
    const newMessage = await messageModel.create({
      userId: user._id,
      name: user.name, // Lấy tên người dùng từ object User
      walletId,
      content,
      images,
    });

    wallet.messages.push(newMessage._id);
    await wallet.save();

    return newMessage;
  } catch (error) {
    console.error("Error sending message:", error.message);
    throw new InternalServerError("Cannot send message");
  }
};
const getAllMessagesByWalletId = async ({ walletId, userId }) => {
  try {
    const wallet = await walletModel.findById(walletId);
    if (!wallet) {
      throw new BadRequestError("Wallet not found");
    }
    if (!wallet.members.includes(userId)) {
      throw new BadRequestError("User not authorized to access messages");
    }
    const user = await userModel.findById(userId);
    if (!user || !wallet.members.includes(userId)) {
      throw new BadRequestError("User not authorized to get messages");
    }

    const messages = await messageModel
      .find({ walletId })
      .sort({ createdAt: -1 });
    return messages;
  } catch (error) {
    console.error("Error getting messages:", error.message);
    throw new InternalServerError("Cannot get messages");
  }
};

// Nâng cấp quyền thành viên thành admin
const promoteToAdmin = async ({ walletId, memberId, ownerId }) => {
  const wallet = await walletModel.findById(walletId);

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  // Kiểm tra nếu ownerId đúng với owner của ví
  if (wallet.owner.toString() !== ownerId) {
    throw new Error(
      "Invalid ownerId. Only the owner can promote members to admin"
    );
  }

  // Kiểm tra nếu người dùng có phải là thành viên của ví nhóm
  if (!wallet.members.includes(memberId)) {
    throw new Error("User is not a member of this wallet");
  }

  // Kiểm tra nếu người dùng đã là admin
  if (wallet.admins.includes(memberId)) {
    throw new Error("User is already an admin");
  }

  // Thêm người dùng vào danh sách admin
  wallet.admins.push(memberId);
  await wallet.save();

  return getInfoData({
    object: wallet,
    fields: [
      "_id",
      "icon",
      "name",
      "balance",
      "type",
      "transactions",
      "financial_plans",
      "debts",
      "owner",
      "members",
      "admins",
    ],
  });

  // Giáng cấp quyền admin xuống thành viên thường
  const demoteFromAdmin = async ({ walletId, memberId, ownerId }) => {
    const wallet = await walletModel.findById(walletId);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Kiểm tra nếu ownerId đúng với owner của ví
    if (wallet.owner.toString() !== ownerId) {
      throw new Error("Invalid ownerId. Only the owner can demote admins");
    }

    // Kiểm tra nếu người dùng có phải là admin của ví
    if (!wallet.admins.includes(memberId)) {
      throw new Error("User is not an admin");
    }

    // Xóa người dùng khỏi danh sách admin
    wallet.admins = wallet.admins.filter(
      (adminId) => adminId.toString() !== memberId
    );
    await wallet.save();

    return getInfoData({
      object: wallet,
      fields: [
        "_id",
        "icon",
        "name",
        "balance",
        "type",
        "transactions",
        "financial_plans",
        "debts",
        "owner",
        "members",
        "admins",
      ],
    });
  };
};

module.exports = {
  getAllWallets,
  createWallet,
  findById,
  getWalletById,
  deleteById,
  updateWallet,
  inviteMember,
  respondToInvitation,
  sendMessage,
  getAllMessagesByWalletId,
  promoteToAdmin,
};

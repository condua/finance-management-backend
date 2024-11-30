const categoryModel = require("../models/category.model");
const {
  InternalServerError,
  NotFoundError,
  BadRequestError,
} = require("../core/error.response");
const UserService = require("./user.service");
const { getInfoData } = require("../utils");
const userModel = require("../models/user.model");
const { Types } = require("mongoose");
const { toPlainObject } = require("lodash");
const {
  deleteAllTransactionByCategory,
} = require("../models/repositories/transaction.repo");
const transactionModel = require("../models/transaction.model");
const { budgetModel } = require("../models/financialPlan.model");
const TransactionService = require("./transaction.service");
const walletModel = require("../models/wallet.model");
const {
  updateBudgetWhenCategoryDeleted,
} = require("../models/repositories/financialPlan.repo");

// create unique category, update unique category

const CATEGORY_DATA = ["_id", "name", "type", "icon"];

class CategoryService {
  static async getAllCategories({ userId, filter }) {
    // filter = ['income', 'expense']
    try {
      const { categories } = await userModel
        .findOne({ _id: userId })
        .populate({
          path: "categories",
          match: {
            type: { $in: !!filter ? filter : ["income", "expense"] },
          },
        })
        .lean();
      return categories.map((category) =>
        getInfoData({ object: category, fields: CATEGORY_DATA })
      );
    } catch (error) {
      console.error("🚀 ~ CategoryService ~ getAllCategories ~ error:", error);
      throw new InternalServerError("Get all categories error");
    }
  }

  static async createCategory({ userId, category }) {
    const { categories } = await userModel.findOne({ _id: userId }).populate({
      path: "categories",
      match: { name: category.name },
    });
    if (categories.length !== 0) {
      throw new BadRequestError({
        data: {
          name: "Category name already exists",
        },
      });
    }
    try {
      const newCategory = await categoryModel.create(category);
      if (!newCategory) {
        throw new InternalServerError("Create new category error");
      }
      await userModel.findOneAndUpdate(
        { _id: userId },
        { $push: { categories: newCategory._id } }
      );
      return getInfoData({
        object: newCategory,
        fields: CATEGORY_DATA,
      });
    } catch (error) {
      console.error("🚀 ~ CategoryService ~ createCategory ~ error:", error);
      throw new InternalServerError("Create new category error");
    }
  }
  static async getCategoryById({ userId, categoryId }) {
    try {
      // Kiểm tra xem user có tồn tại và sở hữu category không
      const foundUser = await userModel.findOne({ _id: userId }).lean();
      if (!foundUser) {
        throw new NotFoundError({
          data: {
            userId: "User not found",
          },
        });
      }

      // Kiểm tra xem categoryId có thuộc user không
      const isCategoryOwned = foundUser.categories.some(
        (catId) => catId.toString() === categoryId
      );
      if (!isCategoryOwned) {
        throw new NotFoundError({
          data: {
            categoryId: "Category not found or does not belong to the user",
          },
        });
      }

      // Tìm category theo ID
      const category = await categoryModel.findOne({ _id: categoryId }).lean();
      if (!category) {
        throw new NotFoundError({
          data: {
            categoryId: "Category not found",
          },
        });
      }

      // Trả về thông tin category
      return getInfoData({
        object: category,
        fields: CATEGORY_DATA,
      });
    } catch (error) {
      console.error("🚀 ~ CategoryService ~ getCategoryById ~ error:", error);
      throw new InternalServerError("Get category by ID error");
    }
  }

  static async updateCategory({ userId, categoryId, update }) {
    const { categories } = await userModel.findOne({ _id: userId }).populate({
      path: "categories",
      match: { name: update.name, _id: { $ne: categoryId } },
    });
    if (categories.length !== 0) {
      throw new BadRequestError({
        data: {
          name: "Category name already exists",
        },
      });
    }
    const foundCategory = await categoryModel.findOne({ _id: categoryId });
    if (!foundCategory) {
      throw new BadRequestError({
        data: {
          categoryId: "Category not found",
        },
      });
    }
    try {
      const updatedCategory = await categoryModel.findOneAndUpdate(
        { _id: categoryId },
        { $set: update },
        { new: true, upsert: true }
      );
      return getInfoData({
        object: updatedCategory,
        fields: CATEGORY_DATA,
      });
    } catch (error) {
      console.error("🚀 ~ CategoryService ~ updateCategory ~ error:", error);

      throw new InternalServerError("Update category error");
    }
  }

  static async deleteCategory({ userId, categoryId }) {
    const foundUser = await userModel.findOne({ _id: userId });

    if (!foundUser) {
      throw new BadRequestError({
        data: {
          userId: "User not found",
        },
      });
    }
    if (
      !foundUser.categories.includes(
        Types.ObjectId.createFromHexString(categoryId)
      )
    ) {
      throw new BadRequestError({
        data: {
          categoryId: "Category not found",
        },
      });
    }
    try {
      const deletedCategory = await categoryModel.deleteOne({
        _id: categoryId,
      });
      if (!deletedCategory) {
        throw new InternalServerError("Delete category error");
      }
      await userModel.findOneAndUpdate(
        { _id: userId },
        { $pull: { categories: categoryId } }
      );
      const transactions = await transactionModel
        .find({ category: categoryId })
        .lean();
      const transactionIds = transactions.map((transaction) => transaction._id);
      const foundWallet = await walletModel.findOne({
        transactions: { $in: transactionIds },
      });
      if (!foundWallet) {
        return deletedCategory;
      }
      for (let id of transactionIds) {
        await TransactionService.deleteTransactionById({
          userId,
          walletId: foundWallet._id,
          transactionId: id,
        }); // auto update budget
      }
      await deleteAllTransactionByCategory(categoryId);
      await updateBudgetWhenCategoryDeleted(categoryId);
      return deletedCategory;
    } catch (error) {
      console.error("🚀 ~ CategoryService ~ deleteCategory ~ error:", error);
      throw new InternalServerError("Delete category error");
    }
  }
}

module.exports = CategoryService;

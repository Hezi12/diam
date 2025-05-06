const mongoose = require('mongoose');

/**
 * סכמה לקטגוריות הוצאות
 */
const ExpenseCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ExpenseCategory', ExpenseCategorySchema); 
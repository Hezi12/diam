const mongoose = require('mongoose');

/**
 * סכמה לקטגוריות הכנסות
 */
const IncomeCategorySchema = new mongoose.Schema(
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

module.exports = mongoose.model('IncomeCategory', IncomeCategorySchema); 
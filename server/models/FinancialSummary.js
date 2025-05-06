const mongoose = require('mongoose');

/**
 * סכמה לסיכום פיננסי
 * מנהלת מעקב אחר יתרות באמצעי תשלום שונים
 */
const FinancialSummarySchema = new mongoose.Schema(
  {
    paymentMethod: {
      type: String,
      enum: [
        'cash',
        'credit_rothschild',
        'credit_or_yehuda',
        'transfer_poalim',
        'transfer_mizrahi',
        'bit_poalim',
        'bit_mizrahi',
        'paybox_poalim',
        'paybox_mizrahi',
        'other'
      ],
      required: true,
      unique: true
    },
    initialBalance: {
      type: Number,
      default: 0
    },
    currentBalance: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('FinancialSummary', FinancialSummarySchema); 
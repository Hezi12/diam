const mongoose = require('mongoose');

/**
 * סכמה להוצאות
 * מתעדת הוצאות בעסק לפי קטגוריות ואמצעי תשלום
 */
const ExpenseSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    category: {
      type: String,
      required: true
    },
    location: {
      type: String,
      enum: ['airport', 'rothschild', 'both'],
      required: true
    },
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
        'delayed_transfer',
        'other'
      ],
      required: true
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    receipt: {
      type: String
    },
    notes: {
      type: String
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Expense', ExpenseSchema); 
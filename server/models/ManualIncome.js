const mongoose = require('mongoose');

/**
 * סכמה להכנסות ידניות
 * מתעדת הכנסות ידניות שלא באות מהזמנות חדרים
 */
const ManualIncomeSchema = new mongoose.Schema(
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IncomeCategory',
      required: false
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

module.exports = mongoose.model('ManualIncome', ManualIncomeSchema); 
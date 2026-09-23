const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    phone: { type: String, default: '' },
    gender: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    avatar: { type: String, default: '' },
    paymentMethods: [
      {
        type: { type: String, enum: ['upi', 'card', 'netbanking', 'wallet'] },
        upiId: String,
        bankName: String,
        accountName: String,
        accountNumber: String,
        ifsc: String,
        cardholderName: String,
        last4: String,
        expiryMonth: String,
        expiryYear: String,
        cardBrand: String,
        walletName: String,
        isDefault: { type: Boolean, default: false }
      }
    ],
    wallet: {
      balance: { type: Number, default: 0, min: 0 }
    },
    otp: {
      code: { type: String, default: '' },
      purpose: { type: String, default: '' },
      expiresAt: { type: Date, default: null }
    },
    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    shoppingProfile: {
      budget: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 10000 },
        tier: { type: String, enum: ['budget', 'mid-range', 'premium', 'any'], default: 'any' }
      },
      brands: { type: [String], default: [] },
      sizes: {
        clothing: { type: String, default: 'M' },
        footwear: { type: String, default: 'UK 8' },
        bottoms: { type: String, default: '32' }
      },
      categories: { type: [String], default: [] },
      styles: { type: [String], default: [] },
      occasions: { type: [String], default: [] }
    },
    darwinMemory: {
      enabled: { type: Boolean, default: true },
      memories: [
        {
          key: { type: String, required: true },
          value: { type: String, required: true },
          confidence: { type: Number, default: 0.9 },
          source: { type: String, default: 'user_stated' },
          updatedAt: { type: Date, default: Date.now }
        }
      ],
      recentBrowsedCategories: { type: [String], default: [] },
      recentBrowsedProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);

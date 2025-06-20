const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  receiptId: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    service: String,
    quantity: Number,
    pricePerUnit: Number,
    subtotal: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  tax: Number,
  discount: Number,
  finalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


receiptSchema.methods.generatePDF = async function() {
  return null;
};

module.exports = mongoose.model('Receipt', receiptSchema); 